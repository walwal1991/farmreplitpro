import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getBaseUrl = () =>
  `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}`;

interface DeliveryOrder {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  notes: string | null;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: "confirmed" | "shipped" | "delivered";
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; next?: string; nextLabel?: string }> = {
  confirmed: { label: "مؤكد — انتظار الاستلام", color: "#3b82f6", bg: "#eff6ff", next: "shipped", nextLabel: "تأكيد الاستلام والشحن" },
  shipped: { label: "في الطريق", color: "#f59e0b", bg: "#fffbeb", next: "delivered", nextLabel: "تأكيد التسليم" },
  delivered: { label: "تم التسليم ✓", color: "#22c55e", bg: "#f0fdf4" },
};

async function deliveryReq<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem("driver_token");
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-delivery-token": token ?? "",
      ...((opts.headers as Record<string, string>) ?? {}),
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export default function DriverDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [data, u] = await Promise.all([
        deliveryReq<DeliveryOrder[]>("/api/delivery/orders"),
        AsyncStorage.getItem("driver_username"),
      ]);
      setOrders(data);
      setUsername(u ?? "سائق");
    } catch (e: unknown) {
      const msg = (e as Error).message;
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        await AsyncStorage.removeItem("driver_token");
        router.replace("/driver-login" as never);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const toggleAvailable = async () => {
    const next = !available;
    setAvailable(next);
    try {
      await deliveryReq("/api/delivery/me/available", {
        method: "PATCH",
        body: JSON.stringify({ available: next }),
      });
    } catch {
      setAvailable(!next);
    }
  };

  const updateStatus = async (order: DeliveryOrder, newStatus: string) => {
    Alert.alert(
      "تحديث حالة الطلب",
      `هل تريد تغيير حالة الطلب إلى "${STATUS_CONFIG[newStatus]?.label}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تأكيد",
          onPress: async () => {
            setUpdatingId(order.id);
            try {
              await deliveryReq(`/api/delivery/orders/${order.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
              });
              await load();
            } catch (e: unknown) {
              Alert.alert("خطأ", (e as Error).message);
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد إنهاء الجلسة؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          try {
            await deliveryReq("/api/delivery/logout", { method: "POST" });
          } catch {}
          await AsyncStorage.multiRemove(["driver_token", "driver_username"]);
          router.replace("/(tabs)/account" as never);
        },
      },
    ]);
  };

  const pending = orders.filter(o => o.status === "confirmed");
  const inTransit = orders.filter(o => o.status === "shipped");

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>جاري تحميل المهام...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#22c55e" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Feather name="log-out" size={18} color="#6b7280" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerGreeting}>مرحباً، {username} 🚛</Text>
              <Text style={styles.headerSub}>بوابة السائق</Text>
            </View>
            <Pressable
              style={[styles.availBadge, { backgroundColor: available ? "#14532d" : "#450a0a" }]}
              onPress={toggleAvailable}
            >
              <View style={[styles.availDot, { backgroundColor: available ? "#4ade80" : "#f87171" }]} />
              <Text style={[styles.availText, { color: available ? "#4ade80" : "#f87171" }]}>
                {available ? "متاح" : "غير متاح"}
              </Text>
            </Pressable>
          </View>

          {/* Summary chips */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryChip, { backgroundColor: "#1e3a1e" }]}>
              <Text style={[styles.summaryNum, { color: "#4ade80" }]}>{inTransit.length}</Text>
              <Text style={styles.summaryLabel}>في الطريق</Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: "#1e293b" }]}>
              <Text style={[styles.summaryNum, { color: "#60a5fa" }]}>{pending.length}</Text>
              <Text style={styles.summaryLabel}>انتظار الاستلام</Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: "#1a1a1a" }]}>
              <Text style={[styles.summaryNum, { color: "#94a3b8" }]}>{orders.length}</Text>
              <Text style={styles.summaryLabel}>إجمالي</Text>
            </View>
          </View>
        </View>

        {/* In-transit orders */}
        {inTransit.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 في الطريق — تحتاج تأكيد تسليم</Text>
            {inTransit.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                updating={updatingId === order.id}
                onUpdate={updateStatus}
              />
            ))}
          </View>
        )}

        {/* Pending pickup */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 بانتظار الاستلام من المستودع</Text>
            {pending.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                updating={updatingId === order.id}
                onUpdate={updateStatus}
              />
            ))}
          </View>
        )}

        {orders.length === 0 && (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: "#1e293b" }]}>
              <Feather name="check-circle" size={48} color="#22c55e" />
            </View>
            <Text style={styles.emptyTitle}>لا توجد مهام حالياً</Text>
            <Text style={styles.emptySub}>سيتم إخطارك عند تعيين طلب جديد</Text>
            <Pressable
              style={[styles.refreshBtn, { backgroundColor: "#14532d" }]}
              onPress={() => { setRefreshing(true); load(); }}
            >
              <Feather name="refresh-cw" size={16} color="#4ade80" />
              <Text style={[styles.refreshBtnText, { color: "#4ade80" }]}>تحديث</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function OrderCard({
  order,
  updating,
  onUpdate,
}: {
  order: DeliveryOrder;
  updating: boolean;
  onUpdate: (order: DeliveryOrder, status: string) => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  return (
    <View style={[styles.orderCard, { borderColor: cfg.color + "40", backgroundColor: "#111827" }]}>
      {/* Status badge */}
      <View style={[styles.orderStatusBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.orderStatusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {/* Customer info */}
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderCustomer}>{order.customerName}</Text>
          <Text style={styles.orderProduct}>{order.productName} × {order.quantity}</Text>
        </View>
        <Text style={[styles.orderPrice, { color: "#22c55e" }]}>{order.totalPrice.toLocaleString()} د.ج</Text>
      </View>

      {/* Address */}
      <View style={styles.orderAddressRow}>
        <Feather name="map-pin" size={13} color="#64748b" />
        <Text style={styles.orderAddress}>{order.address}، {order.city}</Text>
      </View>

      {/* Phone */}
      <View style={styles.orderAddressRow}>
        <Feather name="phone" size={13} color="#64748b" />
        <Text style={styles.orderAddress}>{order.phone}</Text>
      </View>

      {/* Notes */}
      {order.notes && (
        <View style={[styles.notesBox, { backgroundColor: "#1e293b" }]}>
          <Feather name="info" size={12} color="#94a3b8" />
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}

      {/* Action button */}
      {cfg.next && (
        <Pressable
          style={[styles.actionBtn, { backgroundColor: cfg.color, opacity: updating ? 0.6 : 1 }]}
          onPress={() => onUpdate(order, cfg.next!)}
          disabled={updating}
        >
          {updating
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>{cfg.nextLabel}</Text>
              </>
          }
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c1a0c" },
  loadingWrap: { flex: 1, backgroundColor: "#0c1a0c", alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { color: "#6b7280", fontSize: 14 },
  header: {
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoutBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerGreeting: { color: "#f0fdf4", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "#4b5563", fontSize: 13 },
  availBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: "700" },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryChip: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  summaryNum: { fontSize: 24, fontWeight: "800" },
  summaryLabel: { color: "#6b7280", fontSize: 11 },
  section: { padding: 16, gap: 10 },
  sectionTitle: { color: "#6b7280", fontSize: 13, fontWeight: "600", textAlign: "right" },
  orderCard: { borderWidth: 1.5, borderRadius: 16, overflow: "hidden", gap: 0 },
  orderStatusBadge: { paddingHorizontal: 14, paddingVertical: 8 },
  orderStatusText: { fontSize: 12, fontWeight: "700", textAlign: "right" },
  orderHeader: { flexDirection: "row", alignItems: "flex-start", padding: 14, paddingBottom: 8 },
  orderInfo: { flex: 1, alignItems: "flex-end", gap: 3 },
  orderCustomer: { color: "#f0fdf4", fontSize: 15, fontWeight: "700" },
  orderProduct: { color: "#6b7280", fontSize: 12 },
  orderPrice: { fontSize: 16, fontWeight: "800" },
  orderAddressRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingBottom: 6 },
  orderAddress: { color: "#94a3b8", fontSize: 13, flex: 1, textAlign: "right" },
  notesBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, margin: 14, marginTop: 4, padding: 10, borderRadius: 10 },
  notesText: { color: "#94a3b8", fontSize: 12, flex: 1, textAlign: "right" },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 14, margin: 14, marginTop: 4, borderRadius: 12,
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyWrap: { alignItems: "center", padding: 40, gap: 14, marginTop: 40 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: "#f0fdf4", fontSize: 20, fontWeight: "700" },
  emptySub: { color: "#4b5563", fontSize: 14, textAlign: "center" },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  refreshBtnText: { fontWeight: "700", fontSize: 14 },
});
