import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireCustomer } from "../middlewares/customer-auth";
import { requireAdmin } from "../middlewares/admin-auth";
import { ChargilyClient } from "@chargily/chargily-pay";

const router: IRouter = Router();

const CHARGILY_API_KEY = process.env.CHARGILY_KEY ?? process.env.CHARGILY_API_KEY ?? "";
const IS_LIVE = !CHARGILY_API_KEY.startsWith("test_");
const chargily = new ChargilyClient({ api_key: CHARGILY_API_KEY, mode: IS_LIVE ? "live" : "test" });

function getSiteUrl(): string {
  const domains = (process.env.REPLIT_DOMAINS ?? "").split(",").filter(Boolean);
  return `https://${domains[0] ?? "localhost"}`;
}

function genTracking(): string {
  return "VF" + new Date().getFullYear() + Math.random().toString(16).slice(2, 10).toUpperCase();
}

// ─── Helper: create an order record for a subscription month ──────────────────
async function createOrderForSubscription(sub: {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  plan_name: string;
  price_at_subscription: number;
  fertilizer_kg: number;
  delivery_address: string;
  delivery_city: string;
  crop_type: string | null;
  notes: string | null;
  payment_method: string;
}, monthLabel: string, presetTracking?: string): Promise<{ orderId: number; tracking: string }> {
  const productName = `${sub.plan_name} — ${monthLabel}`;
  const trackingNumber = presetTracking ?? genTracking();
  const subType = sub.plan_name.includes("سنوي") ? "اشتراك سنوي" : "اشتراك شهري";
  const orderNotes = [
    `${subType} #${sub.id}`,
    sub.crop_type ? `المحصول: ${sub.crop_type}` : null,
    sub.notes ?? null,
  ].filter(Boolean).join(" | ");

  const orderStatus = sub.payment_method === "cod" ? "confirmed" : "confirmed";
  const paymentStatus = sub.payment_method === "cod" ? "pending" : "paid";

  const r = await db.execute(sql`
    INSERT INTO orders
      (customer_name, phone, address, city, product_name, unit_price, quantity, total_price,
       status, payment_method, payment_status, tracking_number,
       customer_id, subscription_id, notes)
    VALUES
      (${sub.customer_name}, ${sub.customer_phone}, ${sub.delivery_address}, ${sub.delivery_city},
       ${productName}, ${sub.price_at_subscription}, 1, ${sub.price_at_subscription},
       ${orderStatus}, ${sub.payment_method}, ${paymentStatus}, ${trackingNumber},
       ${sub.customer_id}, ${sub.id}, ${orderNotes})
    RETURNING id
  `);
  return { orderId: (r.rows[0] as { id: number }).id, tracking: trackingNumber };
}

