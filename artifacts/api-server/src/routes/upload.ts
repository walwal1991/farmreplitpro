import { Router, type IRouter } from "express";
import multer from "multer";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "../middlewares/admin-auth";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const name = randomBytes(12).toString("hex") + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router: IRouter = Router();

router.post(
  "/admin/upload",
  requireAdmin,
  upload.single("image"),
  (req, res): void => {
    if (!req.file) {
      res.status(400).json({ error: "لم يتم اختيار صورة صالحة" });
      return;
    }
    const url = `/api/uploads/${req.file.filename}`;
    res.json({ url });
  },
);

export default router;
