var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var crypto = require("crypto")
var fs = require("fs");
var jade = require("jade");
var shares = {};
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
try {
  shares = JSON.parse(fs.readFileSync("shares.json"));
} catch(e) {
  shares = {};
  writeShares();
}

function genRedirect(base) {
  return `<script>
            setTimeout(function() {
             window.location.pathname = "/shares/${base}";
            }, 5000);
          </script>`;
}

function writeShares() {
  fs.writeFileSync("shares.json", JSON.stringify(shares, null, "\t"), "utf8");
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/static"))

app.post("/exists", function(req, res) {
  checkExists(req, res);
});


// Registration should be handled from the chrome extension, so the webservers registration page isn't important
app.get("/register", function(req, res) {
  res.send(`<form method="post">
              <input type="text" name="key">
              <input type="submit">
            </form>`);
});

app.get("/search/:key", function(req, res) {
  var q = req.query.q;
  var key = req.params.key;
  if(!key || !shares[key]) {
    return res.status(404).send(`<h1>Could not find share: ${key || "<none_specified>"}</h1>`);
  }
  if(!q || q === "") {
    return res.status(400).send(`<script>
                                  setTimeout(function() {
                                   window.location.pathname = "/shares/${key}";
                                  }, 5000);
                                 </script>
                                 <h1>No query specified, returning</h1>`);
  }
  res.render("search", {shares: search(shares[key], q), key: key})
});

function search(items, q) {
  var matches = [];
  for(var i = 0; i < items.length; i++) {
    var el = items[i];
    if(el.name.indexOf(q) != -1 || el.url.indexOf(q) != -1) {
      matches.push(el);
    }
  }
  return matches;
}

function getShares(base) {
  if(shares[base]) {
    var start = shares[base].shares;
    for(var i = 0; i < shares[base].copied.length; i++) {
      start = shares[base].copied
    }
  } else {
    return [];
  }
}

app.get("/remove/:key/:index", function(req, res) {
  var key = req.params.key;
  var i = req.params.index;
  if(shares[key].removed.indexOf(i) === -1)
    shares[key].removed[i] = true;
  res.send({success: true});
});

app.post("/copy", function(req, res, next) {
  var src = req.body.src;
  var dest = req.body.dest;
  if(src && dest && shares[src] && shares[dest]) {
    if(src === dest) {
      return res.status(400).send(`${genRedirect(src)}Cannot copy to self`);
    }
    // shares[dest] = shares[dest].concat(shares[src]);
    copy(src, dest);
    writeShares()
    res.send({success: true});
  } else {
    var missing = shares[dest] === undefined ? dest : src;
    res.status(404).send(`${genRedirect("")}Could not find key: ${missing}`);
  }
});

function copy(src, dest) {
  if(shares[dest].copies.indexOf(src) == -1)
    shares[dest].copies.push(src);
}

app.post("/register", function(req, res) {
  checkExists(req, res, null, function() {
    var key = req.body.key;
    console.log(key)
    shares[key] = {copies: [], shares: []}
    res.send({success: true});
    writeShares();
  });
});

function checkExists(req, res, next, cb) {
  var key = req.body.key;
  if(key == undefined) {
    return res.status(400).send({err: "ERR_NO_KEY"});
  }
  if(shares[key] != undefined) {
    return res.send({exists: true});
  } else if(next === null && cb) {
    cb();
  } else {
    res.send({exists: false})
  }
}

app.post("/add", function(req, res) {
  var key = req.body.key;
  var url = req.body.url;
  var name = req.body.name || url;
  console.log(req.body);
  if(!key || !shares[key]) {
    return res.status(404).send(`No key ${key} found`);
  } else if(!url) {
    return res.status(400).send(`No URL Provided`);
  } else {
    shares[key].shares.push({name: name, url: url, added: new Date().getTime(), key: key, index: shares[key].shares.length});
    res.json({success: true})
    writeShares();
  }
});

app.get("/shares/:key.json", function(req, res) {
  var key = req.params.key;
  if(!shares[key]) {
    return res.send(404).send({err: "SHARE_NOT_FOUND"});
  } else {
    res.json(getShares(key));
  }
});

function getShares(base, exclude) {
  exclude = exclude || [];
  exclude.concat([base]);
  var ret = shares[base].shares || [];
  for(var i = 0 ; i < (shares[base].copies || []).length; i++) {
    var copy = shares[base].copies[i];
    if(exclude.indexOf(copy) == -1 && shares[copy]) {
      ret.concat(getShares(copy, exclude));
    }
  }
  ret = ret.sort(sortByTime);
  return ret;
}

function sortByTime(a, b) {
  if(a.added > b.added)
    return 1;
  else if(a.added == b.added)
    return 0;
  return -1;
}

app.get("/shares/:key", function(req, res, next) {
  var key = req.params.key;
  console.log(key);
  if(shares[key]) {
    res.render("keyview", {shares: getShares(key), key: key})
  } else {
    return res.send(404).send(`Share: ${key} not found`);
  }
});

module.exports = app;

Object.prototype.extend = function() {
  var ret = {};
  for(var i = 0 ; i < arguments.length; i++) {
    for(var p in arguments[i]) {
      if(arguments[i].hasOwnProperty(p)) {
        this[p] = arguments[i][[p]];
      }
    }
  }
};

Object.prototype.combine = function() {
  var ret = {};
  for(var p in this) {
    if(this.hasOwnProperty(p)) {
      ret[p] = this[p];
    }
  }
  for(var i = 0 ; i < arguments.length; i++) {
    for(var p in arguments[i]) {
      if(arguments[i].hasOwnProperty(p)) {
        ret[p] = arguments[i][[p]];
      }
    }
  }
  return ret;
};

function combine() {
  var ret = {};
  for(var i = 0 ; i < arguments.length; i++) {
    for(var p in arguments[i]) {
      if(arguments[i].hasOwnProperty(p)) {
        ret[p] = arguments[i][[p]];
      }
    }
  }
  return ret;
}