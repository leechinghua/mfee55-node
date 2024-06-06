import express from "express";

const router = express.Router();

router.get("/admin2/:p1/:p2?", (req, res) => {
  res.json(req.params);
});

export default router;