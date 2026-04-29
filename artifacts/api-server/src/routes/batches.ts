import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, fertilizerBatchesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

function randomCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ─── GET /api/batches/:code — public scan page ────────────────────────────────
router.get("/batches/:code", async (req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(fertilizerBatchesTable)
    .where(eq(fertilizerBatchesTable.batchCode, req.params.code));
  if (!row) { res.status(404).json({ error: "الدفعة غير موجودة" }); return; }
  res.json(row);
});

// ─── GET /api/admin/batches — list all ───────────────────────────────────────
router.get("/admin/batches", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(fertilizerBatchesTable)
    .orderBy(desc(fertilizerBatchesTable.createdAt));
  res.json(rows);
});

// ─── POST /api/admin/batches — create ────────────────────────────────────────
router.post("/admin/batches", requireAdmin, async (req, res): Promise<void> => {
  const { sourceType, sourceDescription, nitrogen, phosphorus, potassium, organicMatter, productionDate, notes } =
    req.body ?? {};

  if (!sourceType || !productionDate) {
    res.status(400).json({ error: "مصدر السماد وتاريخ الإنتاج مطلوبان" }); return;
  }

  const batchCode = randomCode();
  const [row] = await db
    .insert(fertilizerBatchesTable)
    .values({
      batchCode,
      sourceType,
      sourceDescription: sourceDescription || null,
      nitrogen: String(nitrogen ?? 0),
      phosphorus: String(phosphorus ?? 0),
      potassium: String(potassium ?? 0),
      organicMatter: String(organicMatter ?? 0),
      productionDate,
      notes: notes || null,
    })
    .returning();
  res.status(201).json(row);
});

// ─── PATCH /api/admin/batches/:id — update ───────────────────────────────────
router.patch("/admin/batches/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { sourceType, sourceDescription, nitrogen, phosphorus, potassium, organicMatter, productionDate, notes } =
    req.body ?? {};
  const [row] = await db
    .update(fertilizerBatchesTable)
    .set({
      sourceType,
      sourceDescription,
      nitrogen: String(nitrogen),
      phosphorus: String(phosphorus),
      potassium: String(potassium),
      organicMatter: String(organicMatter),
      productionDate,
      notes,
    })
    .where(eq(fertilizerBatchesTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// ─── DELETE /api/admin/batches/:id ───────────────────────────────────────────
router.delete("/admin/batches/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(fertilizerBatchesTable).where(eq(fertilizerBatchesTable.id, id));
  res.json({ ok: true });
});

export default router;
