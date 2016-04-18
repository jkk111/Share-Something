document.addEventListener("DOMContentLoaded", function() {
  console.log("hello world");
  var key = "jkk111"; // temporary will change to chrome storage
  chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {type: "openNameInput", name: tab.title}, function(name) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:1337/add", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        xhr.send(encodeObj({key: key, name: name.name, url: tab.url}));
      });
    });
  });
});
// Makes it easier to encode an object for xhr
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
  return str;
}