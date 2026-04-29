import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, wasteCollections, donors } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

const POINTS_PER_KG = 10;
const DEFAULT_POINTS_PER_COLLECTION = 50; // if no weight given

function randomCode() {
  return "WC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calcBadge(totalKg: number): string {
  if (totalKg >= 100) return "tree";
  if (totalKg >= 30) return "plant";
  return "seedling";
}

// ─── POST /api/waste-collections — public submit ─────────────────────────────
router.post("/waste-collections", async (req, res): Promise<void> => {
  const { sourceType, contactName, contactPhone, address, wasteType, estimatedWeightKg, notes } =
    req.body ?? {};

  if (!contactName || !contactPhone || !address || !sourceType) {
    res.status(400).json({ error: "الاسم والهاتف والعنوان ونوع المصدر مطلوبة" });
    return;
  }

  const requestCode = randomCode();
  const [row] = await db
    .insert(wasteCollections)
    .values({
      requestCode,
      sourceType,
      contactName,
      contactPhone,
      address,
      wasteType: wasteType || "mixed",
      estimatedWeightKg: estimatedWeightKg ? String(estimatedWeightKg) : null,
      notes: notes || null,
      status: "pending",
    })
    .returning();
  res.status(201).json(row);
});

// ─── GET /api/waste-collections/:code — public status lookup ─────────────────
router.get("/waste-collections/:code", async (req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(wasteCollections)
    .where(eq(wasteCollections.requestCode, req.params.code));
  if (!row) { res.status(404).json({ error: "الطلب غير موجود" }); return; }
  res.json(row);
});

// ─── GET /api/admin/waste-collections ────────────────────────────────────────
router.get("/admin/waste-collections", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(wasteCollections)
    .orderBy(desc(wasteCollections.createdAt));
  res.json(rows);
});

// ─── PATCH /api/admin/waste-collections/:id/status ───────────────────────────
router.patch("/admin/waste-collections/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  // Fetch current state to detect status change → completed
  const [current] = await db.select().from(wasteCollections).where(eq(wasteCollections.id, id));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }

  const { status, scheduledDate, collectedDate, processingStartDate, completedDate, linkedBatchCode, notes } =
    req.body ?? {};

  const [row] = await db
    .update(wasteCollections)
    .set({
      status,
      scheduledDate: scheduledDate || null,
      collectedDate: collectedDate || null,
      processingStartDate: processingStartDate || null,
      completedDate: completedDate || null,
      linkedBatchCode: linkedBatchCode || null,
      notes: notes || null,
    })
    .where(eq(wasteCollections.id, id))
    .returning();

  // ── Award green points when marked completed ─────────────────────────────
  if (status === "completed" && current.status !== "completed") {
    const donorRows = await db
      .select()
      .from(donors)
      .where(eq(donors.phone, current.contactPhone));

    if (donorRows.length > 0) {
      const donor = donorRows[0];
      const kg = current.estimatedWeightKg ? parseFloat(current.estimatedWeightKg) : null;
      const pointsEarned = kg ? Math.round(kg * POINTS_PER_KG) : DEFAULT_POINTS_PER_COLLECTION;
      const newKg = parseFloat(donor.totalKgDonated ?? "0") + (kg ?? 0);
      const newPoints = donor.greenPoints + pointsEarned;
      const newBadge = calcBadge(newKg);

      await db.update(donors).set({
        greenPoints: newPoints,
        totalKgDonated: String(newKg),
        badge: newBadge,
      }).where(eq(donors.id, donor.id));
    }
  }

  res.json(row);
});

// ─── DELETE /api/admin/waste-collections/:id ─────────────────────────────────
router.delete("/admin/waste-collections/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(wasteCollections).where(eq(wasteCollections.id, id));
  res.json({ ok: true });
});

export default router;
