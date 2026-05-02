import { pgTable, serial, text, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";

export const subscriptionPlansTable = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  nameFr: text("name_fr").notNull(),
  description: text("description").notNull(),
  descriptionAr: text("description_ar").notNull(),
  descriptionFr: text("description_fr").notNull(),
  pricePerMonth: doublePrecision("price_per_month").notNull(),
  fertilizerKg: doublePrecision("fertilizer_kg").notNull(),
  includesTips: boolean("includes_tips").notNull().default(true),
  includesPlan: boolean("includes_plan").notNull().default(false),
  includesConsultation: boolean("includes_consultation").notNull().default(false),
  color: text("color").notNull().default("green"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
