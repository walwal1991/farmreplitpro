import type { Request, Response, NextFunction } from "express";
import { eq, lt } from "drizzle-orm";
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
  const rows = await db
    .select({ session: customerSessionsTable, customer: customersTable })
    .from(customerSessionsTable)
    .innerJoin(customersTable, eq(customerSessionsTable.customerId, customersTable.id))
    .where(eq(customerSessionsTable.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.session.expiresAt < new Date()) {
    await db.delete(customerSessionsTable).where(eq(customerSessionsTable.token, token));
    return null;
  }
  return { id: row.customer.id, name: row.customer.name, email: row.customer.email, phone: row.customer.phone };
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
