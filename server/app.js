var http = require("http");
var index = require("./index.js");
http.createServer(index).listen(1337);