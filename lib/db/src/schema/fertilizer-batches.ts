import { pgTable, serial, varchar, text, numeric, date, timestamp } from "drizzle-orm/pg-core";

export const fertilizerBatchesTable = pgTable("fertilizer_batches", {
  id: serial("id").primaryKey(),
  batchCode: varchar("batch_code", { length: 20 }).notNull().unique(),
  sourceType: varchar("source_type", { length: 20 }).notNull().default("mixed"),
  sourceDescription: text("source_description"),
  nitrogen: numeric("nitrogen", { precision: 5, scale: 2 }).notNull().default("0"),
  phosphorus: numeric("phosphorus", { precision: 5, scale: 2 }).notNull().default("0"),
  potassium: numeric("potassium", { precision: 5, scale: 2 }).notNull().default("0"),
  organicMatter: numeric("organic_matter", { precision: 5, scale: 2 }).notNull().default("0"),
  productionDate: date("production_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
