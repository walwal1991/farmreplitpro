import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, reviewsTable, productsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";
import { getCustomerSessionUser } from "../middlewares/customer-auth";
import type { Request } from "express";

const router: IRouter = Router();

// ─── GET /api/products/:id/reviews ────────────────────────────────────────────
router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, productId))
    .orderBy(desc(reviewsTable.createdAt));

  const stats = await db.execute(
    sql`SELECT COUNT(*)::int as count, ROUND(AVG(rating)::numeric, 1)::float as avg
        FROM product_reviews WHERE product_id = ${productId}`
  );
  const row = stats.rows[0] as { count: number; avg: number | null };

  res.json({
    reviews: reviews.map(r => ({
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
    stats: { count: row.count ?? 0, avg: row.avg ?? 0 },
  });
});

// ─── POST /api/products/:id/reviews ───────────────────────────────────────────
router.post("/products/:id/reviews", async (req: Request, res): Promise<void> => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const { rating, comment, customerName: guestName } = req.body ?? {};

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "التقييم يجب أن يكون بين 1 و 5" }); return;
  }

  const [product] = await db.select({ id: productsTable.id })
    .from(productsTable).where(eq(productsTable.id, productId)).limit(1);
  if (!product) { res.status(404).json({ error: "المنتج غير موجود" }); return; }

  // Try to get logged-in customer
  const customerToken = (req.header("x-customer-token") ?? "").trim();
  let customerId: number | null = null;
  let customerName = (guestName ?? "").toString().trim();

  if (customerToken) {
    const customer = await getCustomerSessionUser(customerToken);
    if (customer) {
      customerId = customer.id;
      customerName = customer.name;
    }
  }

  if (!customerName || customerName.length < 2) {
    res.status(400).json({ error: "الاسم مطلوب" }); return;
  }

  const [review] = await db.insert(reviewsTable).values({
    productId,
    customerId,
    customerName,
    rating: parseInt(rating, 10),
    comment: (comment ?? "").toString().trim(),
  }).returning();

  res.status(201).json({
    id: review.id,
    customerName: review.customerName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  });
});

// ─── GET /api/admin/reviews ────────────────────────────────────────────────────
router.get("/admin/reviews", requireAdmin, async (_req, res): Promise<void> => {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .orderBy(desc(reviewsTable.createdAt));

  res.json(reviews.map(r => ({
    id: r.id,
    productId: r.productId,
    customerId: r.customerId,
    customerName: r.customerName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  })));
});

// ─── DELETE /api/admin/reviews/:id ────────────────────────────────────────────
router.delete("/admin/reviews/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
  const [row] = await db.delete(reviewsTable).where(eq(reviewsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "التقييم غير موجود" }); return; }
  res.json({ ok: true });
});

export default router;
