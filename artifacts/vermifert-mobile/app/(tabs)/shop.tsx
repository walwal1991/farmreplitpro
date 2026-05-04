import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { api, type Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import * as Haptics from "expo-haptics";

const CATEGORIES = [
  { key: "all", label: "الكل" },
  { key: "solid", label: "صلب" },
  { key: "liquid", label: "سائل" },
  { key: "worms", label: "ديدان" },
  { key: "equipment", label: "معدات" },
  { key: "kit", label: "أطقم" },
  { key: "substrate", label: "ركيزة" },
];

export default function ShopScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(params.category ?? "all");
  const { addItem } = useCart();

  const { data: products = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["products"],
    queryFn: api.products.list,
  });

  const filtered = products.filter((p) => {
    if (!p.active) return false;
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === "web" && <View style={{ height: 67 }} />}

      {/* Search */}
      <View
        style={[
          styles.searchWrap,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.muted, borderRadius: colors.radius },
          ]}
        >
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="ابحث عن منتج..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          <Feather name="search" size={16} color={colors.mutedForeground} />
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.catScroll, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={[
              styles.catChip,
              { borderRadius: 20 },
              activeCategory === cat.key
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.muted },
            ]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Text
              style={[
                styles.catChipText,
                {
                  color:
                    activeCategory === cat.key
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="لا توجد منتجات"
            subtitle="جرب تغيير الفئة أو البحث بكلمة مختلفة"
          />
        ) : (
          filtered.map((p) => (
            <View key={p.id} style={styles.productCell}>
              <ProductCard
                product={p}
                onPress={() =>
                  router.push({ pathname: "/product/[id]", params: { id: p.id } })
                }
                onAddToCart={() => handleAddToCart(p)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { padding: 12, borderBottomWidth: 1 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  catScroll: { borderBottomWidth: 1 },
  catContent: { padding: 10, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8 },
  catChipText: { fontSize: 13, fontWeight: "600" },
  grid: {
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productCell: { width: "47.5%" },
});
