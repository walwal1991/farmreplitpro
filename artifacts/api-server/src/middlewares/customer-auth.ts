import type { Request, Response, NextFunction } from "express";
import { eq, lt, sql } from "drizzle-orm";
import { db, customerSessionsTable, customersTable } from "@workspace/db";

const SESSION_DAYS = 30;

function sessionExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d;
}

export async function createCustomerSession(customerId: number, token: string): Promise<void> {
  await db.insert(customerSessionsTable).values({ token, customerId, expiresAt: sessionExpiry() });
}

export async function getCustomerSessionUser(
  token: string | undefined,
): Promise<{ id: number; name: string; email: string; phone: string } | null> {
  if (!token) return null;
  const rows = await db.execute(
    sql`SELECT cs.expires_at, c.id, c.name, c.email, c.phone, c.is_blocked
        FROM customer_sessions cs
        JOIN customers c ON cs.customer_id = c.id
        WHERE cs.token = ${token}
        LIMIT 1`
  );
  const row = rows.rows[0] as { expires_at: Date; id: number; name: string; email: string; phone: string; is_blocked: boolean } | undefined;
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await db.execute(sql`DELETE FROM customer_sessions WHERE token = ${token}`);
    return null;
  }
  if (row.is_blocked) return null;
  return { id: row.id, name: row.name, email: row.email, phone: row.phone };
}

function extractToken(req: Request): string {
  const header = (req.header("x-customer-token") ?? "").toString().trim();
  if (header) return header;
  const auth = req.header("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

export async function requireCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
    const customer = await getCustomerSessionUser(token);
    if (!customer) { res.status(401).json({ error: "Unauthorized" }); return; }
    (req as Request & { customerUser: typeof customer }).customerUser = customer;
    next();
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

export async function cleanExpiredCustomerSessions(): Promise<void> {
  await db.delete(customerSessionsTable).where(lt(customerSessionsTable.expiresAt, new Date()));
}
