import type { Request, Response, NextFunction } from "express";

const sessions = new Map<string, string>();

export function createSession(username: string, token: string): void {
  sessions.set(token, username);
}

export function getSessionUser(token: string | undefined): string | null {
  if (!token) return null;
  return sessions.get(token) ?? null;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function destroyUserSessions(username: string): void {
  for (const [t, u] of sessions.entries()) {
    if (u === username) sessions.delete(t);
  }
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

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req);
  if (!token || !sessions.has(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
