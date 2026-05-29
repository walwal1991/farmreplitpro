import { Router, type IRouter } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "../middlewares/admin-auth";
import { objectStorageClient, ObjectNotFoundError } from "../lib/objectStorage";

function getBucket() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set");
  return objectStorageClient.bucket(bucketId);
}

function getUploadsPrefix() {
  const dir = process.env.PRIVATE_OBJECT_DIR || "";
  return dir ? `${dir.replace(/^\/[^/]+\//, "")}/uploads` : "uploads";
}

const memStorage = multer.memoryStorage();

const upload = multer({
  storage: memStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

async function uploadToGCS(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  const ext = path.extname(originalname).toLowerCase() || ".jpg";
  const objectId = randomUUID() + ext;
  const prefix = getUploadsPrefix();
  const gcsPath = `${prefix}/${objectId}`;
  const file = getBucket().file(gcsPath);
  await file.save(buffer, { contentType: mimetype, resumable: false });
  return objectId;
}

const router: IRouter = Router();

router.post(
  "/admin/upload",
  requireAdmin,
  upload.single("image"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "لم يتم اختيار صورة صالحة" });
      return;
    }
    try {
      const objectId = await uploadToGCS(req.file.buffer, req.file.mimetype, req.file.originalname);
      res.json({ url: `/api/uploads/${objectId}` });
    } catch (err) {
      res.status(500).json({ error: "فشل رفع الصورة" });
    }
  },
);

router.post(
  "/upload/consultation-image",
  upload.single("image"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "لم يتم اختيار صورة صالحة" });
      return;
    }
    try {
      const objectId = await uploadToGCS(req.file.buffer, req.file.mimetype, req.file.originalname);
      res.json({ url: `/api/uploads/${objectId}` });
    } catch (err) {
      res.status(500).json({ error: "فشل رفع الصورة" });
    }
  },
);

router.get("/uploads/:objectId", async (req, res): Promise<void> => {
  try {
    const prefix = getUploadsPrefix();
    const gcsPath = `${prefix}/${req.params.objectId}`;
    const file = getBucket().file(gcsPath);
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ error: "الصورة غير موجودة" });
      return;
    }
    const [metadata] = await file.getMetadata();
    res.setHeader("Content-Type", (metadata.contentType as string) || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=604800");
    if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
    file.createReadStream().pipe(res);
  } catch {
    res.status(500).json({ error: "فشل تحميل الصورة" });
  }
});

export default router;
