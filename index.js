// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);

import express from "express";

const app = express();
// 註冊樣板引擎
app.set("view engine", "ejs");
// 路由設定, routes
// 1. get(): 只接受 HTTP GET 方法的拜訪
// 2. 只接受 路徑為 / 的 request
app.get("/", (req, res) => {
  // res.send("<h2>Hello World</h2>");
  res.render("home", {name: "chinghua"})
});

// app.get("/a.html", (req, res) => {
//   res.send("<h2>假的a.html</h2>");
// });

// ****設定靜態內容資料夾********
app.use(express.static("public"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));

// ****放在所有路由後面********
// 404 頁面
app.use((req, res) => {
  res.send("<h2>您走錯路了</h2>");
});
const port = process.env.WEB_PORT || 3002;
app.listen(port, () => {
  console.log(`伺服器啟動了, port:${port}`);
});
