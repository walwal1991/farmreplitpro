import { pgTable, serial, varchar, text, numeric, date, timestamp } from "drizzle-orm/pg-core";

export const wasteCollections = pgTable("waste_collections", {
  id: serial("id").primaryKey(),
  requestCode: varchar("request_code", { length: 20 }).notNull().unique(),
  sourceType: varchar("source_type", { length: 20 }).notNull().default("household"),
  contactName: varchar("contact_name", { length: 120 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  wasteType: varchar("waste_type", { length: 30 }).notNull().default("mixed"),
  estimatedWeightKg: numeric("estimated_weight_kg", { precision: 7, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  scheduledDate: date("scheduled_date"),
  collectedDate: date("collected_date"),
  processingStartDate: date("processing_start_date"),
  completedDate: date("completed_date"),
  linkedBatchCode: varchar("linked_batch_code", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
