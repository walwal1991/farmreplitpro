import { pgTable, serial, text, integer, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  trackingNumber: text("tracking_number").unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  notes: text("notes"),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  assignedDriverId: integer("assigned_driver_id"),
  assignedDriverName: text("assigned_driver_name"),
  requiresSignature: boolean("requires_signature").notNull().default(false),
  proofImage: text("proof_image"),
  signatureImage: text("signature_image"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  discountCodeUsed: text("discount_code_used"),
  discountAmount: integer("discount_amount").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("cod"),
  chargilyCheckoutId: text("chargily_checkout_id"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  subscriptionId: integer("subscription_id"),
  itemsJson: text("items_json"),
});

export type Order = typeof ordersTable.$inferSelect;
