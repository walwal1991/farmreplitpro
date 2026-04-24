import type { Request, Response, NextFunction } from "express";
import { eq, lt } from "drizzle-orm";
import { db, adminSessionsTable } from "@workspace/db";

const SESSION_DAYS = 30;

function sessionExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d;
}

export async function createSession(
  username: string,
  token: string,
): Promise<void> {
  await db.insert(adminSessionsTable).values({
    token,
    username,
    expiresAt: sessionExpiry(),
  });
}

export async function getSessionUser(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  const rows = await db
    .select()
    .from(adminSessionsTable)
    .where(eq(adminSessionsTable.token, token))
    .limit(1);
  const session = rows[0];
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db
      .delete(adminSessionsTable)
      .where(eq(adminSessionsTable.token, token));
    return null;
  }
  return session.username;
}

export async function destroySession(token: string): Promise<void> {
  await db
    .delete(adminSessionsTable)
    .where(eq(adminSessionsTable.token, token));
}

export async function destroyUserSessions(username: string): Promise<void> {
  await db
    .delete(adminSessionsTable)
    .where(eq(adminSessionsTable.username, username));
}

export async function cleanExpiredSessions(): Promise<void> {
  await db
    .delete(adminSessionsTable)
    .where(lt(adminSessionsTable.expiresAt, new Date()));
}

function extractToken(req: Request): string {
  const header = (req.header("x-admin-token") ?? "").toString().trim();
  if (header) return header;
  const auth = req.header("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

export function getRequestToken(req: Request): string {
  return extractToken(req);
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const username = await getSessionUser(token);
    if (!username) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}
