import type { Request, Response, NextFunction } from "express";
import { eq, lt } from "drizzle-orm";
import { db, deliverySessionsTable, deliveryUsersTable } from "@workspace/db";

const SESSION_DAYS = 30;

function sessionExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d;
}

export async function createDeliverySession(userId: number, token: string): Promise<void> {
  await db.insert(deliverySessionsTable).values({ token, userId, expiresAt: sessionExpiry() });
}

export async function getDeliverySessionUser(
  token: string | undefined,
): Promise<{ id: number; username: string; name: string; role: string } | null> {
  if (!token) return null;
  const rows = await db
    .select({ session: deliverySessionsTable, user: deliveryUsersTable })
    .from(deliverySessionsTable)
    .innerJoin(deliveryUsersTable, eq(deliverySessionsTable.userId, deliveryUsersTable.id))
    .where(eq(deliverySessionsTable.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.session.expiresAt < new Date()) {
    await db.delete(deliverySessionsTable).where(eq(deliverySessionsTable.token, token));
    return null;
  }
  if (!row.user.active) return null;
  return { id: row.user.id, username: row.user.username, name: row.user.name, role: row.user.role };
}

function extractToken(req: Request): string {
  const header = (req.header("x-delivery-token") ?? "").toString().trim();
  if (header) return header;
  const auth = req.header("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

export async function requireDelivery(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
    const user = await getDeliverySessionUser(token);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    (req as Request & { deliveryUser: typeof user }).deliveryUser = user;
    next();
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

export async function cleanExpiredDeliverySessions(): Promise<void> {
  await db.delete(deliverySessionsTable).where(lt(deliverySessionsTable.expiresAt, new Date()));
}
