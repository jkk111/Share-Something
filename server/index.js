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

app.get("/remove/:key/:index", function(req, res) {
  var key = req.params.key;
  var i = req.params.index;
  shares[key][i].removed = true;
  res.send({success: true});
})

app.post("/register", function(req, res) {
  checkExists(req, res, null, function() {
    var key = req.body.key;
    console.log(key)
    shares[key] = [];
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
    shares[key].push({name: name, url: url});
    res.json({success: true})
    writeShares();
  }
});

app.get("/shares/:key.json", function(req, res) {
  var key = req.params.key;
  if(!shares[key]) {
    return res.send(404).send({err: "SHARE_NOT_FOUND"});
  } else {
    res.json(shares[key]);
  }
})

app.get("/shares/:key", function(req, res, next) {
  var key = req.params.key;
  console.log(key);
  if(shares[key]) {
    res.render("keyview", {shares: shares[key], key: key})
  } else {
    return res.send(404).send(`Share: ${key} not found`);
  }
});

module.exports = app;