import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, productsTable, ordersTable, deliveryUsersTable } from "@workspace/db";
import { ChargilyClient } from "@chargily/chargily-pay";
import {
  CreateOrderBody,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/admin-auth";
import { getCustomerSessionUser } from "../middlewares/customer-auth";

const CHARGILY_API_KEY = process.env.CHARGILY_API_KEY ?? "";
const IS_LIVE = !CHARGILY_API_KEY.startsWith("test_");
const chargilyClient = CHARGILY_API_KEY
  ? new ChargilyClient({ api_key: CHARGILY_API_KEY, mode: IS_LIVE ? "live" : "test" })
  : null;

function getSiteUrl(): string {
  const domains = (process.env.REPLIT_DOMAINS ?? "").split(",").filter(Boolean);
  return `https://${domains[0] ?? "localhost"}`;
}

function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `VF${year}${rand}`;
}

const router: IRouter = Router();

// ─── Cart checkout: multiple items → ONE order, ONE tracking, ONE payment ─────
router.post("/orders/cart", async (req, res): Promise<void> => {
  const { customerName, phone, address, city, notes, requiresSignature, paymentMethod, discountCode, items } = req.body ?? {};

  if (!customerName || !phone || !address || !city) {
    res.status(400).json({ error: "بيانات ناقصة" });
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "السلة فارغة" });
    return;
  }

  // Validate and price all products
  interface CartItem { productId: number; productName: string; unitPrice: number; quantity: number; lineTotal: number; }
  const cartItems: CartItem[] = [];
  for (const it of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, it.productId));
    if (!product || !product.active) {
      res.status(400).json({ error: `المنتج غير متوفر: ${it.productId}` });
      return;
    }
    cartItems.push({ productId: product.id, productName: product.name, unitPrice: product.price, quantity: it.quantity, lineTotal: product.price * it.quantity });
  }

  let totalPrice = cartItems.reduce((s, i) => s + i.lineTotal, 0);

  // Link customer account
  const customerToken = (req.header("x-customer-token") ?? "").trim();
  let customerId: number | null = null;
  if (customerToken) {
    const customer = await getCustomerSessionUser(customerToken);
    if (customer) customerId = customer.id;
  }

  // Validate discount code
  const discountCodeRaw = ((discountCode ?? "") as string).trim().toUpperCase();
  let discountCodeUsed: string | null = null;
  let discountAmount = 0;
  if (discountCodeRaw) {
    const dcResult = await db.execute(sql`
      SELECT id, code, discount_percent, used, expires_at
      FROM discount_codes WHERE UPPER(code) = ${discountCodeRaw} LIMIT 1
    `);
    const dc = dcResult.rows[0] as { id: number; code: string; discount_percent: number; used: boolean; expires_at: string | null; } | undefined;
    if (dc && !dc.used && (!dc.expires_at || new Date(dc.expires_at) >= new Date())) {
      discountAmount = Math.round(totalPrice * dc.discount_percent / 100);
      totalPrice = Math.max(0, totalPrice - discountAmount);
      discountCodeUsed = dc.code;
    }
  }

  const trackingNumber = generateTrackingNumber();
  const sig = typeof requiresSignature === "boolean" ? requiresSignature : false;
  const pm = paymentMethod === "online" ? "online" : "cod";
  const productLabel = cartItems.length === 1
    ? `${cartItems[0].productName} ×${cartItems[0].quantity}`
    : `${cartItems.length} منتجات`;
  const itemsJson = JSON.stringify(cartItems);

  const [row] = await db.execute(sql`
    INSERT INTO orders (tracking_number, customer_id, customer_name, phone, address, city, notes,
      product_id, product_name, unit_price, quantity, total_price, status, requires_signature,
      discount_code_used, discount_amount, payment_method, payment_status, items_json)
    VALUES (
      ${trackingNumber}, ${customerId}, ${customerName}, ${phone},
      ${address}, ${city}, ${notes ?? null},
      NULL, ${productLabel}, ${totalPrice}, 1, ${totalPrice},
      'pending', ${sig}, ${discountCodeUsed}, ${discountAmount},
      ${pm}, 'pending', ${itemsJson}
    ) RETURNING *
  `).then(r => r.rows as Array<Record<string, unknown>>);

  const orderId = row.id as number;

  if (discountCodeUsed) {
    await db.execute(sql`UPDATE discount_codes SET used = true, used_at = NOW() WHERE UPPER(code) = ${discountCodeUsed}`);
  }

  // Decrement stock for each cart item
  for (const item of cartItems) {
    await db.execute(sql`
      UPDATE products SET stock = GREATEST(0, stock - ${item.quantity}) WHERE id = ${item.productId}
    `);
  }

  await db.execute(sql`
    INSERT INTO admin_notifications (type, title, body, reference_id)
    VALUES ('new_order', ${'طلب جديد #' + orderId}, ${`${customerName} — ${city} — ${totalPrice} د.ج`}, ${orderId})
  `);

  if (pm === "online" && chargilyClient) {
    try {
      const siteUrl = getSiteUrl();
      const basePath = process.env.BASE_PATH ?? "";
      const checkout = await chargilyClient.createCheckout({
        amount: Math.round(totalPrice * 100),
        currency: "dzd",
        payment_method: "edahabia",
        success_url: `${siteUrl}${basePath}/payment/success?order=${orderId}`,
        failure_url: `${siteUrl}${basePath}/payment/failed?order=${orderId}`,
        webhook_endpoint: `${siteUrl}/api/payments/webhook`,
        locale: "ar",
        description: `${productLabel} — ${trackingNumber}`,
        metadata: { orderId: String(orderId), trackingNumber },
      });
      const checkoutUrl = (checkout as unknown as { checkout_url: string }).checkout_url;
      await db.execute(sql`UPDATE orders SET chargily_checkout_id = ${checkout.id}, payment_status = 'awaiting' WHERE id = ${orderId}`);
      res.status(201).json({ id: orderId, trackingNumber, checkoutUrl, discountAmount, discountCodeUsed });
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await db.execute(sql`UPDATE orders SET payment_method = 'cod' WHERE id = ${orderId}`);
      res.status(201).json({ id: orderId, trackingNumber, discountAmount, discountCodeUsed, chargilyError: msg });
      return;
    }
  }

  res.status(201).json({ id: orderId, trackingNumber, discountAmount, discountCodeUsed });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  if (!product.active) {
    res.status(400).json({ error: "Product is not available" });
    return;
  }
  let totalPrice = product.price * parsed.data.quantity;

  // Link to customer account if token provided
  const customerToken = (req.header("x-customer-token") ?? "").trim();
  let customerId: number | null = null;
  if (customerToken) {
    const customer = await getCustomerSessionUser(customerToken);
    if (customer) customerId = customer.id;
  }

  // Validate discount code if provided
  const discountCodeRaw = ((req.body.discountCode ?? "") as string).trim().toUpperCase();
  let discountCodeUsed: string | null = null;
  let discountAmount = 0;

  if (discountCodeRaw) {
    const dcResult = await db.execute(sql`
      SELECT id, code, discount_percent, used, expires_at
      FROM discount_codes WHERE UPPER(code) = ${discountCodeRaw} LIMIT 1
    `);
    const dc = dcResult.rows[0] as {
      id: number; code: string; discount_percent: number; used: boolean; expires_at: string | null;
    } | undefined;

    if (dc && !dc.used && (!dc.expires_at || new Date(dc.expires_at) >= new Date())) {
      discountAmount = Math.round(totalPrice * dc.discount_percent / 100);
      totalPrice = Math.max(0, totalPrice - discountAmount);
      discountCodeUsed = dc.code;
    }
  }

  const trackingNumber = generateTrackingNumber();
  const requiresSignature = typeof req.body.requiresSignature === "boolean" ? req.body.requiresSignature : false;
  const paymentMethod = req.body.paymentMethod === "online" ? "online" : "cod";

  const [row] = await db.execute(sql`
    INSERT INTO orders (tracking_number, customer_id, customer_name, phone, address, city, notes,
      product_id, product_name, unit_price, quantity, total_price, status, requires_signature,
      discount_code_used, discount_amount, payment_method, payment_status)
    VALUES (
      ${trackingNumber}, ${customerId}, ${parsed.data.customerName}, ${parsed.data.phone},
      ${parsed.data.address}, ${parsed.data.city}, ${parsed.data.notes ?? null},
      ${product.id}, ${product.name}, ${product.price}, ${parsed.data.quantity}, ${totalPrice},
      'pending', ${requiresSignature}, ${discountCodeUsed}, ${discountAmount},
      ${paymentMethod}, 'pending'
    ) RETURNING *
  `).then(r => r.rows as Array<Record<string, unknown>>);

  const orderId = row.id as number;

  // Mark discount code as used
  if (discountCodeUsed) {
    await db.execute(sql`UPDATE discount_codes SET used = true, used_at = NOW() WHERE UPPER(code) = ${discountCodeUsed}`);
  }

  // Decrement stock
  await db.execute(sql`
    UPDATE products SET stock = GREATEST(0, stock - ${parsed.data.quantity}) WHERE id = ${product.id}
  `);

  // Fire admin notification for new order
  await db.execute(sql`
    INSERT INTO admin_notifications (type, title, body, reference_id)
    VALUES (
      'new_order',
      ${'طلب جديد #' + orderId},
      ${`${parsed.data.customerName} — ${parsed.data.city} — ${totalPrice} د.ج`},
      ${orderId}
    )
  `);

  // If online payment, create Chargily checkout session
  if (paymentMethod === "online" && chargilyClient) {
    try {
      const siteUrl = getSiteUrl();
      const basePath = process.env.BASE_PATH ?? "";
      const amountCentimes = Math.round(totalPrice * 100);

      const checkout = await chargilyClient.createCheckout({
        amount: amountCentimes,
        currency: "dzd",
        payment_method: "edahabia",
        success_url: `${siteUrl}${basePath}/payment/success?order=${orderId}`,
        failure_url: `${siteUrl}${basePath}/payment/failed?order=${orderId}`,
        webhook_endpoint: `${siteUrl}/api/payments/webhook`,
        locale: "ar",
        description: `طلب ${product.name} × ${parsed.data.quantity} — ${trackingNumber}`,
        metadata: { orderId: String(orderId), trackingNumber },
      });

      const checkoutUrl = (checkout as unknown as { checkout_url: string }).checkout_url;
      await db.execute(sql`
        UPDATE orders SET chargily_checkout_id = ${checkout.id}, payment_status = 'awaiting'
        WHERE id = ${orderId}
      `);

      res.status(201).json({ id: orderId, trackingNumber, checkoutUrl, discountAmount, discountCodeUsed });
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Fall back to COD if Chargily fails
      await db.execute(sql`UPDATE orders SET payment_method = 'cod' WHERE id = ${orderId}`);
      res.status(201).json({ id: orderId, trackingNumber, discountAmount, discountCodeUsed, chargilyError: msg });
      return;
    }
  }

  res.status(201).json({ id: orderId, trackingNumber, discountAmount, discountCodeUsed });
});

