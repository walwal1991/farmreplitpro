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

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalConsultations: number;
  newConsultations: number;
  totalProducts: number;
  ordersByStatus: { status: string; count: number }[];
}

interface ActivityItem {
  kind: "order" | "consultation";
  id: number;
  title: string;
  subtitle: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "انتظار",
  confirmed: "مؤكد",
  shipped: "شحن",
  delivered: "وصل",
  cancelled: "ملغى",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  confirmed: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

async function adminReq<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem("admin_token");
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token ?? "",
      ...((opts.headers as Record<string, string>) ?? {}),
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, a, u] = await Promise.all([
        adminReq<Stats>("/api/admin/stats"),
        adminReq<ActivityItem[]>("/api/admin/recent-activity"),
        AsyncStorage.getItem("admin_username"),
      ]);
      setStats(s);
      setActivity(a);
      setUsername(u ?? "admin");
    } catch (e: unknown) {
      const msg = (e as Error).message;
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        await AsyncStorage.removeItem("admin_token");
        router.replace("/admin-login" as never);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد الخروج من لوحة التحكم؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["admin_token", "admin_username"]);
          router.replace("/(tabs)/account" as never);
        },
      },
    ]);
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return "الآن";
    if (diff < 60) return `منذ ${diff} د`;
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} س`;
    return `منذ ${Math.floor(diff / 1440)} ي`;
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>جاري تحميل لوحة التحكم...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerCircle} />
          <View style={styles.headerRow}>
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Feather name="log-out" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.headerGreeting}>مرحباً، {username} 👋</Text>
              <Text style={styles.headerSub}>لوحة تحكم المدير</Text>
            </View>
            <View style={styles.headerAvatar}>
              <Feather name="shield" size={22} color="#3b82f6" />
            </View>
          </View>
        </View>

        {/* Stats grid */}
        {stats && (
          <View style={styles.statsGrid}>
            {[
              { label: "إجمالي الطلبات", value: stats.totalOrders, icon: "package" as const, color: "#3b82f6", bg: "#eff6ff" },
              { label: "قيد الانتظار", value: stats.pendingOrders, icon: "clock" as const, color: "#eab308", bg: "#fefce8" },
              { label: "تم التوصيل", value: stats.deliveredOrders, icon: "check-circle" as const, color: "#22c55e", bg: "#f0fdf4" },
              { label: "الإيرادات (د.ج)", value: stats.totalRevenue.toLocaleString("ar-DZ"), icon: "dollar-sign" as const, color: "#8b5cf6", bg: "#f5f3ff" },
              { label: "الاستشارات", value: stats.totalConsultations, icon: "message-circle" as const, color: "#0ea5e9", bg: "#f0f9ff" },
              { label: "استشارات جديدة", value: stats.newConsultations, icon: "bell" as const, color: "#f59e0b", bg: "#fffbeb" },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.color + "30" }]}>
                <View style={[styles.statIcon, { backgroundColor: s.color + "20" }]}>
                  <Feather name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: "#0f172a" }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: "#64748b" }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Status breakdown */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>حالات الطلبات</Text>
            <View style={[styles.statusCard, { backgroundColor: "#1e293b" }]}>
              {stats.ordersByStatus.map((s) => {
                const total = stats.totalOrders || 1;
                const pct = Math.round((s.count / total) * 100);
                const color = STATUS_COLORS[s.status] ?? "#888";
                return (
                  <View key={s.status} style={styles.statusRow}>
                    <Text style={[styles.statusPct, { color }]}>{pct}%</Text>
                    <View style={styles.statusBarWrap}>
                      <View style={[styles.statusBar, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: color }]} />
                    <Text style={styles.statusLabel}>{STATUS_LABELS[s.status] ?? s.status}</Text>
                    <Text style={[styles.statusCount, { color }]}>{s.count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.actionsRow}>
            {[
              { icon: "users" as const, label: "العملاء", color: "#3b82f6", bg: "#eff6ff", route: "/admin-customers" },
              { icon: "message-circle" as const, label: "الاستشارات", color: "#0ea5e9", bg: "#f0f9ff", route: "/admin-consultations" },
              { icon: "truck" as const, label: "السائقون", color: "#22c55e", bg: "#f0fdf4", route: "/admin-drivers" },
              { icon: "package" as const, label: "الطلبات", color: "#8b5cf6", bg: "#f5f3ff", route: "/admin-orders" },
            ].map((a) => (
              <Pressable
                key={a.route}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: a.bg, borderColor: a.color + "40", opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => router.push(a.route as never)}
              >
                <View style={[styles.actionIcon, { backgroundColor: a.color + "20" }]}>
                  <Feather name={a.icon} size={22} color={a.color} />
                </View>
                <Text style={[styles.actionLabel, { color: "#1e293b" }]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>النشاط الأخير</Text>
          <View style={[styles.activityCard, { backgroundColor: "#1e293b" }]}>
            {activity.length === 0 && (
              <Text style={{ color: "#64748b", textAlign: "center", padding: 20 }}>لا توجد أنشطة حديثة</Text>
            )}
            {activity.slice(0, 10).map((item, i) => (
              <View key={`${item.kind}-${item.id}`}>
                <View style={styles.activityRow}>
                  <Text style={styles.activityTime}>{formatTime(item.createdAt)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activitySub}>{item.subtitle}</Text>
                  </View>
                  <View style={[styles.activityKind, { backgroundColor: item.kind === "order" ? "#3b82f620" : "#0ea5e920" }]}>
                    <Feather
                      name={item.kind === "order" ? "shopping-bag" : "message-circle"}
                      size={14}
                      color={item.kind === "order" ? "#3b82f6" : "#0ea5e9"}
                    />
                  </View>
                </View>
                {i < activity.slice(0, 10).length - 1 && <View style={styles.activityDivider} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f172a" },
  loadingWrap: { flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { color: "#94a3b8", fontSize: 14 },
  header: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginBottom: 4,
    position: "relative",
    overflow: "hidden",
  },
  headerCircle: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: "#3b82f615", top: -60, right: -40,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#3b82f620",
    alignItems: "center", justifyContent: "center",
  },
  headerGreeting: { color: "#f1f5f9", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "#94a3b8", fontSize: 13, marginTop: 2 },
  logoutBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 10 },
  statCard: {
    width: "30.5%", borderRadius: 16, borderWidth: 1,
    padding: 14, alignItems: "center", gap: 6,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: "#94a3b8", fontSize: 13, fontWeight: "600", textAlign: "right", marginBottom: 10, letterSpacing: 0.5 },
  statusCard: { borderRadius: 16, padding: 16, gap: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusCount: { fontSize: 13, fontWeight: "700", minWidth: 24, textAlign: "right" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { color: "#94a3b8", fontSize: 12, minWidth: 40, textAlign: "right" },
  statusBarWrap: { flex: 1, height: 6, backgroundColor: "#334155", borderRadius: 3, overflow: "hidden" },
  statusBar: { height: "100%", borderRadius: 3 },
  statusPct: { fontSize: 11, fontWeight: "700", minWidth: 32, textAlign: "left" },
  actionsRow: { flexDirection: "row", gap: 10 },
  actionCard: {
    flex: 1, borderWidth: 1, borderRadius: 16,
    padding: 14, alignItems: "center", gap: 8,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontWeight: "700" },
  activityCard: { borderRadius: 16, overflow: "hidden" },
  activityRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 },
  activityKind: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  activityTitle: { color: "#f1f5f9", fontSize: 13, fontWeight: "600", textAlign: "right" },
  activitySub: { color: "#64748b", fontSize: 11, textAlign: "right", marginTop: 2 },
  activityTime: { color: "#475569", fontSize: 10, minWidth: 40 },
  activityDivider: { height: 1, backgroundColor: "#334155", marginHorizontal: 14 },
});
