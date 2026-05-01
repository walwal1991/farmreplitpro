import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, reviewsTable, productsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";
import { getCustomerSessionUser } from "../middlewares/customer-auth";
import { issueDiscount } from "./rewards";
import type { Request } from "express";

const router: IRouter = Router();

// ─── GET /api/products/:id/reviews ────────────────────────────────────────────
router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const rows = await db.execute(
    sql`SELECT id, customer_name, rating, comment, image_url, created_at
        FROM product_reviews WHERE product_id = ${productId}
        ORDER BY created_at DESC`
  );

  const statsRow = await db.execute(
    sql`SELECT COUNT(*)::int as count, ROUND(AVG(rating)::numeric, 1)::float as avg
        FROM product_reviews WHERE product_id = ${productId}`
  );
  const stat = statsRow.rows[0] as { count: number; avg: number | null };

  res.json({
    reviews: (rows.rows as Array<{
      id: number; customer_name: string; rating: number;
      comment: string | null; image_url: string | null; created_at: string;
    }>).map(r => ({
      id: r.id,
      customerName: r.customer_name,
      rating: r.rating,
      comment: r.comment ?? "",
      imageUrl: r.image_url ?? null,
      createdAt: r.created_at,
    })),
    stats: { count: stat.count ?? 0, avg: stat.avg ?? 0 },
  });
});

// ─── POST /api/products/:id/reviews ───────────────────────────────────────────
router.post("/products/:id/reviews", async (req: Request, res): Promise<void> => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const { rating, comment, customerName: guestName, imageUrl } = req.body ?? {};

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "التقييم يجب أن يكون بين 1 و 5" }); return;
  }

  // Validate image size (base64 ~4/3 of actual size, limit 2MB → ~2.7MB base64)
  if (imageUrl && typeof imageUrl === "string" && imageUrl.length > 3_000_000) {
    res.status(400).json({ error: "حجم الصورة كبير جداً (الحد الأقصى 2 ميغابايت)" }); return;
  }

  const [product] = await db.select({ id: productsTable.id })
    .from(productsTable).where(eq(productsTable.id, productId)).limit(1);
  if (!product) { res.status(404).json({ error: "المنتج غير موجود" }); return; }

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

  const cleanImageUrl = imageUrl && typeof imageUrl === "string" ? imageUrl : null;

  const result = await db.execute(
    sql`INSERT INTO product_reviews (product_id, customer_id, customer_name, rating, comment, image_url)
        VALUES (${productId}, ${customerId}, ${customerName}, ${parseInt(rating, 10)},
                ${(comment ?? "").toString().trim()}, ${cleanImageUrl})
        RETURNING id, customer_name, rating, comment, image_url, created_at`
  );
  const review = result.rows[0] as {
    id: number; customer_name: string; rating: number;
    comment: string; image_url: string | null; created_at: string;
  };

  // Auto-issue a review reward coupon for logged-in customers with great reviews
  let rewardCode: string | null = null;
  if (customerId && parseInt(rating, 10) >= 4 && (comment ?? "").toString().trim().length >= 10) {
    // One reward coupon per product per customer — compare qualifying review count vs issued coupons
    const [qualifyingReviews, issuedCoupons] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(DISTINCT product_id) AS cnt FROM product_reviews
        WHERE customer_id = ${customerId}
          AND rating >= 4
          AND LENGTH(TRIM(COALESCE(comment, ''))) >= 10
      `),
      db.execute(sql`
        SELECT COUNT(*) AS cnt FROM discount_codes
        WHERE customer_id = ${customerId} AND source = 'review_reward'
      `),
    ]);
    const reviews = parseInt((qualifyingReviews.rows[0] as { cnt: string }).cnt, 10);
    const coupons = parseInt((issuedCoupons.rows[0] as { cnt: string }).cnt, 10);
    if (reviews > coupons) {
      rewardCode = await issueDiscount({ customerId, source: "review_reward", percent: 10, daysValid: 30 });
    }
  }

  res.status(201).json({
    id: review.id,
    customerName: review.customer_name,
    rating: review.rating,
    comment: review.comment,
    imageUrl: review.image_url ?? null,
    createdAt: review.created_at,
    rewardCode,
  });
});

// ─── GET /api/admin/reviews ────────────────────────────────────────────────────
router.get("/admin/reviews", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.execute(
    sql`SELECT id, product_id, customer_id, customer_name, rating, comment, image_url, created_at
        FROM product_reviews ORDER BY created_at DESC`
  );
  res.json((rows.rows as Array<{
    id: number; product_id: number; customer_id: number | null;
    customer_name: string; rating: number; comment: string | null;
    image_url: string | null; created_at: string;
  }>).map(r => ({
    id: r.id,
    productId: r.product_id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    rating: r.rating,
    comment: r.comment ?? "",
    imageUrl: r.image_url ?? null,
    createdAt: r.created_at,
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
