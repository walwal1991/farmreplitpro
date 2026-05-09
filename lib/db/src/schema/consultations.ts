import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const consultationsTable = pgTable("consultations", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  soilType: text("soil_type").notNull(),
  crop: text("crop").notNull(),
  problem: text("problem").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Consultation = typeof consultationsTable.$inferSelect;
