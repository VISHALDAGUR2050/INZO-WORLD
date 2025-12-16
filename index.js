const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h1>INZO WORLD is Live 🚀</h1>");
});

server.listen(3000);