router.get(
  "/admin/orders",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
    res.json(rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      assignedDriverId: r.assignedDriverId ?? null,
      assignedDriverName: r.assignedDriverName ?? null,
    })));
  },
);

// ─── Admin: assign driver to order ────────────────────────────────────────────
router.patch(
  "/admin/orders/:id/assign",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { driverId } = req.body ?? {};

    if (driverId === null || driverId === undefined) {
      // Unassign
      await db.update(ordersTable)
        .set({ assignedDriverId: null, assignedDriverName: null })
        .where(eq(ordersTable.id, id));
      res.json({ ok: true, assignedDriverId: null, assignedDriverName: null });
      return;
    }

    const driverRows = await db
      .select({ id: deliveryUsersTable.id, name: deliveryUsersTable.name, active: deliveryUsersTable.active })
      .from(deliveryUsersTable)
      .where(eq(deliveryUsersTable.id, driverId))
      .limit(1);

    const driver = driverRows[0];
    if (!driver || !driver.active) {
      res.status(404).json({ error: "السائق غير موجود أو محظور" });
      return;
    }

    await db.update(ordersTable)
      .set({ assignedDriverId: driver.id, assignedDriverName: driver.name })
      .where(eq(ordersTable.id, id));

    res.json({ ok: true, assignedDriverId: driver.id, assignedDriverName: driver.name });
  },
);

