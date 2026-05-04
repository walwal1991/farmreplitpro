import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import * as Haptics from "expo-haptics";

const CATEGORY_LABELS: Record<string, string> = {
  solid: "سماد صلب",
  liquid: "سائل عضوي",
  worms: "ديدان",
  equipment: "معدات",
  kit: "طقم",
  substrate: "ركيزة",
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.products.get(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "", headerBackTitle: "رجوع" }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </>
    );
  }

  if (!product) return null;

  const imageUri = product.imageUrl.startsWith("http")
    ? product.imageUrl
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}${product.imageUrl}`;

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        imageUrl: imageUri,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/(tabs)/cart");
  };

  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <>
      <Stack.Screen
        options={{ title: "", headerBackTitle: "رجوع" }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.info}>
            <Text style={[styles.category, { color: colors.mutedForeground }]}>
              {CATEGORY_LABELS[product.category] ?? product.category}
            </Text>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {product.name}
            </Text>
            <Text style={[styles.price, { color: colors.primary }]}>
              {product.price.toLocaleString("ar-DZ")} دج / {product.unit}
            </Text>
            {product.weightKg != null && (
              <Text style={[styles.weight, { color: colors.mutedForeground }]}>
                الوزن: {product.weightKg} كغ
              </Text>
            )}
            <View
              style={[
                styles.stockBadge,
                {
                  backgroundColor:
                    product.stock > 0 ? colors.accent : colors.muted,
                  borderRadius: 8,
                },
              ]}
            >
              <Text
                style={[
                  styles.stockText,
                  {
                    color:
                      product.stock > 0
                        ? colors.accentForeground
                        : colors.mutedForeground,
                  },
                ]}
              >
                {product.stock > 0
                  ? `متوفر — ${product.stock} وحدة`
                  : "نفد المخزون"}
              </Text>
            </View>
            <View
              style={[
                styles.descCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.descTitle, { color: colors.foreground }]}>
                وصف المنتج
              </Text>
              <Text style={[styles.desc, { color: colors.mutedForeground }]}>
                {product.description}
              </Text>
            </View>
          </View>
        </ScrollView>

        {product.stock > 0 && (
          <View
            style={[
              styles.addBar,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: bottomPad + 8,
              },
            ]}
          >
            <View
              style={[
                styles.qtyControl,
                { backgroundColor: colors.muted, borderRadius: colors.radius },
              ]}
            >
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Feather name="minus" size={16} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.qtyNum, { color: colors.foreground }]}>
                {qty}
              </Text>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQty((q) => Math.min(product.stock, q + 1))}
              >
                <Feather name="plus" size={16} color={colors.foreground} />
              </Pressable>
            </View>
            <Pressable
              style={[
                styles.addBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  flex: 1,
                },
              ]}
              onPress={handleAddToCart}
            >
              <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>
                أضف للسلة — {(product.price * qty).toLocaleString("ar-DZ")} دج
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: 290, backgroundColor: "#e8dfd0" },
  info: { padding: 20, gap: 10 },
  category: {
    fontSize: 12,
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  name: { fontSize: 22, fontWeight: "800", textAlign: "right", lineHeight: 30 },
  price: { fontSize: 26, fontWeight: "800", textAlign: "right" },
  weight: { fontSize: 13, textAlign: "right" },
  stockBadge: { padding: 10, alignSelf: "flex-end" },
  stockText: { fontSize: 13, fontWeight: "600" },
  descCard: { padding: 14, borderWidth: 1, gap: 8, marginTop: 6 },
  descTitle: { fontSize: 14, fontWeight: "700", textAlign: "right" },
  desc: { fontSize: 14, textAlign: "right", lineHeight: 22 },
  addBar: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  qtyControl: { flexDirection: "row", alignItems: "center" },
  qtyBtn: { padding: 12 },
  qtyNum: {
    minWidth: 36,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  addBtn: { padding: 16, alignItems: "center" },
  addBtnText: { fontWeight: "700", fontSize: 15 },
});
