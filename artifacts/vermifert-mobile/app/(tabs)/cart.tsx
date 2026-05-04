import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCart, type CartItem } from "@/context/CartContext";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import * as Haptics from "expo-haptics";

export default function CartScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{ discountPercent: number; code: string } | null>(null);
  const [validating, setValidating] = useState(false);

  const discountAmount = discount ? (totalPrice * discount.discountPercent) / 100 : 0;
  const finalPrice = Math.round(totalPrice - discountAmount);

  const validateCode = async () => {
    if (!discountCode.trim()) return;
    setValidating(true);
    try {
      const result = await api.discount.validate(discountCode.trim());
      setDiscount(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      Alert.alert("خطأ", (e as Error).message ?? "الكود غير صالح");
      setDiscount(null);
    } finally {
      setValidating(false);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View
      style={[
        styles.cartItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.itemImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.itemInfo}>
        <Text
          style={[styles.itemName, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text style={[styles.itemUnit, { color: colors.mutedForeground }]}>
          {item.price.toLocaleString("ar-DZ")} دج / {item.unit}
        </Text>
        <Text style={[styles.itemTotal, { color: colors.primary }]}>
          {(item.price * item.quantity).toLocaleString("ar-DZ")} دج
        </Text>
        <View style={styles.qtyRow}>
          <Pressable
            style={[styles.deleteBtn, { backgroundColor: colors.destructive + "18" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              removeItem(item.productId);
            }}
          >
            <Feather name="trash-2" size={14} color={colors.destructive} />
          </Pressable>
          <View
            style={[
              styles.qtyControl,
              { backgroundColor: colors.muted, borderRadius: 8 },
            ]}
          >
            <Pressable
              style={styles.qtyArrow}
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
            >
              <Feather name="minus" size={14} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.qtyNum, { color: colors.foreground }]}>
              {item.quantity}
            </Text>
            <Pressable
              style={styles.qtyArrow}
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
            >
              <Feather name="plus" size={14} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
        }}
      >
        {Platform.OS === "web" && <View style={{ height: 67 }} />}
        <EmptyState
          icon="shopping-cart"
          title="السلة فارغة"
          subtitle="أضف منتجات من المتجر"
        />
        <Pressable
          style={[
            styles.shopBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              marginHorizontal: 40,
              marginTop: 16,
            },
          ]}
          onPress={() => router.push("/(tabs)/shop")}
        >
          <Text style={[styles.shopBtnText, { color: colors.primaryForeground }]}>
            تصفح المنتجات
          </Text>
        </Pressable>
      </View>
    );
  }

  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === "web" && <View style={{ height: 67 }} />}
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.productId)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 220, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={{ gap: 10, marginTop: 8 }}>
            <View
              style={[
                styles.discountWrap,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Pressable
                style={[
                  styles.applyBtn,
                  { backgroundColor: colors.primary, borderRadius: colors.radius - 2 },
                ]}
                onPress={validateCode}
                disabled={validating}
              >
                {validating ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.applyBtnText, { color: colors.primaryForeground }]}>
                    تطبيق
                  </Text>
                )}
              </Pressable>
              <TextInput
                style={[styles.discountInput, { color: colors.foreground }]}
                placeholder="كود الخصم..."
                placeholderTextColor={colors.mutedForeground}
                value={discountCode}
                onChangeText={setDiscountCode}
                autoCapitalize="characters"
                textAlign="right"
              />
            </View>
            {discount && (
              <View
                style={[
                  styles.discountApplied,
                  {
                    backgroundColor: colors.accent,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Feather name="check-circle" size={14} color={colors.accentForeground} />
                <Text style={[styles.discountAppliedText, { color: colors.accentForeground }]}>
                  خصم {discount.discountPercent}% مطبّق
                </Text>
              </View>
            )}
          </View>
        }
      />

      {/* Checkout Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 8,
          },
        ]}
      >
        {discount && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryVal, { color: colors.destructive }]}>
              -{discountAmount.toFixed(0)} دج
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              الخصم
            </Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={[styles.totalVal, { color: colors.primary }]}>
            {finalPrice.toLocaleString("ar-DZ")} دج
          </Text>
          <Text style={[styles.totalLabel, { color: colors.foreground }]}>الإجمالي</Text>
        </View>
        <Pressable
          style={[
            styles.checkoutBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          onPress={() =>
            router.push({
              pathname: "/checkout",
              params: {
                discountCode: discount?.code ?? "",
                finalPrice: String(finalPrice),
              },
            })
          }
        >
          <Text
            style={[styles.checkoutBtnText, { color: colors.primaryForeground }]}
          >
            إتمام الطلب ({totalItems})
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: "row",
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  itemImage: { width: 82, height: 82, borderRadius: 8 },
  itemInfo: { flex: 1, gap: 3, alignItems: "flex-end" },
  itemName: { fontSize: 14, fontWeight: "600", textAlign: "right" },
  itemUnit: { fontSize: 12 },
  itemTotal: { fontSize: 15, fontWeight: "800" },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  qtyControl: { flexDirection: "row", alignItems: "center" },
  qtyArrow: { padding: 8 },
  qtyNum: {
    minWidth: 24,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
  },
  discountWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 6,
    gap: 8,
  },
  discountInput: { flex: 1, fontSize: 14, paddingVertical: 6, paddingHorizontal: 8 },
  applyBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  applyBtnText: { fontWeight: "700", fontSize: 13 },
  discountApplied: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    justifyContent: "flex-end",
  },
  discountAppliedText: { fontSize: 13, fontWeight: "600" },
  footer: { padding: 16, borderTopWidth: 1, gap: 8 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { fontSize: 14 },
  summaryVal: { fontSize: 14, fontWeight: "600" },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalVal: { fontSize: 20, fontWeight: "800" },
  checkoutBtn: { padding: 16, alignItems: "center", marginTop: 4 },
  checkoutBtnText: { fontSize: 16, fontWeight: "700" },
  shopBtn: { padding: 16, alignItems: "center" },
  shopBtnText: { fontSize: 16, fontWeight: "700" },
});