router.patch(
  "/admin/orders/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateOrderStatusParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateOrderStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .update(ordersTable)
      .set({ status: parsed.data.status })
      .where(eq(ordersTable.id, params.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Sync delivery record if this order belongs to a subscription
    if (row.subscriptionId) {
      const newStatus = parsed.data.status;
      if (newStatus === "shipped") {
        await db.execute(sql`
          UPDATE subscription_deliveries
          SET status = 'shipped', shipped_at = COALESCE(shipped_at, NOW())
          WHERE subscription_id = ${row.subscriptionId}
            AND status = 'preparing'
        `);
      } else if (newStatus === "delivered") {
        await db.execute(sql`
          UPDATE subscription_deliveries
          SET status = 'delivered', delivered_at = COALESCE(delivered_at, NOW())
          WHERE subscription_id = ${row.subscriptionId}
            AND status IN ('preparing', 'shipped')
        `);
      }
    }

    res.json(UpdateOrderStatusResponse.parse(row));
  },
);

router.patch(
  "/admin/orders/:id/details",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
    const { customerName, phone, address, city, notes, quantity, requiresSignature } = req.body;
    const updates: Partial<typeof ordersTable.$inferInsert> = {};
    if (customerName !== undefined) updates.customerName = customerName;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (notes !== undefined) updates.notes = notes;
    if (typeof requiresSignature === "boolean") updates.requiresSignature = requiresSignature;
    if (quantity !== undefined) {
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty < 1) { res.status(400).json({ error: "الكمية غير صالحة" }); return; }
      updates.quantity = qty;
      const [existing] = await db.select({ unitPrice: ordersTable.unitPrice }).from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
      if (existing) updates.totalPrice = existing.unitPrice * qty;
    }
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "لا توجد بيانات للتعديل" }); return; }
    const [row] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
    res.json({ ok: true });
  },
);

router.delete(
  "/admin/orders/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
    const [row] = await db.delete(ordersTable).where(eq(ordersTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
    res.json({ ok: true });
  },
);

export default router;
