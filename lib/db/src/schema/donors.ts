import { pgTable, serial, varchar, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const donors = pgTable("donors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  greenPoints: integer("green_points").notNull().default(0),
  totalKgDonated: numeric("total_kg_donated", { precision: 10, scale: 2 }).notNull().default("0"),
  badge: varchar("badge", { length: 20 }).notNull().default("seedling"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const donorSessions = pgTable("donor_sessions", {
  id: serial("id").primaryKey(),
  donorId: integer("donor_id").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  donorId: integer("donor_id").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  discountPercent: integer("discount_percent").notNull().default(10),
  pointsUsed: integer("points_used").notNull().default(100),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
