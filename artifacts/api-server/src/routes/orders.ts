import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, productsTable, ordersTable } from "@workspace/db";
import {
  CreateOrderBody,
  ListOrdersResponse,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
  GetProductResponse as OrderResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/admin-auth";

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

  const [row] = await db
    .insert(ordersTable)
    .values({
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
  res.status(201).json(parseOrder(row));
});

router.get(
  "/admin/orders",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
    res.json(ListOrdersResponse.parse(rows));
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

// Suppress unused import warning
void OrderResponse;

export default router;
