import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { db, donors, donorSessions, discountCodes, wasteCollections } from "@workspace/db";

const router: IRouter = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password + "vermifert-donor-salt").digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function randomDiscountCode() {
  return "VERDE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calcBadge(totalKg: number): string {
  if (totalKg >= 100) return "tree";
  if (totalKg >= 30) return "plant";
  return "seedling";
}

// Points per kg donated
const POINTS_PER_KG = 10;
// Thresholds for discount redemption
const REDEMPTION_TIERS = [
  { points: 200, discount: 20 },
  { points: 100, discount: 10 },
  { points: 50, discount: 5 },
];

async function getDonorFromToken(token: string) {
  const [session] = await db
    .select()
    .from(donorSessions)
    .where(eq(donorSessions.token, token));
  if (!session) return null;
  const [donor] = await db.select().from(donors).where(eq(donors.id, session.donorId));
  return donor ?? null;
}

function requireDonor(req: any, res: any, next: any) {
  const token = req.headers["x-donor-token"] as string;
  if (!token) { res.status(401).json({ error: "غير مصرح" }); return; }
  getDonorFromToken(token).then((donor) => {
    if (!donor) { res.status(401).json({ error: "الجلسة منتهية، يرجى تسجيل الدخول" }); return; }
    req.donor = donor;
    next();
  });
}

// ── Register ─────────────────────────────────────────────────────────────────
router.post("/donors/register", async (req, res): Promise<void> => {
  const { name, username, phone, password } = req.body ?? {};
  if (!name || !username || !phone || !password) {
    res.status(400).json({ error: "الاسم واسم المستخدم والهاتف وكلمة المرور مطلوبة" }); return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }); return;
  }
  if (!/^[a-zA-Z0-9_]{3,60}$/.test(username)) {
    res.status(400).json({ error: "اسم المستخدم يجب أن يكون من 3-60 حرف (أحرف إنجليزية وأرقام و_)" }); return;
  }

  const existingUsername = await db.select().from(donors).where(eq(donors.username, username));
  if (existingUsername.length) { res.status(409).json({ error: "اسم المستخدم مأخوذ، جرّب اسماً آخر" }); return; }

  const existingPhone = await db.select().from(donors).where(eq(donors.phone, phone));
  if (existingPhone.length) { res.status(409).json({ error: "رقم الهاتف مسجّل مسبقاً" }); return; }

  const [donor] = await db.insert(donors).values({
    name, username, phone,
    passwordHash: hashPassword(password),
  }).returning();

  const token = randomToken();
  await db.insert(donorSessions).values({ donorId: donor.id, token });
  res.status(201).json({ token, donor: { ...donor, passwordHash: undefined } });
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/donors/login", async (req, res): Promise<void> => {
  const { username, password } = req.body ?? {};
  if (!username || !password) { res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" }); return; }

  const [donor] = await db.select().from(donors).where(eq(donors.username, username));
  if (!donor || donor.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" }); return;
  }
  const token = randomToken();
  await db.insert(donorSessions).values({ donorId: donor.id, token });
  res.json({ token, donor: { ...donor, passwordHash: undefined } });
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get("/donors/me", requireDonor, async (req: any, res): Promise<void> => {
  const donor = req.donor;

  // Get their waste collections
  const collections = await db
    .select()
    .from(wasteCollections)
    .where(eq(wasteCollections.contactPhone, donor.phone))
    .orderBy(desc(wasteCollections.createdAt));

  // Get their discount codes
  const codes = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.donorId, donor.id))
    .orderBy(desc(discountCodes.createdAt));

  res.json({
    donor: { ...donor, passwordHash: undefined },
    collections,
    discountCodes: codes,
    nextTier: REDEMPTION_TIERS.find(t => donor.greenPoints < t.points) ?? null,
    tiers: REDEMPTION_TIERS,
  });
});

// ── Redeem points for discount code ──────────────────────────────────────────
router.post("/donors/redeem", requireDonor, async (req: any, res): Promise<void> => {
  const donor = req.donor;
  const { points } = req.body ?? {};

  const tier = REDEMPTION_TIERS.find(t => t.points === points);
  if (!tier) { res.status(400).json({ error: "تير غير صالح" }); return; }
  if (donor.greenPoints < tier.points) {
    res.status(400).json({ error: `تحتاج ${tier.points} نقطة للحصول على هذا الكوبون` }); return;
  }

  const code = randomDiscountCode();
  const [dc] = await db.insert(discountCodes).values({
    donorId: donor.id,
    code,
    discountPercent: tier.discount,
    pointsUsed: tier.points,
  }).returning();

  await db.update(donors)
    .set({ greenPoints: donor.greenPoints - tier.points })
    .where(eq(donors.id, donor.id));

  res.json(dc);
});

// ── Admin helpers ─────────────────────────────────────────────────────────────
async function requireAdmin(req: any, res: any): Promise<boolean> {
  const token = req.headers["x-admin-token"] as string;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

router.get("/admin/donors", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const rows = await db.select().from(donors).orderBy(desc(donors.createdAt));
  res.json(rows.map(d => ({ ...d, passwordHash: undefined })));
});

router.post("/admin/donors/:id/reset-points", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.update(donors).set({ greenPoints: 0 }).where(eq(donors.id, id));
  res.json({ ok: true });
});

router.delete("/admin/donors/:id", async (req, res): Promise<void> => {
  if (!await requireAdmin(req, res)) return;
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(donorSessions).where(eq(donorSessions.donorId, id));
  await db.delete(donors).where(eq(donors.id, id));
  res.json({ ok: true });
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post("/donors/logout", requireDonor, async (req: any, res): Promise<void> => {
  const token = req.headers["x-donor-token"] as string;
  await db.delete(donorSessions).where(eq(donorSessions.token, token));
  res.json({ ok: true });
});

// ── Export helpers for use in waste-collections route ────────────────────────
export { getDonorFromToken, hashPassword, POINTS_PER_KG, calcBadge };

export default router;
