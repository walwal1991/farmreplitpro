import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, deliveryUsersTable, deliverySessionsTable, ordersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "../middlewares/admin-auth";
import { requireDelivery, createDeliverySession, getDeliverySessionUser } from "../middlewares/delivery-auth";
import type { Request } from "express";

const router: IRouter = Router();

function deliveryToken(): string {
  return randomBytes(32).toString("hex");
}

function extractDeliveryToken(req: Request): string {
  return (req.header("x-delivery-token") ?? "").toString().trim();
}

// ─── Delivery login ───────────────────────────────────────────────────────────
router.post("/delivery/login", async (req, res): Promise<void> => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
    return;
  }
  const rows = await db
    .select()
    .from(deliveryUsersTable)
    .where(eq(deliveryUsersTable.username, username))
    .limit(1);
  const user = rows[0];
  if (!user || !user.active) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }
  const token = deliveryToken();
  await createDeliverySession(user.id, token);
  res.json({ token, id: user.id, username: user.username, name: user.name, role: user.role });
});

// ─── Delivery me (validate token) ─────────────────────────────────────────────
router.get("/delivery/me", async (req, res): Promise<void> => {
  const token = extractDeliveryToken(req);
  const user = await getDeliverySessionUser(token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json(user);
});

// ─── Delivery logout ──────────────────────────────────────────────────────────
router.post("/delivery/logout", async (req, res): Promise<void> => {
  const token = extractDeliveryToken(req);
  if (token) {
    await db.delete(deliverySessionsTable).where(eq(deliverySessionsTable.token, token));
  }
  res.json({ ok: true });
});

// ─── List orders (delivery) ───────────────────────────────────────────────────
router.get("/delivery/orders", requireDelivery, async (_req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.status, "confirmed"))
    .orderBy(desc(ordersTable.createdAt));

  // Also fetch shipped ones
  const shipped = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.status, "shipped"))
    .orderBy(desc(ordersTable.createdAt));

  const all = [...orders, ...shipped].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  res.json(
    all.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      phone: o.phone,
      address: o.address,
      city: o.city,
      notes: o.notes,
      productName: o.productName,
      quantity: o.quantity,
      totalPrice: o.totalPrice,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  );
});

// ─── Update order status (delivery — limited transitions) ─────────────────────
router.patch("/delivery/orders/:id/status", requireDelivery, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body ?? {};
  const allowed = ["shipped", "delivered"];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: "الحالة غير مسموح بها" });
    return;
  }
  const rows = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  const order = rows[0];
  if (!order) { res.status(404).json({ error: "الطلب غير موجود" }); return; }

  // Only allow forward transitions
  const validFrom: Record<string, string> = { shipped: "confirmed", delivered: "shipped" };
  if (order.status !== validFrom[status]) {
    res.status(400).json({ error: `لا يمكن تغيير الحالة من "${order.status}" إلى "${status}"` });
    return;
  }

  await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id));
  res.json({ ok: true, id, status });
});

// ─── Admin: list delivery users ───────────────────────────────────────────────
router.get("/admin/delivery-users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: deliveryUsersTable.id,
      username: deliveryUsersTable.username,
      name: deliveryUsersTable.name,
      phone: deliveryUsersTable.phone,
      role: deliveryUsersTable.role,
      active: deliveryUsersTable.active,
      createdAt: deliveryUsersTable.createdAt,
    })
    .from(deliveryUsersTable)
    .orderBy(desc(deliveryUsersTable.createdAt));
  res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

// ─── Admin: create delivery user ──────────────────────────────────────────────
router.post("/admin/delivery-users", requireAdmin, async (req, res): Promise<void> => {
  const { username, password, name, phone, role } = req.body ?? {};
  if (!username || !password || !name) {
    res.status(400).json({ error: "اسم المستخدم والاسم وكلمة المرور مطلوبة" });
    return;
  }
  const existing = await db
    .select()
    .from(deliveryUsersTable)
    .where(eq(deliveryUsersTable.username, username))
    .limit(1);
  if (existing[0]) {
    res.status(409).json({ error: "اسم المستخدم مستخدم بالفعل" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [row] = await db
    .insert(deliveryUsersTable)
    .values({ username, passwordHash, name, phone: phone ?? "", role: role ?? "driver", active: true })
    .returning({
      id: deliveryUsersTable.id,
      username: deliveryUsersTable.username,
      name: deliveryUsersTable.name,
      phone: deliveryUsersTable.phone,
      role: deliveryUsersTable.role,
      active: deliveryUsersTable.active,
      createdAt: deliveryUsersTable.createdAt,
    });
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

// ─── Admin: toggle active ─────────────────────────────────────────────────────
router.patch("/admin/delivery-users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { active } = req.body ?? {};
  if (typeof active !== "boolean") {
    res.status(400).json({ error: "active مطلوب" });
    return;
  }
  await db.update(deliveryUsersTable).set({ active }).where(eq(deliveryUsersTable.id, id));
  if (!active) {
    // invalidate sessions
    const sessions = await db
      .select()
      .from(deliverySessionsTable)
      .where(eq(deliverySessionsTable.userId, id));
    for (const s of sessions) {
      await db.delete(deliverySessionsTable).where(eq(deliverySessionsTable.token, s.token));
    }
  }
  res.json({ ok: true });
});

// ─── Admin: delete delivery user ──────────────────────────────────────────────
router.delete("/admin/delivery-users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(deliverySessionsTable).where(eq(deliverySessionsTable.userId, id));
  await db.delete(deliveryUsersTable).where(eq(deliveryUsersTable.id, id));
  res.json({ ok: true });
});

export default router;
