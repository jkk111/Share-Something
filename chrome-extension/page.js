var server = "http://localhost:8080";
var secureServer = "https://localhost:8443";
chrome.runtime.onMessage.addListener(function(req, sender, res) {
  if(req.type == "openNameInput") {
    promptForName(req.name, function(name) {
      res(name);
    });
    return true;
  }
});

function promptForName(name, cb) {
  getShareSomethingKey(function(key) {
    var form = document.createElement("form");
    form.style.position = "fixed";
    form.style.left = "50%";
    form.style.top = "50%";
    form.style.padding = "16px";
    form.style.transform = "translate3d(-50%, -50%, 0)";
    form.style.backgroundColor = "pink";
    form.style.zIndex = "9999999";
    var label = document.createElement("label");
    label.innerHTML = "Share Name:";
    form.appendChild(label);
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = name;
    form.style.color = "black";
    form.appendChild(nameInput);
    var submitButton = document.createElement("input");
    submitButton.type = "submit";
    form.appendChild(submitButton);
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      e.stopPropagation();
      form.parentElement.removeChild(form);
      cb({name: nameInput.value, key: key});
    });
    document.body.appendChild(form);
    nameInput.focus();
  })
}

function getShareSomethingKey(cb) {
  chrome.storage.sync.get("share_something_key", function(vals) {
    if(vals.share_something_key) {
      cb(vals.share_something_key);
    } else {
      promptForRegistration(cb);
    }
  })
}

function promptForRegistration(cb) {
  var form = document.createElement("form");
  form.style.position = "fixed";
  form.style.left = "50%";
  form.style.top = "50%";
  form.style.padding = "16px";
  form.style.transform = "translate3d(-50%, -50%, 0)";
  form.style.backgroundColor = "blue";
  form.style.zIndex = "9999999";
  var label = document.createElement("label");
  label.innerHTML = "Register User Name";
  form.appendChild(label);
  var keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.value = name;
  keyInput.oninput = function() {
    console.log(keyInput.value);
    checkNameValid(keyInput.value, function(res) {
      if(res.exists) {
        keyInput.style.color = "red";
      } else {
        keyInput.style.color = "green";
      }
    });
  }
  form.style.color = "black";
  form.appendChild(keyInput);
  var submitButton = document.createElement("input");
  submitButton.type = "submit";
  form.appendChild(submitButton);
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    e.stopPropagation();
    checkNameValid(keyInput.value, function(res) {
      if(!res.exists) {
        chrome.storage.sync.set({share_something_key: keyInput.value}, function() {
          var xhr = new XMLHttpRequest();
          xhr.open("POST", `${getDomain()}/register`, true);
          xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
          xhr.onload = function() {
            var res = JSON.parse(this.responseText);
            if(res.success) {
              form.parentElement.removeChild(form);
              cb(keyInput.value);
            } else {
              keyInput.style.color = "red";
            }
          }
          xhr.send(encodeObj({key: keyInput.value}));
        });
      } else {
        keyInput.style.color = "red";
      }
    })
  });
  document.body.appendChild(form);
  keyInput.focus();
}

function checkNameValid(name, cb) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", `${getDomain()}/exists`, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
  xhr.onload = function() {
    var res = JSON.parse(this.responseText);
    cb(res);
  }
  xhr.send(encodeObj({key: name}));
}

function encodeObj(obj) {
  if(typeof obj != "object")
    return "";
  var str = "";
  var keys = Object.keys(obj);
  for(var i = 0; i < keys.length; i++) {
    if(i > 0)
      str +="&"
    str += encodeURIComponent(keys[i]) + "=" + encodeURIComponent(obj[keys[i]]);
  }
  console.log(str);
  return str;
}

function getDomain() {
  if(window.protocol === "http:") {
    return server;
  } else {
    return secureServer;
  }
}