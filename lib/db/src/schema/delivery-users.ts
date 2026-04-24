import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const deliveryUsersTable = pgTable("delivery_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull().default("driver"), // 'driver' | 'company'
  active: boolean("active").notNull().default(true),
  available: boolean("available").notNull().default(true),
  blockedReason: text("blocked_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DeliveryUser = typeof deliveryUsersTable.$inferSelect;
