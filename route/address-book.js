import express from "express";
import moment from "moment-timezone";
import db from "./../utils/connect-mysql.js";
import upload from "./../utils/upload-imgs.js";

const dateFormat = "YYYY-MM-DD";
const router = express.Router();

const getListData = async (req) => {
  let keyword = req.query.keyword || ""; // 預設值為空字串

  let birthBegin = req.query.birthBegin || ""; // 這個日期之後出生的
  let birthEnd = req.query.birthEnd || ""; // 這個日期之前出生的

  const perPage = 20; // 每頁最多有幾筆
  let page = +req.query.page || 1;
  if (page < 1) {
    return {
      success: false,
      redirect: `?page=1`, // 需要轉向
      info: "page 值太小",
    };
  }

  let where = " WHERE 1 ";
  if (keyword) {
    // where += ` AND \`name\` LIKE ${db.escape("%" + keyword + "%")} `;
    where += ` AND 
    (
      ab.name LIKE ${db.escape(`%${keyword}%`)} 
      OR
      ab mobile LIKE ${db.escape(`%${keyword}%`)} 
    )
    `;
  }

  birthBegin = moment(birthBegin);
  if (birthBegin.isValid()) {
    where += ` AND ab.birthday >= '${birthBegin.format(dateFormat)}' `;
  }
  birthEnd = moment(birthEnd);
  if (birthEnd.isValid()) {
    where += ` AND ab.birthday <= '${birthEnd.format(dateFormat)}' `;
  }

  const sql = `SELECT COUNT(*) totalRows FROM address_book ab ${where}`;
  const [[{ totalRows }]] = await db.query(sql); // 取得總筆數

  let totalPages = 0; // 總頁數, 預設值設定 0
  let rows = []; // 分頁資料
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);
    if (page > totalPages) {
      return {
        success: false,
        redirect: `?page=${totalPages}`, // 需要轉向
        info: "page 值太大",
      };
    }

    // const sql2 = `SELECT * FROM address_book ${where} ORDER BY sid DESC LIMIT ${
    //   (page - 1) * perPage
    // }, ${perPage} `;

    const member_sid = req.my_jwt?.id ? req.my_jwt?.id : 0;
    const sql2 = `SELECT ab.*, li.sid like_sid
                FROM address_book ab
                LEFT JOIN (
                  SELECT * FROM ab_likes WHERE member_sid=${member_sid}
                ) li ON ab.sid=li.ab_sid
                ${where}
                ORDER BY ab.sid DESC
                LIMIT ${(page - 1) * perPage}, ${perPage} `;
    // console.log(req.my_jwt);
    // console.log(sql2);


    [rows] = await db.query(sql2);

    rows.forEach((r) => {
      // "JS 的 Date 類型" 轉換為日期格式的字串
      if (r.birthday) {
        r.birthday = moment(r.birthday).format(dateFormat);
      }
    });
  }
  return {
    success: true,
    totalRows,
    totalPages,
    page,
    perPage,
    rows,
    qs: req.query,
  };
};

/*
// router top-level middleware
// 模擬網速不穩定狀況
router.use((req, res, next) => {
  const ms = 200 + Math.floor(Math.random() * 2000);
  setTimeout(() => {
    next();
  }, ms);
});
*/
// router top-level middleware
/*
router.use((req, res, next) => {
  if (req.session.admin) {
    // 如果有登入就讓他通過
    return next();
  }
  let path = req.url.split("?")[0]; // 只要路徑 (去掉 query string)
  // 可通過的白名單
  if (["/", "/api"].includes(path)) {
    return next();
  }
  // res.status(403).send("<h1>無權訪問此頁面</h1>"); // 直接擋掉
  res.redirect(`/login?u=${req.originalUrl}`); // 導到登入頁
});
*/
router.get("/", async (req, res) => {
  res.locals.pageName = "ab-list";
  const result = await getListData(req);

  if (result.redirect) {
    return res.redirect(result.redirect);
  }
  if (req.session.admin) {
    res.render("address-book/list", result);
  } else {
    res.render("address-book/list-no-admin", result);
  }
});
router.get("/api", async (req, res) => {
  const result = await getListData(req);
  res.json(result);
});

router.get("/add", async (req, res) => {
  res.locals.pageName = "ab-add";
  // 呈現新增資料的表單
  res.render("address-book/add");
});

