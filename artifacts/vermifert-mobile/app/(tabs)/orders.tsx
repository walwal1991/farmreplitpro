import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api, type CustomerOrder } from "@/lib/api";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState } from "@/components/EmptyState";

function formatDate(d: string) {
  const parts = d.split("T")[0].split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("ar-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function OrdersScreen() {
  const colors = useColors();
  const { token } = useAuth();
  const [trackingInput, setTrackingInput] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Record<string, unknown> | null>(null);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["customer-orders", token],
    queryFn: () => api.customer.orders(token!),
    enabled: !!token,
  });

  const handleTrack = async () => {
    const code = trackingInput.trim();
    if (!code) return;
    setTracking(true);
    setTrackError("");
    setTrackedOrder(null);
    try {
      const result = await api.orders.track(code);
      setTrackedOrder(result as unknown as Record<string, unknown>);
    } catch (e: unknown) {
      setTrackError((e as Error).message ?? "رقم التتبع غير صحيح");
    } finally {
      setTracking(false);
    }
  };

  const renderOrder = ({ item }: { item: CustomerOrder }) => (
    <View
      style={[
        styles.orderCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.orderHeader}>
        <OrderStatusBadge status={item.status} />
        <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text style={[styles.orderProduct, { color: colors.foreground }]}>
        {item.productName}
      </Text>
      <View style={styles.orderFooter}>
        <Text style={[styles.orderTotal, { color: colors.primary }]}>
          {Number(item.totalPrice).toLocaleString("ar-DZ")} دج
        </Text>
        <Text style={[styles.orderTracking, { color: colors.mutedForeground }]}>
          #{item.trackingNumber}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === "web" && <View style={{ height: 67 }} />}
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            {/* Track Card */}
            <View
              style={[
                styles.trackCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.trackTitle, { color: colors.foreground }]}>
                تتبع طلبك
              </Text>
              <View style={styles.trackRow}>
                <Pressable
                  style={[
                    styles.trackBtn,
                    { backgroundColor: colors.primary, borderRadius: colors.radius },
                  ]}
                  onPress={handleTrack}
                  disabled={tracking}
                >
                  {tracking ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Feather name="search" size={18} color={colors.primaryForeground} />
                  )}
                </Pressable>
                <TextInput
                  style={[
                    styles.trackInput,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                      flex: 1,
                    },
                  ]}
                  placeholder="أدخل رقم التتبع..."
                  placeholderTextColor={colors.mutedForeground}
                  value={trackingInput}
                  onChangeText={setTrackingInput}
                  textAlign="right"
                  autoCapitalize="characters"
                />
              </View>
              {trackError ? (
                <Text style={[styles.trackError, { color: colors.destructive }]}>
                  {trackError}
                </Text>
              ) : null}
              {trackedOrder && (
                <View
                  style={[
                    styles.trackedResult,
                    {
                      backgroundColor: colors.muted,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <Text
                    style={[styles.trackedName, { color: colors.foreground }]}
                  >
                    {trackedOrder.productName as string}
                  </Text>
                  <OrderStatusBadge status={trackedOrder.status as string} />
                  {trackedOrder.assignedDriverName && (
                    <Text
                      style={[styles.trackedDriver, { color: colors.mutedForeground }]}
                    >
                      السائق: {trackedOrder.assignedDriverName as string}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {!token && (
              <View
                style={[
                  styles.loginHint,
                  {
                    backgroundColor: colors.accent,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Feather name="info" size={14} color={colors.accentForeground} />
                <Text
                  style={[styles.loginHintText, { color: colors.accentForeground }]}
                >
                  سجّل دخولك لعرض جميع طلباتك
                </Text>
              </View>
            )}

            {token && orders.length > 0 && (
              <Text style={[styles.myOrdersTitle, { color: colors.foreground }]}>
                طلباتي
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          token ? (
            isLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 20 }}
              />
            ) : (
              <EmptyState
                icon="package"
                title="لا توجد طلبات بعد"
                subtitle="ابدأ التسوق من المتجر"
              />
            )
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  trackCard: { padding: 16, borderWidth: 1, gap: 12 },
  trackTitle: { fontSize: 16, fontWeight: "700", textAlign: "right" },
  trackRow: { flexDirection: "row", gap: 10 },
  trackInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  trackBtn: { width: 46, alignItems: "center", justifyContent: "center" },
  trackError: { fontSize: 13, textAlign: "right" },
  trackedResult: { padding: 12, gap: 8 },
  trackedName: { fontSize: 15, fontWeight: "600", textAlign: "right" },
  trackedDriver: { fontSize: 13, textAlign: "right" },
  loginHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    justifyContent: "flex-end",
  },
  loginHintText: { fontSize: 13, fontWeight: "600" },
  myOrdersTitle: { fontSize: 17, fontWeight: "700", textAlign: "right" },
  orderCard: { borderWidth: 1, padding: 14, gap: 8 },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDate: { fontSize: 12 },
  orderProduct: { fontSize: 15, fontWeight: "600", textAlign: "right" },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTotal: { fontSize: 16, fontWeight: "700" },
  orderTracking: { fontSize: 12 },
});
