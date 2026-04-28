import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";
import { getCustomerSessionUser } from "../middlewares/customer-auth";

const router: IRouter = Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── POST /api/contact ────────────────────────────────────────────────────────
router.post("/contact", async (req, res): Promise<void> => {
  const { customerName, phone, message, sessionId } = req.body ?? {};

  if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
    res.status(400).json({ error: "الاسم مطلوب" }); return;
  }
  if (!message || typeof message !== "string" || message.trim().length < 1) {
    res.status(400).json({ error: "يرجى كتابة رسالتك أو سؤالك" }); return;
  }
  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "معرّف الجلسة مطلوب" }); return;
  }

  // Resolve logged-in customer (optional)
  const customerToken = (req.header("x-customer-token") ?? "").trim();
  const customerUser = customerToken ? await getCustomerSessionUser(customerToken) : null;
  const customerId = customerUser ? customerUser.id : null;
  // If logged in, use the account name
  const resolvedName = customerUser ? customerUser.name : customerName.trim();

  const result = await db.execute(
    sql`INSERT INTO contact_messages (customer_name, phone, message, session_id, customer_id)
        VALUES (${resolvedName}, ${(phone ?? "").toString().trim() || null},
                ${message.trim()}, ${sessionId}, ${customerId})
        RETURNING id, customer_name, message, session_id, created_at`
  );
  const row = result.rows[0] as {
    id: number; customer_name: string; message: string;
    session_id: string; created_at: string;
  };

  res.status(201).json({
    id: row.id,
    customerName: row.customer_name,
    message: row.message,
    adminReply: null,
    sessionId: row.session_id,
    createdAt: row.created_at,
  });
});

// ─── POST /api/contact/session  (customer polls their chat) ──────────────────
// If x-customer-token is present → returns ALL messages for that customer account
// Otherwise → returns messages for the given sessionId (UUID required)
router.post("/contact/session", async (req, res): Promise<void> => {
  const { sessionId } = req.body ?? {};

  // Check for logged-in customer token
  const customerToken = (req.header("x-customer-token") ?? "").trim();
  const customerUser = customerToken ? await getCustomerSessionUser(customerToken) : null;

  if (customerUser) {
    const cid = customerUser.id;

    // Auto-fix: associate any messages in this session that are missing customer_id
    if (sessionId && UUID_RE.test(sessionId)) {
      await db.execute(
        sql`UPDATE contact_messages
            SET customer_id = ${cid}
            WHERE session_id = ${sessionId}
              AND customer_id IS NULL`
      );
    }

    // Return messages by customer_id OR (same session + same customer name)
    const result = await db.execute(
      sql`SELECT id, customer_name, message, admin_reply, is_admin_initiated, created_at
          FROM contact_messages
          WHERE customer_id = ${cid}
          ORDER BY created_at ASC`
    );
    res.json((result.rows as Array<{
      id: number; customer_name: string; message: string;
      admin_reply: string | null; is_admin_initiated: boolean; created_at: string;
    }>).map(r => ({
      id: r.id,
      customerName: r.customer_name,
      message: r.message,
      adminReply: r.admin_reply ?? null,
      isAdminInitiated: r.is_admin_initiated,
      createdAt: r.created_at,
    })));
    return;
  }

  // Guest: fall back to sessionId lookup
  if (!sessionId || typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
    res.status(400).json({ error: "معرّف الجلسة غير صالح" }); return;
  }

  const result = await db.execute(
    sql`SELECT id, customer_name, message, admin_reply, created_at
        FROM contact_messages
        WHERE session_id = ${sessionId}
        ORDER BY created_at ASC`
  );

  res.json((result.rows as Array<{
    id: number; customer_name: string; message: string;
    admin_reply: string | null; created_at: string;
  }>).map(r => ({
    id: r.id,
    customerName: r.customer_name,
    message: r.message,
    adminReply: r.admin_reply ?? null,
    createdAt: r.created_at,
  })));
});

// ─── POST /api/admin/contact-messages/send — admin initiates message ─────────
router.post("/admin/contact-messages/send", requireAdmin, async (req, res): Promise<void> => {
  const { customerId, customerName, phone, message } = req.body ?? {};
  if (!message || typeof message !== "string" || message.trim().length < 1) {
    res.status(400).json({ error: "الرسالة مطلوبة" }); return;
  }
  if (!customerId && !phone) {
    res.status(400).json({ error: "معرّف العميل أو رقم الهاتف مطلوب" }); return;
  }

  // Resolve customerId from phone if not given
  let resolvedCustomerId: number | null = customerId ? parseInt(customerId) : null;
  let resolvedName: string = customerName ?? "عميل";
  let resolvedPhone: string | null = phone ?? null;

  if (!resolvedCustomerId && phone) {
    const r = await db.execute(sql`SELECT id, name FROM customers WHERE phone = ${phone.trim()} LIMIT 1`);
    if (!r.rows.length) {
      res.status(404).json({ error: "لم يُعثر على حساب لهذا الرقم" }); return;
    }
    const row = r.rows[0] as { id: number; name: string };
    resolvedCustomerId = row.id;
    resolvedName = row.name;
  }

  const result = await db.execute(
    sql`INSERT INTO contact_messages (customer_name, phone, message, is_admin_initiated, customer_id)
        VALUES (${resolvedName}, ${resolvedPhone},
                ${message.trim()}, true, ${resolvedCustomerId})
        RETURNING id, customer_name, phone, message, is_admin_initiated, customer_id, created_at`
  );
  const row = result.rows[0] as {
    id: number; customer_name: string; phone: string | null;
    message: string; is_admin_initiated: boolean; customer_id: number | null; created_at: string;
  };
  res.status(201).json({
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    message: row.message,
    isAdminInitiated: row.is_admin_initiated,
    customerId: row.customer_id,
    createdAt: row.created_at,
  });
});

// ─── GET /api/admin/contact-messages ─────────────────────────────────────────
router.get("/admin/contact-messages", requireAdmin, async (_req, res): Promise<void> => {
  const result = await db.execute(
    sql`SELECT id, customer_name, phone, message, is_read, admin_reply, session_id, customer_id, created_at
        FROM contact_messages ORDER BY created_at DESC`
  );
  res.json((result.rows as Array<{
    id: number; customer_name: string; phone: string | null;
    message: string; is_read: boolean; admin_reply: string | null;
    session_id: string | null; customer_id: number | null; created_at: string;
  }>).map(r => ({
    id: r.id,
    customerName: r.customer_name,
    phone: r.phone,
    message: r.message,
    isRead: r.is_read,
    adminReply: r.admin_reply,
    sessionId: r.session_id,
    customerId: r.customer_id,
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
        RETURNING id, customer_name, phone, message, is_read, admin_reply, session_id, created_at`
  );
  if (!result.rows.length) { res.status(404).json({ error: "الرسالة غير موجودة" }); return; }
  const r = result.rows[0] as {
    id: number; customer_name: string; phone: string | null; message: string;
    is_read: boolean; admin_reply: string | null; session_id: string | null; created_at: string;
  };
  res.json({
    id: r.id, customerName: r.customer_name, phone: r.phone,
    message: r.message, isRead: r.is_read, adminReply: r.admin_reply,
    sessionId: r.session_id, createdAt: r.created_at,
  });
});

// ─── DELETE /api/admin/contact-messages/:id ───────────────────────────────────
router.delete("/admin/contact-messages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  await db.execute(sql`DELETE FROM contact_messages WHERE id = ${id}`);
  res.json({ ok: true });
});

export default router;
