import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireAdmin } from "../middlewares/admin-auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

// ─── POST /api/sensors/data  (IoT device sends a reading) ─────────────────────
router.post("/sensors/data", async (req, res): Promise<void> => {
  const { deviceId, token, moisture, temperature } = req.body ?? {};

  if (!deviceId || !token) {
    res.status(400).json({ error: "deviceId و token مطلوبان" }); return;
  }
  if (moisture === undefined || typeof moisture !== "number" || moisture < 0 || moisture > 100) {
    res.status(400).json({ error: "قيمة الرطوبة يجب أن تكون بين 0 و 100" }); return;
  }

  const device = await db.execute(
    sql`SELECT id FROM sensor_devices WHERE device_id = ${deviceId} AND token = ${token} LIMIT 1`
  );
  if (!device.rows.length) {
    res.status(401).json({ error: "بيانات الجهاز غير صحيحة" }); return;
  }

  const temp = typeof temperature === "number" ? temperature : null;
  await db.execute(
    sql`INSERT INTO sensor_readings (device_id, moisture, temperature) VALUES (${deviceId}, ${moisture}, ${temp})`
  );

  // Keep only the last 500 readings per device
  await db.execute(
    sql`DELETE FROM sensor_readings WHERE device_id = ${deviceId}
        AND id NOT IN (
          SELECT id FROM sensor_readings WHERE device_id = ${deviceId}
          ORDER BY created_at DESC LIMIT 500
        )`
  );

  res.json({ ok: true });
});

// ─── GET /api/sensors/:deviceId/latest ────────────────────────────────────────
router.get("/sensors/:deviceId/latest", async (req, res): Promise<void> => {
  const { deviceId } = req.params;

  const device = await db.execute(
    sql`SELECT id, name, location FROM sensor_devices WHERE device_id = ${deviceId} LIMIT 1`
  );
  if (!device.rows.length) {
    res.status(404).json({ error: "الجهاز غير موجود" }); return;
  }

  const reading = await db.execute(
    sql`SELECT moisture, temperature, created_at FROM sensor_readings
        WHERE device_id = ${deviceId} ORDER BY created_at DESC LIMIT 1`
  );

  const dev = device.rows[0] as { id: number; name: string; location: string | null };
  const r   = reading.rows[0] as { moisture: number; temperature: number | null; created_at: string } | undefined;

  res.json({
    deviceId,
    name: dev.name,
    location: dev.location ?? null,
    reading: r ? { moisture: r.moisture, temperature: r.temperature ?? null, createdAt: r.created_at } : null,
  });
});

// ─── GET /api/sensors/:deviceId/history ───────────────────────────────────────
router.get("/sensors/:deviceId/history", async (req, res): Promise<void> => {
  const { deviceId } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) || "24", 10), 100);

  const device = await db.execute(
    sql`SELECT id FROM sensor_devices WHERE device_id = ${deviceId} LIMIT 1`
  );
  if (!device.rows.length) { res.status(404).json({ error: "الجهاز غير موجود" }); return; }

  const rows = await db.execute(
    sql`SELECT moisture, temperature, created_at FROM sensor_readings
        WHERE device_id = ${deviceId} ORDER BY created_at DESC LIMIT ${limit}`
  );

  res.json((rows.rows as Array<{ moisture: number; temperature: number | null; created_at: string }>)
    .reverse()
    .map(r => ({ moisture: r.moisture, temperature: r.temperature ?? null, createdAt: r.created_at }))
  );
});

// ─── Admin: GET /api/admin/sensors ────────────────────────────────────────────
router.get("/admin/sensors", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.execute(
    sql`SELECT d.id, d.device_id, d.token, d.name, d.location, d.notes, d.created_at,
               r.moisture as last_moisture, r.temperature as last_temperature, r.created_at as last_reading
        FROM sensor_devices d
        LEFT JOIN LATERAL (
          SELECT moisture, temperature, created_at FROM sensor_readings
          WHERE device_id = d.device_id ORDER BY created_at DESC LIMIT 1
        ) r ON true
        ORDER BY d.created_at DESC`
  );

  res.json((rows.rows as Array<{
    id: number; device_id: string; token: string; name: string;
    location: string | null; notes: string | null; created_at: string;
    last_moisture: number | null; last_temperature: number | null; last_reading: string | null;
  }>).map(d => ({
    id: d.id,
    deviceId: d.device_id,
    token: d.token,
    name: d.name,
    location: d.location ?? null,
    notes: d.notes ?? null,
    createdAt: d.created_at,
    lastReading: d.last_moisture !== null ? {
      moisture: d.last_moisture,
      temperature: d.last_temperature ?? null,
      createdAt: d.last_reading!,
    } : null,
  })));
});

// ─── Admin: POST /api/admin/sensors ───────────────────────────────────────────
router.post("/admin/sensors", requireAdmin, async (req, res): Promise<void> => {
  const { name, location, notes } = req.body ?? {};
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "اسم الجهاز مطلوب" }); return;
  }

  const deviceId = `sensor_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const token    = randomUUID().replace(/-/g, "");

  const result = await db.execute(
    sql`INSERT INTO sensor_devices (device_id, token, name, location, notes)
        VALUES (${deviceId}, ${token}, ${name.trim()}, ${location?.trim() ?? null}, ${notes?.trim() ?? null})
        RETURNING id, device_id, token, name, location, notes, created_at`
  );
  const d = result.rows[0] as {
    id: number; device_id: string; token: string; name: string;
    location: string | null; notes: string | null; created_at: string;
  };

  res.status(201).json({
    id: d.id, deviceId: d.device_id, token: d.token, name: d.name,
    location: d.location, notes: d.notes, createdAt: d.created_at, lastReading: null,
  });
});

// ─── Admin: DELETE /api/admin/sensors/:id ─────────────────────────────────────
router.delete("/admin/sensors/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "معرّف غير صالح" }); return; }

  const [row] = await db.execute(
    sql`DELETE FROM sensor_devices WHERE id = ${id} RETURNING device_id`
  ).then(r => r.rows as Array<{ device_id: string }>);

  if (!row) { res.status(404).json({ error: "الجهاز غير موجود" }); return; }

  await db.execute(sql`DELETE FROM sensor_readings WHERE device_id = ${row.device_id}`);
  res.json({ ok: true });
});

export default router;
