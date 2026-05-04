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
  { key: "worms", label: "ديدان", icon: "activity" },
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
        <View style={styles.heroDecor}>
          <Feather name="activity" size={100} color={"rgba(255,255,255,0.12)"} />
        </View>
        <View style={styles.heroContent}>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>
            سماد الديدان الطبيعي
          </Text>
          <Text style={[styles.heroSub, { color: colors.primaryForeground + "bb" }]}>
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
              style={[
                styles.catCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/shop",
                  params: { category: cat.key },
                })
              }
            >
              <Feather
                name={cat.icon as keyof typeof Feather.glyphMap}
                size={22}
                color={colors.primary}
              />
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
            color={colors.secondaryForeground + "60"}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.wasteTitle, { color: colors.secondaryForeground }]}>
              تبرع بمخلفاتك العضوية
            </Text>
            <Text style={[styles.wasteSub, { color: colors.secondaryForeground + "bb" }]}>
              نأتي إليك لجمعها — مجانًا
            </Text>
          </View>
          <View
            style={[
              styles.wasteIconWrap,
              { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 24 },
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
    padding: 24,
    minHeight: 170,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroDecor: {
    position: "absolute",
    top: -10,
    left: -10,
  },
  heroContent: { gap: 8, alignItems: "flex-end" },
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
    width: 88,
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
});
