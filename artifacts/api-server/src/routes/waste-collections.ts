import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, wasteCollections } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

function randomCode() {
  return "WC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
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
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
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
