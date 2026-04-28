import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, courseEnrollmentsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

router.post("/enrollments", async (req, res): Promise<void> => {
  const { customerName, phone, courseId } = req.body ?? {};

  if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
    res.status(400).json({ error: "الاسم مطلوب" }); return;
  }
  if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
    res.status(400).json({ error: "رقم الهاتف مطلوب" }); return;
  }
  if (!courseId || typeof courseId !== "string" || courseId.trim().length < 1) {
    res.status(400).json({ error: "معرّف الدورة مطلوب" }); return;
  }

  const [row] = await db
    .insert(courseEnrollmentsTable)
    .values({
      customerName: customerName.trim(),
      phone: phone.trim(),
      courseId: courseId.trim(),
      status: "new",
    })
    .returning();

  res.status(201).json(row);
});

router.get("/admin/enrollments", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(courseEnrollmentsTable)
    .orderBy(desc(courseEnrollmentsTable.createdAt));
  res.json(rows);
});

router.patch("/admin/enrollments/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status } = req.body ?? {};
  if (!status || typeof status !== "string") { res.status(400).json({ error: "status required" }); return; }
  const { eq } = await import("drizzle-orm");
  const [row] = await db
    .update(courseEnrollmentsTable)
    .set({ status })
    .where(eq(courseEnrollmentsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
