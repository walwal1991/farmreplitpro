import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const deliverySessionsTable = pgTable("delivery_sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type DeliverySession = typeof deliverySessionsTable.$inferSelect;
