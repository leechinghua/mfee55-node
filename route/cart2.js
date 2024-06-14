import express from "express";

const router = express.Router();

/* 購物車 (會員要先登入)
  C: 加到購物車
  R: 查看購物車內容
  U: 變更某一項的數量
  D: 刪除某一項, 清空購物車*/

router.use((req, res, next) => {
  if (!req.session.admin) {
    return res.status(403).json({ success: false, info: "需要登入會員" });
  }
});

router.get("/", (req, res) => {});

export default router;
