import multer from "multer";
import { v4 } from "uuid";

const extMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// 定義一個文件過濾器函數 fileFilter，用來過濾不支持的文件類型。只有在 extMap 中存在的 MIME 類型才會被接受。
const fileFilter = (req, file, callback) => {
  callback(null, !!extMap[file.mimetype]);
};

// destination：指定文件保存的資料夾。上傳文件會存到 public/img 資料夾。
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img");
  },
  filename: (req, file, cb) => {
    const ext = extMap[file.mimetype];
    cb(null, v4() + ext);
  },
});
export default multer({ fileFilter, storage });
