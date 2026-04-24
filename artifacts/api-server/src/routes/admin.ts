import { Router, type IRouter } from "express";
import { sql, desc, eq } from "drizzle-orm";
import {
  db,
  ordersTable,
  consultationsTable,
  productsTable,
  adminsTable,
} from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminChangePasswordBody,
  GetAdminStatsResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import {
  requireAdmin,
  createSession,
  getSessionUser,
  destroyUserSessions,
  getRequestToken,
} from "../middlewares/admin-auth";

const router: IRouter = Router();

async function issueToken(username: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await createSession(username, token);
  return token;
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;

  const rows = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.username, username))
    .limit(1);
  const admin = rows[0];

  if (!admin) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }

  const token = await issueToken(admin.username);
  res.json(AdminLoginResponse.parse({ token, username: admin.username }));
});

router.post(
  "/admin/change-password",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = AdminChangePasswordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const username = getSessionUser(getRequestToken(req));
    if (!username) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const rows = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.username, username))
      .limit(1);
    const admin = rows[0];
    if (!admin) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ok = await bcrypt.compare(
      parsed.data.currentPassword,
      admin.passwordHash,
    );
    if (!ok) {
      res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
      return;
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await db
      .update(adminsTable)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(adminsTable.id, admin.id));

    await destroyUserSessions(username);
    const newToken = await issueToken(username);
    res.json(AdminLoginResponse.parse({ token: newToken, username }));
  },
);

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);
  const allConsults = await db.select().from(consultationsTable);
  const products = await db.select().from(productsTable);

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
  const deliveredOrders = allOrders.filter(
    (o) => o.status === "delivered",
  ).length;
  const totalRevenue = allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.totalPrice), 0);

  const totalConsultations = allConsults.length;
  const newConsultations = allConsults.filter((c) => c.status === "new").length;
  const totalProducts = products.length;

  const statusBuckets = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const ordersByStatus = statusBuckets.map((status) => ({
    status,
    count: allOrders.filter((o) => o.status === status).length,
  }));

  res.json(
    GetAdminStatsResponse.parse({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      totalConsultations,
      newConsultations,
      totalProducts,
      ordersByStatus,
    }),
  );
});

router.get(
  "/admin/recent-activity",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const recentOrders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(10);
    const recentConsults = await db
      .select()
      .from(consultationsTable)
      .orderBy(desc(consultationsTable.createdAt))
      .limit(10);

    const items = [
      ...recentOrders.map((o) => ({
        kind: "order" as const,
        id: o.id,
        title: `طلب جديد من ${o.customerName}`,
        subtitle: `${o.productName} × ${o.quantity}`,
        createdAt: o.createdAt.toISOString(),
      })),
      ...recentConsults.map((c) => ({
        kind: "consultation" as const,
        id: c.id,
        title: `استشارة من ${c.customerName}`,
        subtitle: `محصول: ${c.crop}`,
        createdAt: c.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 15);

    res.json(GetRecentActivityResponse.parse(items));
  },
);

router.post("/admin/customers", requireAdmin, async (req, res): Promise<void> => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "الاسم والإيميل وكلمة المرور مطلوبة" });
    return;
  }
  const existing = await db.execute(sql`SELECT id FROM customers WHERE email = ${email} LIMIT 1`);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await db.execute(sql`INSERT INTO customers (name, email, phone, password_hash) VALUES (${name}, ${email}, ${phone || null}, ${hash})`);
  res.status(201).json({ success: true });
});

router.get("/admin/customers/:id/orders", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const customerId = parseInt(id, 10);

  const customerRow = await db.execute(sql`SELECT phone, email FROM customers WHERE id = ${customerId} LIMIT 1`);
  const customer = customerRow.rows[0] as { phone: string; email: string } | undefined;
  if (!customer) { res.status(404).json({ error: "العميل غير موجود" }); return; }

  const rows = await db.execute(sql`
    SELECT id, product_name, quantity, unit_price, total_price, status,
           city, address, tracking_number, created_at, assigned_driver_name,
           customer_id
    FROM orders
    WHERE customer_id = ${customerId}
       OR (customer_id IS NULL AND phone = ${customer.phone || ""})
    ORDER BY created_at DESC
  `);
  res.json(rows.rows);
});

router.get("/admin/customers", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT id, name, email, phone, is_blocked, created_at,
      (SELECT COUNT(*) FROM orders
       WHERE customer_id = customers.id
          OR (customer_id IS NULL AND phone = customers.phone AND customers.phone IS NOT NULL AND customers.phone != '')) as order_count
    FROM customers
    ORDER BY created_at DESC
  `);
  res.json(rows.rows);
});

router.patch("/admin/customers/:id", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { name, email, phone, password } = req.body;
  const customerId = parseInt(id, 10);
  if (isNaN(customerId)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  let changed = false;
  if (name !== undefined) { await db.execute(sql`UPDATE customers SET name = ${name} WHERE id = ${customerId}`); changed = true; }
  if (email !== undefined) { await db.execute(sql`UPDATE customers SET email = ${email} WHERE id = ${customerId}`); changed = true; }
  if (phone !== undefined) { await db.execute(sql`UPDATE customers SET phone = ${phone} WHERE id = ${customerId}`); changed = true; }
  if (password !== undefined && password !== "") {
    const hash = await bcrypt.hash(password, 10);
    await db.execute(sql`UPDATE customers SET password_hash = ${hash} WHERE id = ${customerId}`);
    changed = true;
  }
  if (!changed) { res.status(400).json({ error: "لا توجد بيانات للتعديل" }); return; }
  res.json({ success: true });
});

router.patch("/admin/customers/:id/block", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { blocked } = req.body;
  await db.execute(sql`UPDATE customers SET is_blocked = ${blocked} WHERE id = ${id}`);
  if (blocked) {
    await db.execute(sql`DELETE FROM customer_sessions WHERE customer_id = ${id}`);
  }
  res.json({ success: true });
});

router.delete("/admin/customers/:id", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  await db.execute(sql`DELETE FROM customer_sessions WHERE customer_id = ${id}`);
  await db.execute(sql`DELETE FROM customers WHERE id = ${id}`);
  res.json({ success: true });
});

void sql;

export default router;
