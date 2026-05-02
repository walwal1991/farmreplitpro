import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireCustomer } from "../middlewares/customer-auth";
import { requireAdmin } from "../middlewares/admin-auth";
import { ChargilyClient } from "@chargily/chargily-pay";
import { createHmac } from "node:crypto";

const router: IRouter = Router();

const CHARGILY_API_KEY = process.env.CHARGILY_API_KEY ?? "";
const IS_LIVE = !CHARGILY_API_KEY.startsWith("test_");
const chargily = new ChargilyClient({ api_key: CHARGILY_API_KEY, mode: IS_LIVE ? "live" : "test" });

function getSiteUrl(): string {
  const domains = (process.env.REPLIT_DOMAINS ?? "").split(",").filter(Boolean);
  return `https://${domains[0] ?? "localhost"}`;
}

// ── Public: list active plans ─────────────────────────────────────────────────
router.get("/subscription-plans", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT id, name, name_ar, name_fr, description, description_ar, description_fr,
           price_per_month, fertilizer_kg, includes_tips, includes_plan,
           includes_consultation, color
    FROM subscription_plans WHERE active = true ORDER BY price_per_month ASC
  `);
  res.json(rows.rows);
});

// ── Customer: subscribe ───────────────────────────────────────────────────────
router.post("/subscriptions", requireCustomer, async (req, res): Promise<void> => {
  const customer = (req as any).customerUser;
  const { planId, cropType, deliveryAddress, deliveryCity, notes, paymentMethod = "cod" } = req.body ?? {};

  if (!planId || !deliveryAddress || !deliveryCity) {
    res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة" });
    return;
  }
  if (!["cod", "online"].includes(paymentMethod)) {
    res.status(400).json({ error: "طريقة الدفع غير صالحة" });
    return;
  }

  const planRows = await db.execute(sql`
    SELECT id, name_ar, price_per_month, fertilizer_kg, active
    FROM subscription_plans WHERE id = ${planId} AND active = true LIMIT 1
  `);
  if (!planRows.rows.length) { res.status(404).json({ error: "الخطة غير موجودة" }); return; }
  const plan = planRows.rows[0] as { id: number; name_ar: string; price_per_month: number; fertilizer_kg: number };

  const existing = await db.execute(sql`
    SELECT 1 FROM subscriptions
    WHERE customer_id = ${customer.id} AND plan_id = ${planId} AND status = 'active' LIMIT 1
  `);
  if (existing.rows.length) { res.status(409).json({ error: "أنت مشترك بالفعل في هذه الخطة" }); return; }

  const nextRenewal = new Date();
  nextRenewal.setMonth(nextRenewal.getMonth() + 1);

  // COD subscriptions are immediately active; online starts as pending_payment
  const initialStatus = paymentMethod === "cod" ? "active" : "pending_payment";
  const initialPaymentStatus = paymentMethod === "cod" ? "cod" : "awaiting";

  const result = await db.execute(sql`
    INSERT INTO subscriptions
      (customer_id, customer_name, customer_phone, plan_id, plan_name,
       price_at_subscription, fertilizer_kg, crop_type,
       delivery_address, delivery_city, status, next_renewal_date, notes,
       payment_method, payment_status)
    VALUES
      (${customer.id}, ${customer.name}, ${customer.phone ?? ""}, ${plan.id},
       ${plan.name_ar}, ${plan.price_per_month}, ${plan.fertilizer_kg},
       ${cropType ?? null}, ${deliveryAddress}, ${deliveryCity},
       ${initialStatus}, ${nextRenewal.toISOString()}, ${notes ?? null},
       ${paymentMethod}, ${initialPaymentStatus})
    RETURNING id
  `);
  const id = (result.rows[0] as { id: number }).id;

  if (paymentMethod === "cod") {
    // Create the first month's delivery record immediately
    const now = new Date();
    const monthLabel = now.toLocaleString("ar-DZ", { month: "long", year: "numeric" });
    await db.execute(sql`
      INSERT INTO subscription_deliveries (subscription_id, month_label, status)
      VALUES (${id}, ${monthLabel}, 'preparing')
    `);
    res.status(201).json({ id, paymentMethod: "cod", message: "تم الاشتراك بنجاح! سيتم إعداد الصندوق الأول وإرساله قريباً." });
  } else {
    // Initiate Chargily checkout for the first month
    const siteUrl = getSiteUrl();
    const basePath = process.env.BASE_PATH ?? "";
    try {
      const checkout = await chargily.createCheckout({
        amount: Math.round(plan.price_per_month * 100),
        currency: "dzd",
        payment_method: "edahabia",
        success_url: `${siteUrl}${basePath}/payment/success?subscription=${id}`,
        failure_url: `${siteUrl}${basePath}/payment/failed?subscription=${id}`,
        webhook_endpoint: `${siteUrl}/api/payments/webhook`,
        locale: "ar",
        description: `اشتراك ${plan.name_ar} — الشهر الأول`,
        metadata: { subscriptionId: String(id) },
      });
      await db.execute(sql`
        UPDATE subscriptions SET chargily_checkout_id = ${checkout.id} WHERE id = ${id}
      `);
      res.status(201).json({
        id,
        paymentMethod: "online",
        checkoutUrl: (checkout as unknown as { checkout_url: string }).checkout_url,
      });
    } catch (err: unknown) {
      // Rollback subscription if Chargily fails
      await db.execute(sql`DELETE FROM subscriptions WHERE id = ${id}`);
      res.status(502).json({ error: `خطأ في بوابة الدفع: ${err instanceof Error ? err.message : String(err)}` });
    }
  }
});

// ── Customer: my subscriptions + deliveries ───────────────────────────────────
router.get("/customer/subscriptions", requireCustomer, async (req, res): Promise<void> => {
  const customer = (req as any).customerUser;
  const rows = await db.execute(sql`
    SELECT s.id, s.plan_id, s.plan_name, s.price_at_subscription, s.fertilizer_kg,
           s.crop_type, s.delivery_address, s.delivery_city, s.status,
           s.payment_method, s.payment_status,
           s.start_date, s.next_renewal_date, s.notes, s.created_at,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', d.id, 'month_label', d.month_label, 'status', d.status,
                 'tracking_number', d.tracking_number, 'shipped_at', d.shipped_at,
                 'delivered_at', d.delivered_at, 'notes', d.notes
               ) ORDER BY d.created_at DESC
             ) FILTER (WHERE d.id IS NOT NULL), '[]'
           ) AS deliveries
    FROM subscriptions s
    LEFT JOIN subscription_deliveries d ON d.subscription_id = s.id
    WHERE s.customer_id = ${customer.id}
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);
  res.json(rows.rows);
});

