import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";

export const sensorDevicesTable = pgTable("sensor_devices", {
  id:        serial("id").primaryKey(),
  deviceId:  text("device_id").notNull().unique(),
  token:     text("token").notNull(),
  name:      text("name").notNull(),
  location:  text("location"),
  notes:     text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sensorReadingsTable = pgTable("sensor_readings", {
  id:          serial("id").primaryKey(),
  deviceId:    text("device_id").notNull(),
  moisture:    real("moisture").notNull(),
  temperature: real("temperature"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});
