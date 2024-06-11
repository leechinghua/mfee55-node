import express from "express";
import db from "./../utils/connect-mysql.js";

const router = express.Router();

router.get("/", async (req, res) => {
  res.locals.pageName = "ab-list";

  const sql = "SELECT COUNT(*) totalRows FROM address_book";
  const [[{ totalRows }]] = await db.query(sql); // 取得總筆數
  res.json(totalRows);
  // res.render("address-book/list");
});

export default router;
