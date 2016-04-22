var fs = require("fs");
var http = require("http");
var index = require("./index.js");
http.createServer(index).listen(process.argv[2] || 80, function() {
  console.info("Listening on http, port:", process.argv[2] || 80)
});
try {
  var opts = {
    key: fs.readFileSync(__dirname + "/ssl.key"),
    cert: fs.readFileSync(__dirname + "/ssl.crt"),
    ca: fs.readFileSync(__dirname + "/root.crt")
  }
  var https = require("https");
  https.createServer(opts, index).listen(process.argv[3] || 443, function() {
    console.info("Listening on https, port:", process.argv[3] || 443);
  });
} catch(e) {
  console.error("Cerificates not found, starting in http only mode", e);
  http.createServer(index).listen(process.argv[3] || 443)
}