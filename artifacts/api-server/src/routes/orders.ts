import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, productsTable, ordersTable, deliveryUsersTable } from "@workspace/db";
import {
  CreateOrderBody,
  ListOrdersResponse,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
  GetProductResponse as OrderResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/admin-auth";
import { getCustomerSessionUser } from "../middlewares/customer-auth";

function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `VF${year}${rand}`;
}

// Reuse a generic order parser via direct cast — orders.ts has no specific GetOrderResponse;
// ListOrdersResponse parses arrays so we use ListOrdersResponseItem implicitly via array parse.
// For single orders we pass through a permissive object using the orders shape; we can rely on
// the OpenAPI Order schema by parsing as a 1-element array and unwrapping.
function parseOrder(row: unknown) {
  return ListOrdersResponse.parse([row])[0];
}

const router: IRouter = Router();

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
  const totalPrice = product.price * parsed.data.quantity;

  // Link to customer account if token provided
  const customerToken = (req.header("x-customer-token") ?? "").trim();
  let customerId: number | null = null;
  if (customerToken) {
    const customer = await getCustomerSessionUser(customerToken);
    if (customer) customerId = customer.id;
  }

  const trackingNumber = generateTrackingNumber();

  const [row] = await db
    .insert(ordersTable)
    .values({
      trackingNumber,
      customerId,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      address: parsed.data.address,
      city: parsed.data.city,
      notes: parsed.data.notes ?? null,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: parsed.data.quantity,
      totalPrice,
      status: "pending",
    })
    .returning();
  res.status(201).json({ ...parseOrder(row), trackingNumber: row.trackingNumber });
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
    res.json(UpdateOrderStatusResponse.parse(row));
  },
);

router.patch(
  "/admin/orders/:id/details",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
    const { customerName, phone, address, city, notes, quantity } = req.body;
    const updates: Partial<typeof ordersTable.$inferInsert> = {};
    if (customerName !== undefined) updates.customerName = customerName;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (notes !== undefined) updates.notes = notes;
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

// Suppress unused import warning
void OrderResponse;

export default router;
