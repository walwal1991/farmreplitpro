import { db, adminsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export async function seedDefaultAdmin(): Promise<void> {
  try {
    const existing = await db.select().from(adminsTable).limit(1);
    if (existing.length > 0) return;

    const username = process.env["ADMIN_USERNAME"] ?? "admin";
    const password = process.env["ADMIN_PASSWORD"] ?? "admin123";
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(adminsTable).values({ username, passwordHash });
    logger.info({ username }, "Default admin account seeded");
  } catch (err) {
    logger.error({ err }, "Failed to seed default admin");
  }
}
