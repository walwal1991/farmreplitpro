import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useColors } from "@/hooks/useColors";
import type { Product } from "@/lib/api";

interface Props {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
}

function getImageUri(imageUrl: string): string {
  if (imageUrl.startsWith("http")) return imageUrl;
  return `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}${imageUrl}`;
}

export function ProductCard({ product, onPress, onAddToCart }: Props) {
  const colors = useColors();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.92 : 1,
        },
        Platform.OS !== "web"
          ? {
              shadowColor: "#1c1815",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }
          : ({ boxShadow: "0 2px 10px rgba(28,24,21,0.10)" } as object),
      ]}
      onPress={onPress}
    >
      <Image
        source={{ uri: getImageUri(product.imageUrl) }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      {product.stock === 0 && (
        <View
          style={[
            styles.outOfStockBadge,
            { backgroundColor: colors.destructive },
          ]}
        >
          <Text style={[styles.outOfStockText, { color: colors.destructiveForeground }]}>
            نفد
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.addBtn,
              {
                backgroundColor:
                  product.stock > 0 ? colors.primary : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              onAddToCart();
            }}
            disabled={product.stock === 0}
          >
            <Feather
              name="plus"
              size={16}
              color={
                product.stock > 0
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
          </Pressable>
          <Text style={[styles.price, { color: colors.primary }]}>
            {product.price.toLocaleString("ar-DZ")} دج
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 148,
    backgroundColor: "#e8dfd0",
  },
  outOfStockBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: "700",
  },
  info: {
    padding: 10,
    gap: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
  },
  addBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});
