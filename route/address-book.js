import express from "express";
import moment from "moment-timezone";
import db from "./../utils/connect-mysql.js";
import upload from "./../utils/upload-imgs.js";

const dateFormat = "YYYY-MM-DD";
const router = express.Router();

const getListData = async (req) => {
  let keyword = req.query.keyword || ""; // 預設值為空字串

  let birthBegin = req.query.birthBegin || "";
  let birthEnd = req.query.birthEnd || "";

  const perPage = 20; // 每頁最多有幾筆
  let page = +req.query.page || 1;
  if (page < 1) {
    return {
      success: false,
      redirect: `?page=1`,
      info: "page 值太小",
    };
  } // 轉向

  let where = ` WHERE 1 `;
  if (keyword) {
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
  let totalPages = 0;
  let rows = [];
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);
    if (page > totalPages) {
      return {
        success: false,
        redirect: `?page=${totalPages}`,
        info: "page 值太大",
      };
    }

    const sql2 = `SELECT * FROM address_book ${where} ORDER BY sid DESC LIMIT ${
      (page - 1) * perPage
    }, ${perPage}`;
    [rows] = await db.query(sql2);
    rows.forEach((r) => {
      // JS 的 Date 類型轉換為日期格式的字串
      r.birthday = moment(r.birthday).format(dateFormat);
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
  res.render("address-book/add");
});

router.post("/add", upload.none(), async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    result: {},
  };
  // const sql = `INSERT INTO address_book(name, email, mobile, birthday, address, created_at) VALUES (?,?,?,?,?,Now())`;

  // const [result] = await db.query(sql, [
  //   req.body.name,
  //   req.body.email,
  //   req.body.mobile,
  //   req.body.birthday,
  //   req.body.address,
  // ]);
  const sql2 = `INSERT INTO address_book set ?`;
  const data = { ...req.body, created_at: new Date() };

  data.birthday = moment(data.birthday);
  if (data.birthday.isValid()) {
    data.birthday = data.birthday.format(dateFormat);
  } else {
    data.birthday = null;
  }
  try {
    const [result] = await db.query(sql2, [data]);
    output.result = result;
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.error = ex;
  }

  res.json(output);
});

export default router;
