

購物車作法

  1. 資料庫 (必須登入會員)
    後端處理
    長時間儲存

  2. session
    後端處理
    缺點: 換一台電腦資料就不見了

  3. localStorage
    前端處理
    缺點: 只能在同一台電腦使用


加到最愛
  table: 主鍵(流水號), member_id, product_id, created_at

---------------------------------------------------------------
想功能時, 以 CRUD 著手

購物車 (會員要先登入)
  C: 加到購物車
  R: 查看購物車內容
  U: 變更某一項的數量
  D: 刪除某一項, 清空購物車

購物車的資料表
  table structure: PK, product_id, member_id, quantity, created_at