// ── Customer: cancel ──────────────────────────────────────────────────────────
router.patch("/customer/subscriptions/:id/cancel", requireCustomer, async (req, res): Promise<void> => {
  const customer = (req as any).customerUser;
  const id = parseInt(req.params.id, 10);
  const result = await db.execute(sql`
    UPDATE subscriptions SET status = 'cancelled'
    WHERE id = ${id} AND customer_id = ${customer.id} AND status IN ('active','pending_payment')
    RETURNING id
  `);
  if (!result.rows.length) { res.status(404).json({ error: "الاشتراك غير موجود أو تم إلغاؤه مسبقاً" }); return; }
  res.json({ message: "تم إلغاء الاشتراك" });
});

// ── Admin: list subscriptions with deliveries ─────────────────────────────────
router.get("/admin/subscriptions", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT s.id, s.customer_id, s.customer_name, s.customer_phone,
           s.plan_name, s.price_at_subscription, s.fertilizer_kg,
           s.crop_type, s.delivery_address, s.delivery_city,
           s.status, s.payment_method, s.payment_status,
           s.start_date, s.next_renewal_date, s.notes, s.created_at,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', d.id, 'month_label', d.month_label, 'status', d.status,
                 'tracking_number', d.tracking_number, 'shipped_at', d.shipped_at,
                 'delivered_at', d.delivered_at, 'notes', d.notes, 'created_at', d.created_at
               ) ORDER BY d.created_at DESC
             ) FILTER (WHERE d.id IS NOT NULL), '[]'
           ) AS deliveries
    FROM subscriptions s
    LEFT JOIN subscription_deliveries d ON d.subscription_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);
  res.json(rows.rows);
});

// ── Admin: update subscription status/notes ───────────────────────────────────
router.patch("/admin/subscriptions/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status, notes } = req.body ?? {};
  const allowed = ["active", "paused", "cancelled", "pending_payment"];
  if (status && !allowed.includes(status)) { res.status(400).json({ error: "حالة غير صالحة" }); return; }
  await db.execute(sql`
    UPDATE subscriptions
    SET status = COALESCE(${status ?? null}, status),
        notes  = COALESCE(${notes ?? null}, notes)
    WHERE id = ${id}
  `);
  res.json({ message: "تم التحديث" });
});

// ── Admin: create a monthly delivery ─────────────────────────────────────────
router.post("/admin/subscriptions/:id/deliveries", requireAdmin, async (req, res): Promise<void> => {
  const subId = parseInt(req.params.id, 10);
  const { monthLabel, notes } = req.body ?? {};
  if (!monthLabel) { res.status(400).json({ error: "month_label مطلوب" }); return; }

  const result = await db.execute(sql`
    INSERT INTO subscription_deliveries (subscription_id, month_label, status, notes)
    VALUES (${subId}, ${monthLabel}, 'preparing', ${notes ?? null})
    RETURNING id
  `);
  res.status(201).json({ id: (result.rows[0] as { id: number }).id });
});

// ── Admin: update delivery status ─────────────────────────────────────────────
router.patch("/admin/deliveries/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status, trackingNumber, notes } = req.body ?? {};
  const allowed = ["preparing", "shipped", "delivered"];
  if (status && !allowed.includes(status)) { res.status(400).json({ error: "حالة غير صالحة" }); return; }

  await db.execute(sql`
    UPDATE subscription_deliveries
    SET status          = COALESCE(${status ?? null}, status),
        tracking_number = COALESCE(${trackingNumber ?? null}, tracking_number),
        notes           = COALESCE(${notes ?? null}, notes),
        shipped_at   = CASE WHEN ${status ?? null} = 'shipped'   AND shipped_at   IS NULL THEN NOW() ELSE shipped_at   END,
        delivered_at = CASE WHEN ${status ?? null} = 'delivered' AND delivered_at IS NULL THEN NOW() ELSE delivered_at END
    WHERE id = ${id}
  `);
  res.json({ message: "تم التحديث" });
});

export default router;