// ── Public: list active plans ─────────────────────────────────────────────────
router.get("/subscription-plans", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT id, name, name_ar, name_fr, description, description_ar, description_fr,
           price_per_month, fertilizer_kg, includes_tips, includes_plan,
           includes_consultation, color,
           COALESCE(billing_cycle, 'monthly') AS billing_cycle
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
    SELECT id, name_ar, price_per_month, fertilizer_kg, active,
           COALESCE(billing_cycle, 'monthly') AS billing_cycle
    FROM subscription_plans WHERE id = ${planId} AND active = true LIMIT 1
  `);
  if (!planRows.rows.length) { res.status(404).json({ error: "الخطة غير موجودة" }); return; }
  const plan = planRows.rows[0] as {
    id: number; name_ar: string; price_per_month: number; fertilizer_kg: number; billing_cycle: string;
  };

  const existing = await db.execute(sql`
    SELECT 1 FROM subscriptions
    WHERE customer_id = ${customer.id} AND plan_id = ${planId} AND status = 'active' LIMIT 1
  `);
  if (existing.rows.length) { res.status(409).json({ error: "أنت مشترك بالفعل في هذه الخطة" }); return; }

  const isAnnual = plan.billing_cycle === 'annual';
  const nextRenewal = new Date();
  if (isAnnual) {
    nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
  } else {
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);
  }

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
    const now = new Date();
    const monthLabel = now.toLocaleString("ar-DZ", { month: "long", year: "numeric" });
    const firstTracking = genTracking();

    // Create first delivery record (with tracking number)
    await db.execute(sql`
      INSERT INTO subscription_deliveries (subscription_id, month_label, status, tracking_number)
      VALUES (${id}, ${monthLabel}, 'preparing', ${firstTracking})
    `);

    // For annual plans, the stored price_per_month is the annual total — use monthly equivalent for each order
    const monthlyPrice = isAnnual ? Math.round(plan.price_per_month / 10) : plan.price_per_month;

    // Auto-create the first month's order (reuse same tracking number)
    await createOrderForSubscription({
      id, customer_id: customer.id, customer_name: customer.name,
      customer_phone: customer.phone ?? "",
      plan_name: plan.name_ar, price_at_subscription: monthlyPrice,
      fertilizer_kg: plan.fertilizer_kg,
      delivery_address: deliveryAddress, delivery_city: deliveryCity,
      crop_type: cropType ?? null, notes: notes ?? null, payment_method: paymentMethod,
    }, monthLabel, firstTracking);

    const msg = isAnnual
      ? "تم الاشتراك السنوي بنجاح! ستستلم صندوقك كل شهر لمدة 12 شهراً."
      : "تم الاشتراك بنجاح! سيتم إعداد الصندوق الأول وإرساله قريباً.";
    res.status(201).json({ id, paymentMethod: "cod", message: msg });
  } else {
    const siteUrl = getSiteUrl();
    const basePath = process.env.BASE_PATH ?? "";
    try {
      const checkoutAmount = Math.round(plan.price_per_month * 100);
      const checkoutDescription = isAnnual
        ? `اشتراك ${plan.name_ar} — 12 شهراً (شهران مجانًا)`
        : `اشتراك ${plan.name_ar} — الشهر الأول`;
      const checkout = await chargily.createCheckout({
        amount: checkoutAmount,
        currency: "dzd",
        payment_method: "edahabia",
        success_url: `${siteUrl}${basePath}/payment/success?subscription=${id}`,
        failure_url: `${siteUrl}${basePath}/payment/failed?subscription=${id}`,
        webhook_endpoint: `${siteUrl}/api/payments/webhook`,
        locale: "ar",
        description: checkoutDescription,
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

// ── Admin: delete subscription (+ deliveries) ────────────────────────────────
router.delete("/admin/subscriptions/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.execute(sql`DELETE FROM subscription_deliveries WHERE subscription_id = ${id}`);
  const result = await db.execute(sql`DELETE FROM subscriptions WHERE id = ${id} RETURNING id`);
  if (!result.rows.length) { res.status(404).json({ error: "الاشتراك غير موجود" }); return; }
  res.json({ message: "تم حذف الاشتراك" });
});

// ── Admin: update subscription status ────────────────────────────────────────
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

// ── Admin: create a monthly delivery + auto-order ─────────────────────────────
router.post("/admin/subscriptions/:id/deliveries", requireAdmin, async (req, res): Promise<void> => {
  const subId = parseInt(req.params.id, 10);
  const { monthLabel, notes } = req.body ?? {};
  if (!monthLabel) { res.status(400).json({ error: "monthLabel مطلوب" }); return; }

  // Fetch subscription details for order creation
  const subRows = await db.execute(sql`
    SELECT id, customer_id, customer_name, customer_phone, plan_name,
           price_at_subscription, fertilizer_kg, delivery_address, delivery_city,
           crop_type, notes, payment_method
    FROM subscriptions WHERE id = ${subId} LIMIT 1
  `);
  if (!subRows.rows.length) { res.status(404).json({ error: "الاشتراك غير موجود" }); return; }
  const sub = subRows.rows[0] as {
    id: number; customer_id: number; customer_name: string; customer_phone: string;
    plan_name: string; price_at_subscription: number; fertilizer_kg: number;
    delivery_address: string; delivery_city: string;
    crop_type: string | null; notes: string | null; payment_method: string;
  };

  // Create the delivery record
  const delResult = await db.execute(sql`
    INSERT INTO subscription_deliveries (subscription_id, month_label, status, notes)
    VALUES (${subId}, ${monthLabel}, 'preparing', ${notes ?? null})
    RETURNING id
  `);
  const deliveryId = (delResult.rows[0] as { id: number }).id;

  // Auto-create the monthly order
  const orderId = await createOrderForSubscription(sub, monthLabel);

  res.status(201).json({ id: deliveryId, orderId });
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

  // If we have a tracking number, also update the linked order's tracking number
  if (trackingNumber) {
    await db.execute(sql`
      UPDATE orders SET tracking_number = ${trackingNumber}
      WHERE subscription_id = (SELECT subscription_id FROM subscription_deliveries WHERE id = ${id})
        AND tracking_number IS NULL OR tracking_number = ''
    `);
  }

  // Sync delivery status → order status
  if (status === "shipped") {
    await db.execute(sql`
      UPDATE orders SET status = 'shipped'
      WHERE subscription_id = (SELECT subscription_id FROM subscription_deliveries WHERE id = ${id})
        AND status NOT IN ('delivered', 'cancelled')
    `);
  } else if (status === "delivered") {
    await db.execute(sql`
      UPDATE orders SET status = 'delivered', delivered_at = NOW()
      WHERE subscription_id = (SELECT subscription_id FROM subscription_deliveries WHERE id = ${id})
        AND status NOT IN ('cancelled')
    `);
  }

  res.json({ message: "تم التحديث" });
});

// ── Admin: delete a single delivery ──────────────────────────────────────────
router.delete("/admin/deliveries/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  await db.execute(sql`DELETE FROM subscription_deliveries WHERE id = ${id}`);
  res.json({ message: "تم حذف التوصيل" });
});

// ── Export helper for use in payments webhook ─────────────────────────────────
export { createOrderForSubscription };
export default router;
