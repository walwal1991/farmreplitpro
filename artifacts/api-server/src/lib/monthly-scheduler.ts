import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

function currentMonthLabel(): string {
  return new Date().toLocaleString("ar-DZ", { month: "long", year: "numeric" });
}

function genTracking(): string {
  return "VF" + new Date().getFullYear() + Math.random().toString(16).slice(2, 10).toUpperCase();
}

export async function autoCreateMonthlyDeliveries(): Promise<void> {
  const monthLabel = currentMonthLabel();

  // Fetch all active subscriptions that don't yet have a delivery for this month
  const subs = await db.execute(sql`
    SELECT s.id, s.customer_id, s.customer_name, s.customer_phone,
           s.plan_name, s.price_at_subscription, s.fertilizer_kg,
           s.delivery_address, s.delivery_city, s.crop_type, s.notes,
           s.payment_method
    FROM subscriptions s
    WHERE s.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM subscription_deliveries d
        WHERE d.subscription_id = s.id AND d.month_label = ${monthLabel}
      )
  `);

  if (!subs.rows.length) return;

  logger.info({ count: subs.rows.length, month: monthLabel }, "Auto-creating monthly deliveries");

  for (const row of subs.rows) {
    const s = row as {
      id: number; customer_id: number; customer_name: string; customer_phone: string;
      plan_name: string; price_at_subscription: number; fertilizer_kg: number;
      delivery_address: string; delivery_city: string;
      crop_type: string | null; notes: string | null; payment_method: string;
    };

    // Create delivery record
    await db.execute(sql`
      INSERT INTO subscription_deliveries (subscription_id, month_label, status)
      VALUES (${s.id}, ${monthLabel}, 'preparing')
    `);

    // Create corresponding order
    const tracking = genTracking();
    const productName = `${s.plan_name} — ${monthLabel}`;
    const orderNotes = [
      `اشتراك شهري #${s.id}`,
      s.crop_type ? `المحصول: ${s.crop_type}` : null,
      s.notes ?? null,
    ].filter(Boolean).join(" | ");

    const paymentStatus = s.payment_method === "cod" ? "pending" : "paid";

    await db.execute(sql`
      INSERT INTO orders
        (customer_name, phone, address, city, product_name, unit_price, quantity, total_price,
         status, payment_method, payment_status, tracking_number, customer_id, subscription_id, notes)
      VALUES
        (${s.customer_name}, ${s.customer_phone}, ${s.delivery_address}, ${s.delivery_city},
         ${productName}, ${s.price_at_subscription}, 1, ${s.price_at_subscription},
         'confirmed', ${s.payment_method}, ${paymentStatus}, ${tracking},
         ${s.customer_id}, ${s.id}, ${orderNotes})
    `);

    // Notify admin
    await db.execute(sql`
      INSERT INTO admin_notifications (type, title, body, reference_id)
      VALUES ('new_order', ${'توصيل تلقائي — ' + monthLabel},
        ${`${s.customer_name} — ${s.plan_name}`}, ${s.id})
    `);

    logger.info({ subscriptionId: s.id, month: monthLabel }, "Auto delivery created");
  }
}

export function startMonthlyScheduler(): void {
  // Run immediately on startup
  autoCreateMonthlyDeliveries().catch(err =>
    logger.error({ err }, "Monthly scheduler error on startup")
  );

  // Then check every 6 hours
  setInterval(() => {
    autoCreateMonthlyDeliveries().catch(err =>
      logger.error({ err }, "Monthly scheduler error")
    );
  }, 6 * 60 * 60 * 1000);
}
