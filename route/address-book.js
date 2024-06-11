import express from "express";
import db from "./../utils/connect-mysql.js";

const router = express.Router();

router.get("/", async (req, res) => {
  res.locals.pageName = "ab-list";

  const perPage = 20; // 每頁最多有幾筆
  let page = +req.query.page || 1;
  if (page < 1) {
    return res.redirect(`?page=1`);
  } // 轉向
  const sql = "SELECT COUNT(*) totalRows FROM address_book";
  const [[{ totalRows }]] = await db.query(sql); // 取得總筆數
  let totalPages = 0;
  let rows = [];
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);
    if (page > totalPages) {
      return res.redirect(`?page=${totalPages}`);
    }
    const sql2 = `SELECT * FROM address_book LIMIT ${
      (page - 1) * perPage
    }, ${perPage}`;
    [rows] = await db.query(sql2);
  }
  // res.json({ totalRows, totalPages, page, perPage, rows });
  res.render("address-book/list", {
    totalRows,
    totalPages,
    page,
    perPage,
    rows,
  });
});

export default router;
