import { pgTable, serial, integer, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  planId: integer("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  priceAtSubscription: doublePrecision("price_at_subscription").notNull(),
  fertilizerKg: doublePrecision("fertilizer_kg").notNull(),
  cropType: text("crop_type"),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCity: text("delivery_city").notNull(),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  nextRenewalDate: timestamp("next_renewal_date", { withTimezone: true }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Subscription = typeof subscriptionsTable.$inferSelect;
