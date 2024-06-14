// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);

import express from "express";
import multer from "multer";
import sales from "./data/sales.js";
import upload from "./utils/upload-imgs.js";
import admin2Router from "./route/admin2.js";
import abRouter from "./route/address-book.js";
import cart2Router from "./route/cart2.js";
import session from "express-session";
import mysql_session from "express-mysql-session";
import moment from "moment-timezone";
import db from "./utils/connect-mysql.js";
import { z } from "zod";
import cors from "cors";
import bcrypt from "bcrypt";
// const upload = multer({ dest: "tmp_uploads/" });
const app = express();
// 註冊樣板引擎
const MysqlStore = mysql_session(session);
const sessionStore = new MysqlStore({}, db);
app.set("view engine", "ejs");

const corsOption = {
  credential: true,
  origin: (origin, callback) => {
    console.log({ origin });
    callback(null, true);
    // 允許所有網站取得資源
  },
};
// app.use(cors(corsOptions));

app.use(cors());
app.use(express.urlencoded({ extended: true }));
// extended 選項決定了解析查詢字符串時使用的庫：
// true：使用 qs 庫，支持深層嵌套的對象。
// false：使用內置的 querystring 庫，不支持深層嵌套的對象。

app.use(express.json());
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    // name:'super.mario', // cookie (session id) 的名稱
    secret: "sWODJIEjn45652871wjiji",
    // cookie: {
    //   maxAge: 1200_000
    // }
    store: sessionStore,
  })
);

app.use((req, res, next) => {
  // res.send("<p>直接被中斷</p>"); // 不應該回應
  res.locals.session = req.session; //
  res.locals.title = "小新的網站"; // 預設的頁面 title
  res.locals.pageName = "";
  next();
});
app.use("/address-book", abRouter);
// 路由設定, routes
// 1. get(): 只接受 HTTP GET 方法的拜訪
// 2. 只接受 路徑為 / 的 request
app.get("/", (req, res) => {
  // res.send("<h2>Hello World</h2>");
  res.render("home", { name: "chinghua" });
});

app.get("/json-sales", (req, res) => {
  res.locals.title = "JSON-SALES | " + res.locals.title;
  res.locals.pageName = "json-sales";
  // res.json(salesArray);
  res.render("json-sales", { sales });
});

// 測試queryString參數
app.get("/try-qs", (req, res) => {
  res.json(req.query);
});

app.get("/try-post-form", (req, res) => {
  res.locals.title = "測試表單 | " + res.locals.title;
  res.locals.pageName = "tpf";
  // res.render("try-post-form", { account: "", password: "" });
  res.render("try-post-form");
});

// middleware: 中介軟體,中介處函式
// const urlencodedParser = express.urlencoded({extended: true})
app.post("/try-post-form", (req, res) => {
  // 經過parser後，
  res.render("try-post-form", req.body);
});

app.post("/try-post", (req, res) => {
  // 經過parser後，
  res.json(req.body);
});

// 測試上傳單一個檔案
app.post("/try-upload", upload.single("avatar"), (req, res) => {
  res.json(req.file);
  res.json({
    file: req.file,
    body: req.body,
  });
});

app.post("/try-uploads", upload.array("photos", 10), (req, res) => {
  res.json(req.files);
});
// 特定的路徑放前面
app.get("/my-params1/abcd", (req, res) => {
  res.json({ path: "/my-params1/abcd" });
});

// 路徑參數
app.get("/my-params1/:action?/:id?", (req, res) => {
  res.json(req.params);
});

app.get(/^\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res) => {
  let u = req.url.split("?")[0]; // 只要 ? 前面那段
  u = u.slice(3); // 前面的三個字元不要
  u = u.split("-").join("");
  res.json({ 手機: u });
});

app.use("/admins", admin2Router);
app.use("/cart2", cart2Router);

app.get("/try-sess", (req, res) => {
  // req.session.my_num = req.session.my_num || 0;
  req.session.my_num ||= 0;
  req.session.my_num++;
  res.json(req.session);
});

app.get("/try-moment", (req, res) => {
  const fm = "YYYY-MM-DD HH:mm:ss";
  const m1 = moment();
  const m2 = moment("2024-2-29");
  const m3 = moment("2024-5-35");

  res.json({
    m1: m1.format(fm),
    m2: m2.format(fm),
    m3: m3.format(fm),
    m1v: m1.isValid(), // 是不是有效的日期
    m2v: m2.isValid(),
    m3v: m3.isValid(),
    m1z: m1.tz("Europe/London").format(fm),
    m2z: m2.tz("Europe/London").format(fm),
  });
});

app.get("/try-db", async (req, res) => {
  const sql = "SELECT * FROM address_book LIMIT 3";
  // const [rows, fields] = await db.query(sql);
  const [rows] = await db.query(sql);
  res.json(rows);
});

// zod套件測試
app.get("/zod-email/:email", async (req, res) => {
  const emailSchema = z.string().email({ message: "錯誤的email格式" });
  const result = emailSchema.safeParse(req.params.email);
  res.json(result);
});

app.get("/zod2/:index?", async (req, res) => {
  const index = +req.params.index || 0;
  const schema = z.object({
    account: z.string().email({ message: "錯誤的email格式" }),
    password: z.string().min(6, "最少6個字元").max(20, "最多20個字元"),
  });
  const ar = [
    {
      account: "shinder",
      password: "12345",
    },
    {
      account: "shinder@test.com",
      password: "12345398453984598sjhfsjfj3845",
    },
    {
      account: "shinder@test.com",
      password: "123fsjfj3845",
    },
  ];

  const result = schema.safeParse(ar[index]);

  res.json(result);
});

app.get("/login", async (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  const output = {
    success: false,
    code: 0,
  };
  const sql = "SELECT * FROM members WHERE email=?";
  const [rows] = await db.query(sql, [req.body.email]);

  if (!rows.length) {
    output.code = 400;
    return res.json(output);
  }
  const row = rows[0];
  const result = await bcrypt.compare(req.body.password, row.password);
  if (result) {
    output.success = true;
    output.code = 200;

    // 登入成功, 狀態記錄在 session 裡

    req.session.admin = {
      id: row.id,
      email: row.email,
      nickname: row.nickname,
    };
  } else {
    output.code = 430;
  }
  res.json(output);
});
app.get("/logout", async (req, res) => {
  delete req.session.admin;
  res.redirect("/");
});
// ***
app.get("/q/:mid", async (req, res) => {
  const mid = +req.params.mid || 0;

  const sql = `SELECT id, email, nickname FROM memebers WHERE id=${mid}`;
  const [rows] = await db.query(sql);
  if (rows.length) {
    req.session.admin = row[0];
    return res.json({ success: true, ...rows[0] });
  }
  res.json({ success: false });
});

app.get("/yahoo", async (req, res) => {
  const r = await fetch("https://tw.yahoo.com");
  const txt = await r.text();
  res.send(txt);
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
