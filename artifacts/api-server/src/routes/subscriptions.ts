import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireCustomer } from "../middlewares/customer-auth";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

// ── Public: list active plans ─────────────────────────────────────────────────
router.get("/subscription-plans", async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT id, name, name_ar, name_fr, description, description_ar, description_fr,
           price_per_month, fertilizer_kg, includes_tips, includes_plan,
           includes_consultation, color
    FROM subscription_plans WHERE active = true ORDER BY price_per_month ASC
  `);
  res.json(rows.rows);
});

// ── Customer: subscribe to a plan ─────────────────────────────────────────────
router.post("/subscriptions", requireCustomer, async (req, res): Promise<void> => {
  const customer = (req as any).customerUser;
  const { planId, cropType, deliveryAddress, deliveryCity, notes } = req.body ?? {};

  if (!planId || !deliveryAddress || !deliveryCity) {
    res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة" });
    return;
  }

  const planRows = await db.execute(sql`
    SELECT id, name_ar, price_per_month, fertilizer_kg, active
    FROM subscription_plans WHERE id = ${planId} AND active = true LIMIT 1
  `);
  if (!planRows.rows.length) {
    res.status(404).json({ error: "الخطة غير موجودة" });
    return;
  }
  const plan = planRows.rows[0] as {
    id: number; name_ar: string; price_per_month: number; fertilizer_kg: number;
  };

  // One active subscription per customer per plan
  const existing = await db.execute(sql`
    SELECT 1 FROM subscriptions
    WHERE customer_id = ${customer.id} AND plan_id = ${planId} AND status = 'active'
    LIMIT 1
  `);
  if (existing.rows.length) {
    res.status(409).json({ error: "أنت مشترك بالفعل في هذه الخطة" });
    return;
  }

  const nextRenewal = new Date();
  nextRenewal.setMonth(nextRenewal.getMonth() + 1);

  const result = await db.execute(sql`
    INSERT INTO subscriptions
      (customer_id, customer_name, customer_phone, plan_id, plan_name,
       price_at_subscription, fertilizer_kg, crop_type,
       delivery_address, delivery_city, status, next_renewal_date, notes)
    VALUES
      (${customer.id}, ${customer.name}, ${customer.phone ?? ""}, ${plan.id},
       ${plan.name_ar}, ${plan.price_per_month}, ${plan.fertilizer_kg},
       ${cropType ?? null}, ${deliveryAddress}, ${deliveryCity},
       'active', ${nextRenewal.toISOString()}, ${notes ?? null})
    RETURNING id
  `);
  const id = (result.rows[0] as { id: number }).id;
  res.status(201).json({ id, message: "تم الاشتراك بنجاح! سيتم التواصل معك قريباً لتأكيد التوصيل." });
});

// ── Customer: my subscriptions ────────────────────────────────────────────────
router.get("/customer/subscriptions", requireCustomer, async (req, res): Promise<void> => {
  const customer = (req as any).customerUser;
  const rows = await db.execute(sql`
    SELECT id, plan_id, plan_name, price_at_subscription, fertilizer_kg,
           crop_type, delivery_address, delivery_city, status,
           start_date, next_renewal_date, notes, created_at
    FROM subscriptions WHERE customer_id = ${customer.id}
    ORDER BY created_at DESC
  `);
  res.json(rows.rows);
});

// ── Customer: cancel subscription ─────────────────────────────────────────────
router.patch("/customer/subscriptions/:id/cancel", requireCustomer, async (req, res): Promise<void> => {
  const customer = (req as any).customerUser;
  const { id } = req.params;
  const result = await db.execute(sql`
    UPDATE subscriptions SET status = 'cancelled'
    WHERE id = ${parseInt(id, 10)} AND customer_id = ${customer.id} AND status = 'active'
    RETURNING id
  `);
  if (!result.rows.length) {
    res.status(404).json({ error: "الاشتراك غير موجود أو تم إلغاؤه مسبقاً" });
    return;
  }
  res.json({ message: "تم إلغاء الاشتراك" });
});

// ── Admin: list all subscriptions ─────────────────────────────────────────────
router.get("/admin/subscriptions", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT s.id, s.customer_id, s.customer_name, s.customer_phone,
           s.plan_id, s.plan_name, s.price_at_subscription, s.fertilizer_kg,
           s.crop_type, s.delivery_address, s.delivery_city,
           s.status, s.start_date, s.next_renewal_date, s.notes, s.created_at
    FROM subscriptions s
    ORDER BY s.created_at DESC
  `);
  res.json(rows.rows);
});

// ── Admin: update subscription status ────────────────────────────────────────
router.patch("/admin/subscriptions/:id", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { status, notes } = req.body ?? {};
  const allowed = ["active", "paused", "cancelled"];
  if (status && !allowed.includes(status)) {
    res.status(400).json({ error: "حالة غير صالحة" });
    return;
  }
  await db.execute(sql`
    UPDATE subscriptions
    SET status = COALESCE(${status ?? null}, status),
        notes  = COALESCE(${notes ?? null}, notes)
    WHERE id = ${parseInt(id, 10)}
  `);
  res.json({ message: "تم التحديث" });
});

export default router;
