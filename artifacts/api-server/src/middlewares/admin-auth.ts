import type { Request, Response, NextFunction } from "express";

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const password = process.env["ADMIN_PASSWORD"];
  if (!password) {
    req.log.error("ADMIN_PASSWORD env var not configured");
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  const headerToken =
    (req.header("x-admin-token") ?? "").toString().trim() ||
    (() => {
      const auth = req.header("authorization") ?? "";
      const m = auth.match(/^Bearer\s+(.+)$/i);
      return m ? m[1].trim() : "";
    })();

  if (!headerToken || headerToken !== password) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
