import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/admin-auth";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import multer from "multer";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const execAsync = promisify(exec);
const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

router.get("/admin/backup/export", requireAdmin, async (req, res): Promise<void> => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      res.status(500).json({ error: "DATABASE_URL not set" });
      return;
    }
    const { stdout } = await execAsync(`pg_dump "${dbUrl}" --no-owner --no-acl`, {
      maxBuffer: 100 * 1024 * 1024,
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", `attachment; filename="backup${timestamp}.sql"`);
    res.send(stdout);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/backup/import", requireAdmin, upload.single("file"), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      res.status(500).json({ error: "DATABASE_URL not set" });
      return;
    }
    const tmpFile = join(tmpdir(), `restore-${randomUUID()}.sql`);
    await writeFile(tmpFile, req.file.buffer);
    try {
      await execAsync(`psql "${dbUrl}" -f "${tmpFile}"`, { maxBuffer: 100 * 1024 * 1024 });
      res.json({ success: true, message: "تم استيراد قاعدة البيانات بنجاح" });
    } finally {
      await unlink(tmpFile).catch(() => {});
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
