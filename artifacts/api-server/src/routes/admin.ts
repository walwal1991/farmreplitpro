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

void sql;

export default router;
