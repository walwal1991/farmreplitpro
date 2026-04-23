import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, consultationsTable } from "@workspace/db";
import {
  CreateConsultationBody,
  ListConsultationsResponse,
  UpdateConsultationStatusParams,
  UpdateConsultationStatusBody,
  UpdateConsultationStatusResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/admin-auth";

function parseOne(row: unknown) {
  return ListConsultationsResponse.parse([row])[0];
}

const router: IRouter = Router();

router.post("/consultations", async (req, res): Promise<void> => {
  const parsed = CreateConsultationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(consultationsTable)
    .values({
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      soilType: parsed.data.soilType,
      crop: parsed.data.crop,
      problem: parsed.data.problem,
      status: "new",
    })
    .returning();
  res.status(201).json(parseOne(row));
});

router.get(
  "/admin/consultations",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(consultationsTable)
      .orderBy(desc(consultationsTable.createdAt));
    res.json(ListConsultationsResponse.parse(rows));
  },
);

router.patch(
  "/admin/consultations/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateConsultationStatusParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateConsultationStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .update(consultationsTable)
      .set({ status: parsed.data.status })
      .where(eq(consultationsTable.id, params.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Consultation not found" });
      return;
    }
    res.json(UpdateConsultationStatusResponse.parse(row));
  },
);

export default router;
