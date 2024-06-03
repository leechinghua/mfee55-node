import http from "node:http";

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
  });
  res.end(`<h2>你好</h2><p>${req.url}</p>`);
  // 輸出內容
  // 如不標明類別則默認是文字
});

server.listen(3000);
