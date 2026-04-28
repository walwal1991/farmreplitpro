import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, courseEnrollmentsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";
import { requireCustomer } from "../middlewares/customer-auth";
import type { Request } from "express";

const router: IRouter = Router();

// ─── POST /api/enrollments — public ──────────────────────────────────────────
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

// ─── GET /api/customer/enrollments — customer sees their own ─────────────────
router.get("/customer/enrollments", requireCustomer, async (req, res): Promise<void> => {
  const customer = (req as Request & { customerUser: { id: number; phone: string } }).customerUser;
  const rows = await db
    .select()
    .from(courseEnrollmentsTable)
    .where(eq(courseEnrollmentsTable.phone, customer.phone ?? ""))
    .orderBy(desc(courseEnrollmentsTable.createdAt));
  res.json(rows);
});

// ─── GET /api/admin/enrollments — admin list ─────────────────────────────────
router.get("/admin/enrollments", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(courseEnrollmentsTable)
    .orderBy(desc(courseEnrollmentsTable.createdAt));
  res.json(rows);
});

// ─── PATCH /api/admin/enrollments/:id/status — toggle status ─────────────────
router.patch("/admin/enrollments/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status } = req.body ?? {};
  if (!status || typeof status !== "string") { res.status(400).json({ error: "status required" }); return; }
  const [row] = await db
    .update(courseEnrollmentsTable)
    .set({ status })
    .where(eq(courseEnrollmentsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// ─── PATCH /api/admin/enrollments/:id/mark-sent — stamp message_sent_at ──────
router.patch("/admin/enrollments/:id/mark-sent", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db
    .update(courseEnrollmentsTable)
    .set({ messageSentAt: new Date() })
    .where(eq(courseEnrollmentsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

// ─── PATCH /api/admin/enrollments/:id/link — save training link ──────────────
router.patch("/admin/enrollments/:id/link", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { trainingLink } = req.body ?? {};
  const [row] = await db
    .update(courseEnrollmentsTable)
    .set({ trainingLink: trainingLink ? String(trainingLink).trim() : null })
    .where(eq(courseEnrollmentsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
