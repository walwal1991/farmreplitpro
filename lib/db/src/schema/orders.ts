import { pgTable, serial, text, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  notes: text("notes"),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Order = typeof ordersTable.$inferSelect;
