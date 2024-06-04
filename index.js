// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);

import express from "express";

const app = express();

// 路由設定, routes
// 1. get(): 只接受 HTTP GET 方法的拜訪
// 2. 只接受 路徑為 / 的 request
app.get("/", (req, res) => {
  res.send("<h2>Hello World</h2>");
});

app.use((req, res) => {
  res.send("<h2>您走錯路了</h2>");
});
// ****放在所有路由後面********
// 404 頁面
const port = process.env.WEB_PORT || 3002;
app.listen(port, () => {
  console.log(`伺服器啟動了, port:${port}`);
});
