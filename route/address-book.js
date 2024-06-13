import express, { query } from "express";
import moment from "moment-timezone";
import db from "./../utils/connect-mysql.js";
import upload from "./../utils/upload-imgs.js";

const dateFormat = "YYYY-MM-DD";
const router = express.Router();

const getListData = async (req) => {
  let keyword = req.query.keyword || ""; // 預設值為空字串

  let birthBegin = req.query.birthBegin || "";// 這個日期之後出生的
  let birthEnd = req.query.birthEnd || "";// 這個日期之前出生的

  const perPage = 20; // 每頁最多有幾筆
  let page = +req.query.page || 1;
  if (page < 1) {
    return {
      success: false,
      redirect: `?page=1`,// 需要轉向
      info: "page 值太小",
    };
  } // 轉向

  let where = ` WHERE 1 `;
  if (keyword) { 
    // where += ` AND \`name\` LIKE ${db.escape("%" + keyword + "%")} `;
    where += ` AND 
    ( \`name\` LIKE ${db.escape(`%${keyword}%`)}  
    OR
    \`mobile\` LIKE ${db.escape(`%${keyword}%`)}
    ) 
    `;
  }
  birthBegin = moment(birthBegin);
  if (birthBegin.isValid()) {
    where += ` AND birthday >= '${birthBegin.format(dateFormat)}'`;
  }
  birthEnd = moment(birthEnd);
  if (birthEnd.isValid()) {
    where += ` AND birthday >= '${birthEnd.format(dateFormat)}'`;
  }

  const sql = `SELECT COUNT(*) totalRows FROM address_book ${where}`;
  const [[{ totalRows }]] = await db.query(sql); // 取得總筆數

  let totalPages = 0; // 總頁數, 預設值設定 0
  let rows = []; // 分頁資料
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);
    if (page > totalPages) {
      return {
        success: false,
        redirect: `?page=${totalPages}`,// 需要轉向
        info: "page 值太大",
      };
    }

    const sql2 = `SELECT * FROM address_book ${where} ORDER BY sid DESC LIMIT ${
      (page - 1) * perPage
    }, ${perPage}`;
    [rows] = await db.query(sql2);
    rows.forEach((r) => {
      // JS 的 Date 類型轉換為日期格式的字串
      if (r.birthday) {
        r.birthday = moment(r.birthday).format(dateFormat);
      }
    });
  }
  // res.json({ totalRows, totalPages, page, perPage, rows });
  return {
    success: true,
    totalRows,
    totalPages,
    page,
    perPage,
    rows,
    qs: req.query, // query string 參數
  };
};

router.get("/", async (req, res) => {
  res.locals.pageName = "ab-list";
  const result = await getListData(req);

  if (result.redirect) {
    return res.redirect(result, redirect);
  }
  res.render("address-book/list", result);
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
  // 可用ZOD套件

  // const sql = `INSERT INTO address_book(name, email, mobile, birthday, address, created_at) VALUES (?,?,?,?,?,Now())`;

  // const [result] = await db.query(sql, [
  //   req.body.name,
  //   req.body.email,
  //   req.body.mobile,
  //   req.body.birthday,
  //   req.body.address,
  // ]);
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
    output.error = ex;// 開發時期除錯
  }

  res.json(output);
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
  // res.json(rows[0]);
  const row = rows[0];
  if (row.birthday) {
    // 日期格式轉換
    row.birthday = moment(row.birthday).format(dateFormat);
  }

  res.render("address-book/edit", row);
});

router.put("/edit/:sid", upload.none(), async (req, res) => {
  let sid = +req.params.sid || 0;
  if (!sid) {
    return res.json({ success: false, info: "不正確的主鍵" });
  }
  const sql = "UPDATE address_book SET ? WHERE sid=?";
  const [result] = await db.query(sql, [req.body, sid]);
  res.json(result);
});

export default router;
