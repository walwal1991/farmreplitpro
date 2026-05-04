import React from "react";
import { View, Text, StyleSheet } from "react-native";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "#d97706" },
  confirmed: { label: "مؤكد", color: "#2563eb" },
  shipped: { label: "في الطريق", color: "#7c3aed" },
  delivered: { label: "تم التسليم", color: "#059669" },
  cancelled: { label: "ملغى", color: "#dc2626" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, color: "#6b7280" };
  return (
    <View style={[styles.badge, { backgroundColor: entry.color + "22" }]}>
      <View style={[styles.dot, { backgroundColor: entry.color }]} />
      <Text style={[styles.label, { color: entry.color }]}>{entry.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
