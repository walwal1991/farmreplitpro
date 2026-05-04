import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api, type Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/ProductCard";
import * as Haptics from "expo-haptics";

const CATEGORIES = [
  { key: "solid", label: "سماد صلب", icon: "layers" },
  { key: "liquid", label: "سائل عضوي", icon: "droplet" },
  { key: "worms", label: "ديدان", icon: "zap" },
  { key: "equipment", label: "معدات", icon: "tool" },
  { key: "kit", label: "أطقم", icon: "package" },
  { key: "substrate", label: "ركيزة", icon: "grid" },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: api.products.list,
  });

  const featured = products.filter((p) => p.active && p.stock > 0).slice(0, 6);

  const handleAddToCart = (p: Product) => {
    const imgUri = p.imageUrl.startsWith("http")
      ? p.imageUrl
      : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}${p.imageUrl}`;
    addItem({
      productId: p.id,
      name: p.name,
      price: p.price,
      unit: p.unit,
      imageUrl: imgUri,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {Platform.OS === "web" && <View style={{ height: topPad }} />}

      {/* Hero */}
      <View
        style={[
          styles.hero,
          { backgroundColor: colors.primary, borderRadius: colors.radius + 4, margin: 16 },
        ]}
      >
        {/* Decorative circles */}
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <View style={styles.heroCircle3} />

        <View style={styles.heroContent}>
          <View style={styles.heroLeafBadge}>
            <Text style={styles.heroLeafEmoji}>🌱</Text>
            <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
              100% عضوي
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>
            سماد الديدان الطبيعي
          </Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.80)" }]}>
            أفضل سماد عضوي لمحاصيلك
          </Text>
          <Pressable
            style={[
              styles.heroBtn,
              {
                backgroundColor: colors.primaryForeground,
                borderRadius: colors.radius,
              },
            ]}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={[styles.heroBtnText, { color: colors.primary }]}>
              تسوق الآن
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          تصفح حسب الفئة
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.key}
              style={({ pressed }) => [
                styles.catCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                },
                Platform.OS !== "web"
                  ? {
                      shadowColor: "#1c1815",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 4,
                      elevation: 2,
                    }
                  : ({ boxShadow: "0 1px 6px rgba(28,24,21,0.08)" } as object),
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/shop",
                  params: { category: cat.key },
                })
              }
            >
              <View
                style={[
                  styles.catIconCircle,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Feather
                  name={cat.icon as keyof typeof Feather.glyphMap}
                  size={18}
                  color={colors.accentForeground}
                />
              </View>
              <Text style={[styles.catLabel, { color: colors.foreground }]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          منتجات مميزة
        </Text>
        {isLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: 24 }}
          />
        ) : (
          <View style={styles.productsGrid}>
            {featured.map((p) => (
              <View key={p.id} style={styles.productCell}>
                <ProductCard
                  product={p}
                  onPress={() =>
                    router.push({
                      pathname: "/product/[id]",
                      params: { id: p.id },
                    })
                  }
                  onAddToCart={() => handleAddToCart(p)}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>خدماتنا</Text>
        <View style={styles.servicesGrid}>
          {[
            { icon: "book-open" as const,    label: "دليل الاستعمال",    sub: "كيف تستخدم السماد",    color: "#22c55e", bg: "#f0fdf4", route: "/guide" },
            { icon: "message-circle" as const, label: "استشارة مجانية",  sub: "تحدث مع خبرائنا",      color: "#3b82f6", bg: "#eff6ff", route: "/consultation" },
            { icon: "cpu" as const,           label: "تشخيص التربة",      sub: "توصية ذكية لمزرعتك",  color: "#8b5cf6", bg: "#f5f3ff", route: "/diagnosis" },
            { icon: "package" as const,       label: "اشتراك شهري",       sub: "صندوقك الزراعي",      color: "#f59e0b", bg: "#fffbeb", route: "/subscription" },
            { icon: "award" as const,          label: "التعليم والتكوين", sub: "دورات ومزارع الديدان", color: "#ec4899", bg: "#fdf2f8", route: "/learn" },
            { icon: "search" as const,        label: "تتبع الطلب",        sub: "أين طلبي الآن؟",      color: "#0ea5e9", bg: "#f0f9ff", route: "/track-order" },
          ].map((s) => (
            <Pressable
              key={s.route}
              style={({ pressed }) => [
                styles.serviceCard,
                {
                  backgroundColor: s.bg,
                  borderColor: s.color + "40",
                  opacity: pressed ? 0.88 : 1,
                },
                Platform.OS !== "web"
                  ? { shadowColor: s.color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }
                  : ({ boxShadow: `0 2px 10px ${s.color}20` } as object),
              ]}
              onPress={() => router.push(s.route as never)}
            >
              <View style={[styles.serviceIconCircle, { backgroundColor: s.color + "20" }]}>
                <Feather name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={[styles.serviceLabel, { color: "#1e293b" }]}>{s.label}</Text>
              <Text style={[styles.serviceSub, { color: "#64748b" }]}>{s.sub}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Waste Collection CTA */}
      <Pressable
        style={[
          styles.wasteCTA,
          {
            backgroundColor: colors.secondary,
            borderRadius: colors.radius + 4,
            marginHorizontal: 16,
            marginTop: 24,
          },
        ]}
        onPress={() => router.push("/waste-collection")}
      >
        <View style={styles.wasteRow}>
          <Feather
            name="chevron-left"
            size={20}
            color={"rgba(255,255,255,0.40)"}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.wasteTitle, { color: colors.secondaryForeground }]}>
              تبرع بمخلفاتك العضوية
            </Text>
            <Text style={[styles.wasteSub, { color: "rgba(255,255,255,0.70)" }]}>
              نأتي إليك لجمعها — مجانًا
            </Text>
          </View>
          <View
            style={[
              styles.wasteIconWrap,
              { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 24 },
            ]}
          >
            <Feather name="refresh-cw" size={24} color={colors.secondaryForeground} />
          </View>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    minHeight: 190,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    top: -60,
    left: -60,
  },
  heroCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    top: -20,
    left: -20,
  },
  heroCircle3: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -30,
    right: -20,
  },
  heroContent: { gap: 8, alignItems: "flex-end" },
  heroLeafBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 2,
  },
  heroLeafEmoji: { fontSize: 13 },
  heroBadgeText: { fontSize: 12, fontWeight: "700" },
  heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "right" },
  heroSub: { fontSize: 14, textAlign: "right" },
  heroBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  heroBtnText: { fontWeight: "700", fontSize: 14 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 14,
  },
  catList: { gap: 10, paddingBottom: 4 },
  catCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 8,
    borderWidth: 1,
    width: 90,
  },
  catIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productCell: { width: "47.5%" },
  wasteCTA: { padding: 20, marginBottom: 8 },
  wasteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  wasteIconWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  wasteTitle: { fontSize: 16, fontWeight: "700", textAlign: "right" },
  wasteSub: { fontSize: 13, textAlign: "right", marginTop: 2 },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceCard: {
    width: "47.5%",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    alignItems: "flex-end",
  },
  serviceIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  serviceLabel: { fontSize: 14, fontWeight: "700", textAlign: "right" },
  serviceSub: { fontSize: 11, textAlign: "right" },
});
