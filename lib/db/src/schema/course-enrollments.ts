import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const courseEnrollmentsTable = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  courseId: text("course_id").notNull(),
  status: text("status").notNull().default("new"),
  trainingLink: text("training_link"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CourseEnrollment = typeof courseEnrollmentsTable.$inferSelect;
