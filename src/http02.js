import http from "node:http";
import { writeFile } from "node:fs/promises";

const server = http.createServer(async (req, res) => {
  const str = JSON.stringify(req.headers, null, 4);
  await writeFile("./headers.txt", str);

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
  });
  end(str);
});

server.listen(3000);
