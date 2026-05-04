import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  confirmed: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

interface TrackResult {
  id: number;
  trackingNumber: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  city: string;
  customerName?: string;
  createdAt: string;
  assignedDriverName?: string | null;
}

export default function TrackOrderScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");

  async function handleTrack() {
    const tn = input.trim().toUpperCase();
    if (!tn) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api.orders.track(tn);
      setResult(data as TrackResult);
    } catch (e: unknown) {
      setError((e as Error).message ?? "لم يُعثر على الطلب");
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = result ? STATUS_STEPS.indexOf(result.status) : -1;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>تتبع الطلب</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchBox, { margin: 16 }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="search" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>تتبع طلبك</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>أدخل رقم التتبع للاطلاع على حالة طلبك</Text>

        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            value={input}
            onChangeText={t => setInput(t.toUpperCase())}
            placeholder="VF2026XXXXXX"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            style={[styles.input, { color: colors.foreground }]}
          />
          <Pressable
            style={[styles.searchBtn, { backgroundColor: colors.primary }]}
            onPress={handleTrack}
            disabled={loading || !input.trim()}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Feather name="search" size={18} color="#fff" />
            }
          </Pressable>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: "#fef2f2", borderColor: "#fca5a5" }]}>
            <Feather name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      {result && (
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
          <View style={styles.resultHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.foreground }]}>{result.productName}</Text>
              <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>
                {result.quantity} وحدة • {result.totalPrice.toLocaleString()} د.ج • {result.city}
              </Text>
              <Text style={[styles.trackingCode, { color: colors.primary }]} numberOfLines={1}>
                {result.trackingNumber}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[result.status] ?? "#888") + "20" }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[result.status] ?? "#888" }]}>
                {STATUS_LABELS[result.status] ?? result.status}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.stagesTitle, { color: colors.mutedForeground }]}>مراحل الطلب</Text>

          <View style={styles.stepsRow}>
            {STATUS_STEPS.map((step, i) => {
              const done = stepIndex >= i;
              const color = done ? colors.primary : colors.border;
              return (
                <React.Fragment key={step}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepDot, { backgroundColor: done ? colors.primary : colors.card, borderColor: color }]}>
                      {done && <Feather name="check" size={12} color="#fff" />}
                    </View>
                    <Text style={[styles.stepLabel, { color: done ? colors.primary : colors.mutedForeground }]}>
                      {STATUS_LABELS[step]}
                    </Text>
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: stepIndex > i ? colors.primary : colors.border }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {result.assignedDriverName && (
            <View style={[styles.driverRow, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Feather name="truck" size={16} color={colors.primary} />
              <Text style={[styles.driverText, { color: colors.primary }]}>السائق: {result.assignedDriverName}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  searchBox: { alignItems: "center", paddingTop: 24 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  sub: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } as object : {}),
  },
  searchBtn: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    width: "100%",
  },
  errorText: { color: "#ef4444", fontSize: 13, flex: 1, textAlign: "right" },
  resultCard: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16 },
  productName: { fontSize: 16, fontWeight: "700", textAlign: "right", marginBottom: 4 },
  resultMeta: { fontSize: 12, textAlign: "right", marginBottom: 4 },
  trackingCode: { fontSize: 12, fontWeight: "700", textAlign: "right" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  divider: { height: 1, marginHorizontal: 16 },
  stagesTitle: { fontSize: 12, fontWeight: "600", padding: 16, paddingBottom: 12, textAlign: "right" },
  stepsRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16 },
  stepItem: { alignItems: "center", gap: 6 },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  stepLabel: { fontSize: 10, fontWeight: "600", textAlign: "center", maxWidth: 55 },
  stepLine: { flex: 1, height: 2, marginBottom: 16 },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  driverText: { fontSize: 13, fontWeight: "600" },
});
