import express from "express";
import moment from "moment-timezone";
import db from "./../utils/connect-mysql.js";

const dateFormat = "YYYY-MM-DD";
const router = express.Router();

router.get("/", async (req, res) => {
  res.locals.pageName = "ab-list";
  let keyword = req.query.keyword || ""; // 預設值為空字串
  const perPage = 20; // 每頁最多有幾筆
  let page = +req.query.page || 1;
  if (page < 1) {
    return res.redirect(`?page=1`);
  } // 轉向

  let where = ` WHERE 1 `;
  if (keyword) {
    where += ` AND \`name\` LIKE ${db.escape("%" + keyword + "%")} `;
  }

  const sql = `SELECT COUNT(*) totalRows FROM address_book ${where}`;
  const [[{ totalRows }]] = await db.query(sql); // 取得總筆數
  let totalPages = 0;
  let rows = [];
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);
    if (page > totalPages) {
      return res.redirect(`?page=${totalPages}`);
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
  res.render("address-book/list", {
    totalRows,
    totalPages,
    page,
    perPage,
    rows,
    qs: req.query, // query string 參數
  });
});

export default router;
