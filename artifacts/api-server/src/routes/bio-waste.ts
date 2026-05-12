import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

function randomCode() {
  return "BW-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── GET /api/bio-waste/prices ─────────────────────────────────────────────
router.get("/bio-waste/prices", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`SELECT * FROM bio_waste_prices ORDER BY price_per_kg DESC`);
  res.json(rows.rows);
});

// ─── POST /api/bio-waste/requests — public submit ─────────────────────────
router.post("/bio-waste/requests", async (req, res): Promise<void> => {
  const { sellerName, sellerPhone, wilaya, address, wasteType, estimatedWeightKg, paymentMethod, notes, customerId } =
    req.body ?? {};

  if (!sellerName || !sellerPhone || !wilaya || !address || !wasteType || !estimatedWeightKg) {
    res.status(400).json({ error: "جميع الحقول الأساسية مطلوبة" });
    return;
  }

  const priceRows = await db.execute(
    sql`SELECT price_per_kg FROM bio_waste_prices WHERE waste_type = ${wasteType}`
  );
  if (priceRows.rows.length === 0) {
    res.status(400).json({ error: "نوع المخلفات غير صالح" });
    return;
  }
  const pricePerKg = priceRows.rows[0].price_per_kg;
  const requestCode = randomCode();

  const result = await db.execute(sql`
    INSERT INTO bio_waste_purchases
      (request_code, customer_id, seller_name, seller_phone, wilaya, address, waste_type,
       estimated_weight_kg, price_per_kg, payment_method, notes)
    VALUES
      (${requestCode}, ${customerId ?? null}, ${sellerName}, ${sellerPhone}, ${wilaya},
       ${address}, ${wasteType}, ${estimatedWeightKg}, ${pricePerKg},
       ${paymentMethod ?? "cash"}, ${notes ?? null})
    RETURNING *
  `);
  res.status(201).json(result.rows[0]);
});

// ─── GET /api/bio-waste/requests/:code — public status lookup ─────────────
router.get("/bio-waste/requests/:code", async (req, res): Promise<void> => {
  const result = await db.execute(
    sql`SELECT * FROM bio_waste_purchases WHERE request_code = ${req.params.code}`
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }
  res.json(result.rows[0]);
});

// ─── GET /api/customer/bio-waste — customer's own requests ─────────────────
router.get("/customer/bio-waste", async (req, res): Promise<void> => {
  const token = req.headers["x-customer-token"] as string;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const sessionRows = await db.execute(
    sql`SELECT customer_id FROM customer_sessions WHERE token = ${token} AND expires_at > NOW()`
  );
  if (sessionRows.rows.length === 0) { res.status(401).json({ error: "Unauthorized" }); return; }
  const customerId = sessionRows.rows[0].customer_id;
  const result = await db.execute(
    sql`SELECT * FROM bio_waste_purchases WHERE customer_id = ${customerId} ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

// ─── GET /api/admin/bio-waste/pending-count ───────────────────────────────
router.get("/admin/bio-waste/pending-count", requireAdmin, async (_req, res): Promise<void> => {
  const result = await db.execute(
    sql`SELECT COUNT(*)::int AS count FROM bio_waste_purchases WHERE status = 'pending'`
  );
  const count = (result.rows[0] as { count: number }).count ?? 0;
  res.json({ count });
});

// ─── GET /api/admin/bio-waste ──────────────────────────────────────────────
router.get("/admin/bio-waste", requireAdmin, async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  let query = sql`SELECT * FROM bio_waste_purchases`;
  if (status && status !== "all") {
    query = sql`SELECT * FROM bio_waste_purchases WHERE status = ${status}`;
  }
  query = sql`${query} ORDER BY created_at DESC`;
  const result = await db.execute(query);
  res.json(result.rows);
});

// ─── PATCH /api/admin/bio-waste/:id ───────────────────────────────────────
router.patch("/admin/bio-waste/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status, pickupDate, collectedDate, actualWeightKg, paymentStatus, adminNotes } = req.body ?? {};

  let actualPayout = null;
  if (actualWeightKg) {
    const priceRow = await db.execute(
      sql`SELECT price_per_kg FROM bio_waste_purchases WHERE id = ${id}`
    );
    if (priceRow.rows.length > 0) {
      actualPayout = parseFloat(String(priceRow.rows[0].price_per_kg)) * parseFloat(String(actualWeightKg));
    }
  }

  const result = await db.execute(sql`
    UPDATE bio_waste_purchases SET
      status = COALESCE(${status ?? null}, status),
      pickup_date = COALESCE(${pickupDate ?? null}::date, pickup_date),
      collected_date = COALESCE(${collectedDate ?? null}::date, collected_date),
      actual_weight_kg = COALESCE(${actualWeightKg ? String(actualWeightKg) : null}::numeric, actual_weight_kg),
      actual_payout = COALESCE(${actualPayout ? String(actualPayout) : null}::numeric, actual_payout),
      payment_status = COALESCE(${paymentStatus ?? null}, payment_status),
      admin_notes = COALESCE(${adminNotes ?? null}, admin_notes)
    WHERE id = ${id}
    RETURNING *
  `);
  if (result.rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result.rows[0]);
});

// ─── PATCH /api/admin/bio-waste/prices/:type ──────────────────────────────
router.patch("/admin/bio-waste/prices/:type", requireAdmin, async (req, res): Promise<void> => {
  const { pricePerKg } = req.body ?? {};
  if (!pricePerKg) { res.status(400).json({ error: "السعر مطلوب" }); return; }
  await db.execute(sql`
    UPDATE bio_waste_prices SET price_per_kg = ${String(pricePerKg)}, updated_at = NOW()
    WHERE waste_type = ${req.params.type}
  `);
  res.json({ ok: true });
});

// ─── DELETE /api/admin/bio-waste/:id ──────────────────────────────────────
router.delete("/admin/bio-waste/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.execute(sql`DELETE FROM bio_waste_purchases WHERE id = ${id}`);
  res.json({ ok: true });
});

export default router;
