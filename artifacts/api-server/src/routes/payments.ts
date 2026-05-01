import { Router, type IRouter } from "express";
import { ChargilyClient } from "@chargily/chargily-pay";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { createHmac } from "node:crypto";

const router: IRouter = Router();

const CHARGILY_API_KEY = process.env.CHARGILY_API_KEY ?? "";
const IS_LIVE = !CHARGILY_API_KEY.startsWith("test_");

const chargily = new ChargilyClient({
  api_key: CHARGILY_API_KEY,
  mode: IS_LIVE ? "live" : "test",
});

function getSiteUrl(): string {
  const domains = (process.env.REPLIT_DOMAINS ?? "").split(",").filter(Boolean);
  const domain = domains[0] ?? "localhost";
  return `https://${domain}`;
}

// ─── POST /api/payments/initiate  ─────────────────────────────────────────────
// Called after order is created with paymentMethod='online'.
// Creates a Chargily checkout and returns the redirect URL.
router.post("/payments/initiate", async (req, res): Promise<void> => {
  const { orderId } = req.body ?? {};
  if (!orderId) { res.status(400).json({ error: "orderId required" }); return; }

  const result = await db.execute(sql`
    SELECT id, tracking_number, total_price, product_name, quantity, payment_method
    FROM orders WHERE id = ${orderId} LIMIT 1
  `);
  const order = result.rows[0] as {
    id: number; tracking_number: string; total_price: number;
    product_name: string; quantity: number; payment_method: string;
  } | undefined;

  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (order.payment_method !== "online") {
    res.status(400).json({ error: "Order is not set for online payment" }); return;
  }

  const siteUrl = getSiteUrl();
  const basePath = process.env.BASE_PATH ?? "";

  // Chargily amounts are in centimes (×100)
  const amountCentimes = Math.round(order.total_price * 100);

  try {
    const checkout = await chargily.createCheckout({
      amount: amountCentimes,
      currency: "dzd",
      payment_method: "edahabia",
      success_url: `${siteUrl}${basePath}/payment/success?order=${orderId}`,
      failure_url: `${siteUrl}${basePath}/payment/failed?order=${orderId}`,
      webhook_endpoint: `${siteUrl}/api/payments/webhook`,
      locale: "ar",
      description: `طلب ${order.product_name} × ${order.quantity} — ${order.tracking_number}`,
      metadata: { orderId: String(orderId), trackingNumber: order.tracking_number },
    });

    // Save Chargily checkout ID against the order
    await db.execute(sql`
      UPDATE orders SET chargily_checkout_id = ${checkout.id}, payment_status = 'awaiting'
      WHERE id = ${orderId}
    `);

    res.json({ checkoutUrl: (checkout as unknown as { checkout_url: string }).checkout_url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Chargily error: ${msg}` });
  }
});

// ─── POST /api/payments/webhook  ──────────────────────────────────────────────
// Chargily calls this when a payment is completed or failed.
router.post("/payments/webhook", async (req, res): Promise<void> => {
  try {
    const signature = (req.headers["signature"] as string) ?? "";
    const rawBody = JSON.stringify(req.body);

    // Verify HMAC-SHA256 signature using the secret key
    if (signature && CHARGILY_API_KEY) {
      const expected = createHmac("sha256", CHARGILY_API_KEY)
        .update(rawBody)
        .digest("hex");
      if (expected !== signature) {
        res.status(401).json({ error: "Invalid signature" });
        return;
      }
    }

    const event = req.body as {
      type: string;
      data: { id: string; status: string; metadata?: Record<string, string> };
    };

    if (event.type === "checkout.paid" || event.data?.status === "paid") {
      const checkoutId = event.data?.id;
      const orderId = event.data?.metadata?.orderId;

      if (checkoutId || orderId) {
        const whereClause = orderId
          ? sql`id = ${parseInt(orderId, 10)}`
          : sql`chargily_checkout_id = ${checkoutId}`;

        await db.execute(sql`
          UPDATE orders
          SET payment_status = 'paid', status = 'confirmed'
          WHERE ${whereClause}
        `);
      }
    } else if (event.type === "checkout.failed" || event.data?.status === "failed") {
      const checkoutId = event.data?.id;
      const orderId = event.data?.metadata?.orderId;
      const whereClause = orderId
        ? sql`id = ${parseInt(orderId, 10)}`
        : sql`chargily_checkout_id = ${checkoutId}`;
      await db.execute(sql`
        UPDATE orders SET payment_status = 'failed' WHERE ${whereClause}
      `);
    }

    res.sendStatus(200);
  } catch {
    res.sendStatus(200); // Always 200 to prevent Chargily retries on our errors
  }
});

// ─── GET /api/payments/status/:orderId  ───────────────────────────────────────
// Frontend polls this after returning from Chargily to check payment status.
router.get("/payments/status/:orderId", async (req, res): Promise<void> => {
  const orderId = parseInt(req.params.orderId, 10);
  const result = await db.execute(sql`
    SELECT id, tracking_number, payment_status, status
    FROM orders WHERE id = ${orderId} LIMIT 1
  `);
  const order = result.rows[0] as {
    id: number; tracking_number: string; payment_status: string; status: string;
  } | undefined;
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({ paymentStatus: order.payment_status, orderStatus: order.status, trackingNumber: order.tracking_number });
});

export default router;
