import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

// ─── POST /api/contact ────────────────────────────────────────────────────────
router.post("/contact", async (req, res): Promise<void> => {
  const { customerName, phone, message } = req.body ?? {};

  if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
    res.status(400).json({ error: "الاسم مطلوب" }); return;
  }
  if (!message || typeof message !== "string" || message.trim().length < 5) {
    res.status(400).json({ error: "يرجى كتابة رسالتك أو سؤالك (5 أحرف على الأقل)" }); return;
  }

  const result = await db.execute(
    sql`INSERT INTO contact_messages (customer_name, phone, message)
        VALUES (${customerName.trim()}, ${(phone ?? "").toString().trim() || null}, ${message.trim()})
        RETURNING id, customer_name, phone, message, created_at`
  );
  const row = result.rows[0] as { id: number; customer_name: string; phone: string | null; message: string; created_at: string };

  res.status(201).json({
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    message: row.message,
    createdAt: row.created_at,
  });
});

// ─── GET /api/admin/contact-messages ─────────────────────────────────────────
router.get("/admin/contact-messages", requireAdmin, async (_req, res): Promise<void> => {
  const result = await db.execute(
    sql`SELECT id, customer_name, phone, message, is_read, admin_reply, created_at
        FROM contact_messages ORDER BY created_at DESC`
  );
  res.json((result.rows as Array<{
    id: number; customer_name: string; phone: string | null;
    message: string; is_read: boolean; admin_reply: string | null; created_at: string;
  }>).map(r => ({
    id: r.id,
    customerName: r.customer_name,
    phone: r.phone,
    message: r.message,
    isRead: r.is_read,
    adminReply: r.admin_reply,
    createdAt: r.created_at,
  })));
});

// ─── PATCH /api/admin/contact-messages/:id ────────────────────────────────────
router.patch("/admin/contact-messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const { isRead, adminReply } = req.body ?? {};
  const updates: string[] = [];
  if (typeof isRead === "boolean") updates.push(`is_read = ${isRead}`);
  if (typeof adminReply === "string") updates.push(`admin_reply = '${adminReply.replace(/'/g, "''")}'`);

  if (!updates.length) { res.status(400).json({ error: "لا توجد بيانات للتحديث" }); return; }

  const result = await db.execute(
    sql`UPDATE contact_messages SET ${sql.raw(updates.join(", "))} WHERE id = ${id}
        RETURNING id, customer_name, phone, message, is_read, admin_reply, created_at`
  );
  if (!result.rows.length) { res.status(404).json({ error: "الرسالة غير موجودة" }); return; }
  const r = result.rows[0] as { id: number; customer_name: string; phone: string | null; message: string; is_read: boolean; admin_reply: string | null; created_at: string };
  res.json({ id: r.id, customerName: r.customer_name, phone: r.phone, message: r.message, isRead: r.is_read, adminReply: r.admin_reply, createdAt: r.created_at });
});

// ─── DELETE /api/admin/contact-messages/:id ───────────────────────────────────
router.delete("/admin/contact-messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  await db.execute(sql`DELETE FROM contact_messages WHERE id = ${id}`);
  res.json({ ok: true });
});

export default router;
