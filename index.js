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

app.listen(3000, ()=>{
  console.log(`伺服器啟動了`);
})
