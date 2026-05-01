import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireCustomer } from "../middlewares/customer-auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

// ── helpers ────────────────────────────────────────────────────────────────────
function generateCode(prefix: string): string {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

async function issueDiscount(opts: {
  customerId: number | null;
  donorId?: number | null;
  source: "review_reward" | "referral_referrer" | "referral_joinee" | "donor_points";
  percent: number;
  daysValid?: number;
}): Promise<string> {
  const code = generateCode(
    opts.source === "review_reward" ? "REV"
    : opts.source === "referral_referrer" ? "FRIEND"
    : opts.source === "referral_joinee" ? "WELCOME"
    : "DONOR"
  );
  const expires = opts.daysValid
    ? new Date(Date.now() + opts.daysValid * 86_400_000).toISOString()
    : null;

  await db.execute(sql`
    INSERT INTO discount_codes (donor_id, customer_id, code, discount_percent, points_used, source, expires_at)
    VALUES (${opts.donorId ?? null}, ${opts.customerId}, ${code}, ${opts.percent}, 0, ${opts.source}, ${expires})
  `);
  return code;
}

export { issueDiscount, generateCode };

// ─── GET /api/discount/validate?code=XXX ──────────────────────────────────────
router.get("/discount/validate", async (req, res): Promise<void> => {
  const code = ((req.query.code as string) ?? "").trim().toUpperCase();
  if (!code) { res.status(400).json({ error: "الكود مطلوب" }); return; }

  const result = await db.execute(sql`
    SELECT id, code, discount_percent, source, used, expires_at
    FROM discount_codes WHERE UPPER(code) = ${code} LIMIT 1
  `);
  const row = result.rows[0] as {
    id: number; code: string; discount_percent: number;
    source: string; used: boolean; expires_at: string | null;
  } | undefined;

  if (!row) { res.status(404).json({ error: "الكود غير صالح" }); return; }
  if (row.used) { res.status(410).json({ error: "هذا الكود مستخدَم بالفعل" }); return; }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    res.status(410).json({ error: "انتهت صلاحية هذا الكود" }); return;
  }

  res.json({ id: row.id, code: row.code, discountPercent: row.discount_percent, source: row.source });
});

// ─── GET /api/customer/referral  (customer auth required) ─────────────────────
router.get("/customer/referral", requireCustomer, async (req, res): Promise<void> => {
  const customer = (req as typeof req & { customerUser: { id: number } }).customerUser;

  // Ensure referral code exists
  await db.execute(sql`
    UPDATE customers
    SET referral_code = 'REF' || UPPER(SUBSTRING(MD5(id::text || email), 1, 8))
    WHERE id = ${customer.id} AND referral_code IS NULL
  `);

  const [row] = await db.execute(sql`
    SELECT referral_code FROM customers WHERE id = ${customer.id}
  `).then(r => r.rows as Array<{ referral_code: string }>);

  const referrals = await db.execute(sql`
    SELECT COUNT(*)::int AS total FROM customers WHERE referred_by_id = ${customer.id}
  `);
  const total = (referrals.rows[0] as { total: number }).total;

  const coupons = await db.execute(sql`
    SELECT code, discount_percent, source, used, expires_at, created_at
    FROM discount_codes
    WHERE customer_id = ${customer.id}
    ORDER BY created_at DESC
    LIMIT 50
  `);

  res.json({
    referralCode: row.referral_code,
    totalReferrals: total,
    coupons: (coupons.rows as Array<{
      code: string; discount_percent: number; source: string;
      used: boolean; expires_at: string | null; created_at: string;
    }>).map(c => ({
      code: c.code,
      discountPercent: c.discount_percent,
      source: c.source,
      used: c.used,
      expiresAt: c.expires_at,
      createdAt: c.created_at,
    })),
  });
});

export default router;
