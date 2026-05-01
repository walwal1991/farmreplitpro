import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, customersTable, customerSessionsTable, ordersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { issueDiscount } from "./rewards";
import { randomBytes } from "node:crypto";
import {
  requireCustomer,
  createCustomerSession,
  getCustomerSessionUser,
} from "../middlewares/customer-auth";
import type { Request } from "express";

const router: IRouter = Router();

function customerToken(): string {
  return randomBytes(32).toString("hex");
}

function extractToken(req: Request): string {
  const header = (req.header("x-customer-token") ?? "").toString().trim();
  if (header) return header;
  const auth = req.header("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

// ─── Register ────────────────────────────────────────────────────────────────
router.post("/customer/register", async (req, res): Promise<void> => {
  const { name, email, phone, password } = req.body ?? {};
  if (!name || !email || !phone || !password) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    return;
  }
  const existing = await db.select().from(customersTable).where(eq(customersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);

  // Resolve referrer from ?ref= query or body
  const refCode = ((req.query.ref ?? req.body.refCode) as string | undefined)?.trim().toUpperCase() ?? null;
  let referrerId: number | null = null;
  if (refCode) {
    const refRow = await db.execute(sql`SELECT id FROM customers WHERE UPPER(referral_code) = ${refCode} LIMIT 1`);
    referrerId = (refRow.rows[0] as { id: number } | undefined)?.id ?? null;
  }

  const [customer] = await db.insert(customersTable)
    .values({ name, email, phone, passwordHash, referredById: referrerId } as typeof customersTable.$inferInsert)
    .returning();

  // Backfill referral code for new customer
  const newRefCode = "REF" + Buffer.from(`${customer.id}${email}`).toString("hex").slice(0, 8).toUpperCase();
  await db.execute(sql`UPDATE customers SET referral_code = ${newRefCode} WHERE id = ${customer.id} AND referral_code IS NULL`);

  // Issue coupons for both referrer and new joiner
  let welcomeCode: string | null = null;
  if (referrerId) {
    // New joiner gets 10% welcome coupon
    welcomeCode = await issueDiscount({ customerId: customer.id, source: "referral_joinee", percent: 10, daysValid: 60 });
    // Referrer gets 15% coupon
    await issueDiscount({ customerId: referrerId, source: "referral_referrer", percent: 15, daysValid: 60 });
  }

  const token = customerToken();
  await createCustomerSession(customer.id, token);
  res.status(201).json({ token, id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, welcomeCode });
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post("/customer/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    return;
  }
  const result = await db.execute(sql`SELECT id, name, email, phone, password_hash, is_blocked FROM customers WHERE email = ${email} LIMIT 1`);
  const customer = result.rows[0] as { id: number; name: string; email: string; phone: string; password_hash: string; is_blocked: boolean } | undefined;
  if (!customer) {
    res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    return;
  }
  if (customer.is_blocked) {
    res.status(403).json({ error: "هذا الحساب محظور. تواصل مع الدعم." });
    return;
  }
  const ok = await bcrypt.compare(password, customer.password_hash);
  if (!ok) {
    res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    return;
  }
  const token = customerToken();
  await createCustomerSession(customer.id, token);
  res.json({ token, id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post("/customer/logout", async (req, res): Promise<void> => {
  const token = extractToken(req);
  if (token) {
    await db.delete(customerSessionsTable).where(eq(customerSessionsTable.token, token));
  }
  res.json({ ok: true });
});

// ─── Me ───────────────────────────────────────────────────────────────────────
router.get("/customer/me", async (req, res): Promise<void> => {
  const token = extractToken(req);
  const customer = await getCustomerSessionUser(token);
  if (!customer) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json(customer);
});

// ─── My Orders ────────────────────────────────────────────────────────────────
router.get("/customer/orders", requireCustomer, async (req, res): Promise<void> => {
  const customer = (req as Request & { customerUser: { id: number; phone: string } }).customerUser;

  const result = await db.execute(sql`
    SELECT id, tracking_number, product_name, quantity, total_price, status,
           city, address, created_at, assigned_driver_name, customer_id
    FROM orders
    WHERE customer_id = ${customer.id}
       OR (customer_id IS NULL AND phone = ${customer.phone || ""} AND ${customer.phone || ""} != '')
    ORDER BY created_at DESC
  `);

  res.json(result.rows.map((o: Record<string, unknown>) => ({
    id: o.id,
    trackingNumber: o.tracking_number,
    productName: o.product_name,
    quantity: o.quantity,
    totalPrice: o.total_price,
    status: o.status,
    city: o.city,
    address: o.address,
    createdAt: o.created_at,
    assignedDriverName: o.assigned_driver_name,
  })));
});

// ─── Track Order (public) ─────────────────────────────────────────────────────
router.get("/orders/track/:trackingNumber", async (req, res): Promise<void> => {
  const { trackingNumber } = req.params;
  const rows = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.trackingNumber, trackingNumber))
    .limit(1);
  const order = rows[0];
  if (!order) {
    res.status(404).json({ error: "رقم التتبع غير صحيح" });
    return;
  }
  res.json({
    id: order.id,
    trackingNumber: order.trackingNumber,
    productName: order.productName,
    quantity: order.quantity,
    totalPrice: order.totalPrice,
    status: order.status,
    city: order.city,
    customerName: order.customerName,
    createdAt: order.createdAt.toISOString(),
    assignedDriverName: order.assignedDriverName,
  });
});

export default router;
