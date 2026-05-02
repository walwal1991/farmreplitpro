import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

// ── GET /api/admin/notifications ─────────────────────────────────────────────
router.get("/admin/notifications", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT id, type, title, body, reference_id, is_read, created_at
    FROM admin_notifications
    ORDER BY created_at DESC
    LIMIT 50
  `);
  const unreadCount = (rows.rows as Array<{ is_read: boolean }>)
    .filter(r => !r.is_read).length;
  res.json({ notifications: rows.rows, unreadCount });
});

// ── GET /api/admin/notifications/count ───────────────────────────────────────
router.get("/admin/notifications/count", requireAdmin, async (_req, res): Promise<void> => {
  const r = await db.execute(sql`
    SELECT COUNT(*) AS count FROM admin_notifications WHERE is_read = FALSE
  `);
  const count = parseInt(String((r.rows[0] as { count: string }).count), 10);
  res.json({ unreadCount: count });
});

// ── PATCH /api/admin/notifications/read-all ──────────────────────────────────
router.patch("/admin/notifications/read-all", requireAdmin, async (_req, res): Promise<void> => {
  await db.execute(sql`UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE`);
  res.json({ ok: true });
});

// ── PATCH /api/admin/notifications/:id/read ──────────────────────────────────
router.patch("/admin/notifications/:id/read", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.execute(sql`UPDATE admin_notifications SET is_read = TRUE WHERE id = ${id}`);
  res.json({ ok: true });
});

export default router;