router.post("/add", upload.none(), async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    result: {},
  };
  // 處理表單資料

  // TODO: 欄位資料檢查

  /*
  const sql = `INSERT INTO address_book 
  ( name, email, mobile, birthday, address, created_at) VALUES (
    ?, ?, ?, ?, ?, NOW()
  )`;

  const [result] = await db.query(sql, [
    req.body.name,
    req.body.email,
    req.body.mobile,
    req.body.birthday,
    req.body.address,
  ]);
  */
  const sql2 = `INSERT INTO address_book set ?`;
  // data 物件的屬性, 對應到資料表的欄位
  const data = { ...req.body, created_at: new Date() };

  data.birthday = moment(data.birthday);
  if (data.birthday.isValid()) {
    // 如果是正確的格式
    data.birthday = data.birthday.format(dateFormat);
  } else {
    // 不是正確的日期格式, 就使用空值
    data.birthday = null;
  }
  try {
    const [result] = await db.query(sql2, [data]);
    output.result = result;
    output.success = !!result.affectedRows;
  } catch (ex) {
    // sql 發生錯誤
    output.error = ex; // 開發時期除錯
  }
  res.json(output);
  /*
{
    "fieldCount": 0,
    "affectedRows": 1,
    "insertId": 1011,
    "info": "",
    "serverStatus": 2,
    "warningStatus": 0,
    "changedRows": 0
}
*/
});

// 比較符合 RESTful API 的寫法
router.delete("/:sid", async (req, res) => {
  const output = {
    success: false,
    result: {},
  };
  let sid = +req.params.sid || 0;
  if (sid) {
    const sql = `DELETE FROM address_book WHERE sid=${sid}`;
    const [result] = await db.query(sql);
    output.result = result;
    output.success = !!result.affectedRows;
  }
  res.json(output);
});

// 呈現修改資料的表單
router.get("/edit/:sid", async (req, res) => {
  // TODO: 欄位資料檢查

  let sid = +req.params.sid || 0;
  if (!sid) {
    return res.redirect("/address-book");
  }
  const sql = `SELECT * FROM address_book WHERE sid=${sid}`;
  const [rows] = await db.query(sql);
  if (rows.length === 0) {
    // 沒有該筆資料時, 跳回列表頁
    return res.redirect("/address-book");
  }

  const row = rows[0];
  if (row.birthday) {
    // 日期格式轉換
    row.birthday = moment(row.birthday).format(dateFormat);
  }

  res.render("address-book/edit", row);
});
// 處理修改資料的表單
router.put("/edit/:sid", upload.none(), async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    result: null,
  };

  let sid = +req.params.sid || 0;
  if (!sid) {
    return res.json({ success: false, info: "不正確的主鍵" });
  }
  const sql = "UPDATE address_book SET ? WHERE sid=?";
  const [result] = await db.query(sql, [req.body, sid]);

  output.result = result;
  output.success = !!(result.affectedRows && result.changedRows);

  res.json(output);
});

// 取得單筆資料的 api
router.get("/:sid", async (req, res) => {
  let sid = +req.params.sid || 0;
  if (!sid) {
    return res.json({ success: false, code: 401 });
  }
  const sql = `SELECT * FROM address_book WHERE sid=${sid}`;
  const [rows] = await db.query(sql);
  if (rows.length === 0) {
    // 沒有該筆資料時,
    return res.json({ success: false, code: 402 });
  }
  const row = rows[0];
  if (row.birthday) {
    // 日期格式轉換
    row.birthday = moment(row.birthday).format(dateFormat);
  }
  res.json({ success: true, data: row });
});

// 加入或解除好友, toggle 功能
router.get("/fav/:ab_sid", async (req, res) => {
  const output = {
    success: false,
    action: "", // add, remove
    error: "",
    code: 0,
  };
  // 1. 檢查用戶的授權
  if (!req.my_jwt?.id) {
    output.error = "沒有授權";
    output.code = 402;
    return res.status(403).json(output);
  }
  // 2. 有沒有這個項目的資料
  const sql = `SELECT * FROM address_book WHERE sid=?`;
  const [rows] = await db.query(sql, [req.params.ab_sid]);
  if (rows.length < 1) {
    output.error = "沒有這個項目";
    output.code = 405;
    return res.status(403).json(output);
  }
  // 3. 該項有沒有加入過
  const sql2 = `SELECT sid FROM ab_likes WHERE member_sid=? AND ab_sid=?`;
  const [rows2] = await db.query(sql2, [req.my_jwt.id, req.params.ab_sid]);
  let result;
  if (rows2.length < 1) {
    // 沒有加入過
    output.action = "add";
    const sql3 = `INSERT INTO ab_likes (member_sid, ab_sid) VALUES (?, ?)`;
    [result] = await db.query(sql3, [req.my_jwt.id, req.params.ab_sid]);
  } else {
    // 已經加入了
    output.action = "remove";
    const sql4 = `DELETE FROM ab_likes WHERE sid=?`;
    [result] = await db.query(sql4, [rows2[0].sid]);
  }
  output.success = !!result.affectedRows;
  res.json(output);
});
export default router;
