import { Router, type IRouter } from "express";
import { sql, desc } from "drizzle-orm";
import { db, ordersTable, consultationsTable, productsTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminStatsResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const password = process.env["ADMIN_PASSWORD"];
  const username = process.env["ADMIN_USERNAME"] ?? "admin";
  if (!password) {
    req.log.error("ADMIN_PASSWORD env var not configured");
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }
  if (
    parsed.data.username !== username ||
    parsed.data.password !== password
  ) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }
  res.json(AdminLoginResponse.parse({ token: password }));
});

router.get(
  "/admin/stats",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const allOrders = await db.select().from(ordersTable);
    const allConsults = await db.select().from(consultationsTable);
    const products = await db.select().from(productsTable);

    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
    const deliveredOrders = allOrders.filter((o) => o.status === "delivered").length;
    const totalRevenue = allOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.totalPrice), 0);

    const totalConsultations = allConsults.length;
    const newConsultations = allConsults.filter((c) => c.status === "new").length;
    const totalProducts = products.length;

    const statusBuckets = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
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
  },
);

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

// suppress unused
void sql;

export default router;
