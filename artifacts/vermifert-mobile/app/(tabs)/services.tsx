import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const SERVICES = [
  {
    icon: "book-open" as const,
    label: "دليل الاستعمال",
    sub: "كيف تستخدم السماد خطوة بخطوة",
    color: "#22c55e",
    bg: "#f0fdf4",
    route: "/guide",
    badge: null,
  },
  {
    icon: "message-circle" as const,
    label: "استشارة مجانية",
    sub: "تحدث مع خبرائنا الزراعيين",
    color: "#3b82f6",
    bg: "#eff6ff",
    route: "/consultation",
    badge: "مجاني",
  },
  {
    icon: "cpu" as const,
    label: "تشخيص التربة",
    sub: "توصية ذكية بالمنتج والكمية",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    route: "/diagnosis",
    badge: "ذكاء اصطناعي",
  },
  {
    icon: "package" as const,
    label: "الاشتراك الشهري",
    sub: "صندوقك الزراعي كل شهر",
    color: "#f59e0b",
    bg: "#fffbeb",
    route: "/subscription",
    badge: null,
  },
  {
    icon: "award" as const,
    label: "التعليم والتكوين",
    sub: "دورات وورش تربية الديدان",
    color: "#ec4899",
    bg: "#fdf2f8",
    route: "/learn",
    badge: null,
  },
  {
    icon: "search" as const,
    label: "تتبع الطلب",
    sub: "اعرف أين طلبك الآن",
    color: "#0ea5e9",
    bg: "#f0f9ff",
    route: "/track-order",
    badge: null,
  },
];

export default function ServicesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={[styles.headerBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <Feather name="grid" size={13} color="#fff" />
          <Text style={styles.headerBadgeText}>خدمات فيرمفرت</Text>
        </View>
        <Text style={styles.headerTitle}>خدماتنا</Text>
        <Text style={styles.headerSub}>كل ما تحتاجه لمزرعتك في مكان واحد</Text>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {SERVICES.map((s) => (
          <Pressable
            key={s.route}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: s.bg,
                borderColor: s.color + "50",
                opacity: pressed ? 0.88 : 1,
              },
              Platform.OS !== "web"
                ? {
                    shadowColor: s.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    elevation: 4,
                  }
                : ({ boxShadow: `0 4px 14px ${s.color}22` } as object),
            ]}
            onPress={() => router.push(s.route as never)}
          >
            {s.badge && (
              <View style={[styles.badge, { backgroundColor: s.color }]}>
                <Text style={styles.badgeText}>{s.badge}</Text>
              </View>
            )}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: s.color + "1A" },
              ]}
            >
              <Feather name={s.icon} size={28} color={s.color} />
            </View>
            <Text style={[styles.cardLabel, { color: "#1e293b" }]}>
              {s.label}
            </Text>
            <Text style={[styles.cardSub, { color: "#64748b" }]}>{s.sub}</Text>
            <View
              style={[styles.arrowBtn, { backgroundColor: s.color + "15" }]}
            >
              <Feather name="arrow-left" size={14} color={s.color} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Contact banner */}
      <Pressable
        style={[styles.contactBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push("/consultation")}
      >
        <View style={[styles.contactIconWrap, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="phone" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.contactTitle, { color: colors.foreground }]}>
            هل تحتاج مساعدة؟
          </Text>
          <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>
            فريقنا جاهز للإجابة على جميع أسئلتك
          </Text>
        </View>
        <Feather name="chevron-left" size={20} color={colors.primary} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    position: "relative",
    overflow: "hidden",
    gap: 8,
  },
  headerCircle1: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    top: -80,
    left: -60,
  },
  headerCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -40,
    right: -20,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 4,
  },
  headerBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  headerTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "right",
  },
  headerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    textAlign: "right",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  card: {
    width: "47.5%",
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    alignItems: "flex-end",
    position: "relative",
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardLabel: { fontSize: 15, fontWeight: "800", textAlign: "right" },
  cardSub: { fontSize: 12, lineHeight: 18, textAlign: "right" },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  contactBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    marginTop: 4,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  contactIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  contactTitle: { fontSize: 15, fontWeight: "700", textAlign: "right" },
  contactSub: { fontSize: 12, textAlign: "right", marginTop: 2 },
});
