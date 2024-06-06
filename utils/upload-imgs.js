import multer from "multer";
import { v4 } from "uuid";

const extMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const fileFilter = (req, file, callback) => {
  callback(null, !!extMap[file.mimetype]);
};

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