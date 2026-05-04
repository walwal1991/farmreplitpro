import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import * as Haptics from "expo-haptics";

const CITIES = [
  "الجزائر",
  "وهران",
  "قسنطينة",
  "عنابة",
  "بجاية",
  "تلمسان",
  "بلعباس",
  "سطيف",
  "تيزي وزو",
  "باتنة",
  "مستغانم",
  "المدية",
  "الشلف",
  "بسكرة",
];

export default function CheckoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    discountCode?: string;
    finalPrice?: string;
  }>();

  const finalPrice = Number(params.finalPrice ?? totalPrice);

  const [form, setForm] = useState({
    customerName: user?.name ?? "",
    phone: user?.phone ?? "",
    address: "",
    city: CITIES[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.customerName.trim() || !form.phone.trim() || !form.address.trim()) {
      Alert.alert("خطأ", "يرجى ملء الاسم والهاتف والعنوان");
      return;
    }
    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
      const result = await api.orders.createCart({
        customerName: form.customerName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        notes: form.notes || null,
        items: orderItems,
        discountCode: params.discountCode || undefined,
      });
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "تم الطلب",
        `تم تسجيل طلبك بنجاح!\nرقم التتبع: ${(result as Record<string, unknown>).trackingNumber}`,
        [
          {
            text: "تتبع طلبي",
            onPress: () => router.push("/(tabs)/orders"),
          },
        ]
      );
    } catch (e: unknown) {
      Alert.alert("خطأ", (e as Error).message ?? "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <>
      <Stack.Screen options={{ title: "إتمام الطلب", headerBackTitle: "رجوع" }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order Summary */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              ملخص الطلب
            </Text>
            {items.map((item) => (
              <View key={item.productId} style={styles.summaryRow}>
                <Text style={[styles.summaryPrice, { color: colors.primary }]}>
                  {(item.price * item.quantity).toLocaleString("ar-DZ")} دج
                </Text>
                <Text
                  style={[styles.summaryName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.name} ×{item.quantity}
                </Text>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalVal, { color: colors.primary }]}>
                {finalPrice.toLocaleString("ar-DZ")} دج
              </Text>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>
                الإجمالي
              </Text>
            </View>
          </View>

          {/* Delivery Info */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              معلومات التسليم
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                الاسم الكامل *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                value={form.customerName}
                onChangeText={(v) => set("customerName", v)}
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                رقم الهاتف *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                value={form.phone}
                onChangeText={(v) => set("phone", v)}
                placeholder="0X XX XX XX XX"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                المدينة *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cityList}
              >
                {CITIES.map((city) => (
                  <Pressable
                    key={city}
                    style={[
                      styles.cityChip,
                      { borderRadius: 20 },
                      form.city === city
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.muted },
                    ]}
                    onPress={() => set("city", city)}
                  >
                    <Text
                      style={[
                        styles.cityText,
                        {
                          color:
                            form.city === city
                              ? colors.primaryForeground
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      {city}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                العنوان التفصيلي *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textarea,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                value={form.address}
                onChangeText={(v) => set("address", v)}
                placeholder="الشارع، الحي، رقم البناية..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                textAlign="right"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                ملاحظات (اختياري)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                value={form.notes}
                onChangeText={(v) => set("notes", v)}
                placeholder="أي تعليمات خاصة..."
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
            </View>
          </View>

          {/* COD Notice */}
          <View
            style={[
              styles.codNotice,
              {
                backgroundColor: colors.muted,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.codText, { color: colors.mutedForeground }]}>
              الدفع نقداً عند الاستلام
            </Text>
            <Feather name="credit-card" size={16} color={colors.mutedForeground} />
          </View>
        </ScrollView>

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
          <Pressable
            style={[
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
              },
              submitting && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                تأكيد الطلب
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", textAlign: "right", marginBottom: 4 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryName: { fontSize: 14, textAlign: "right", flex: 1, marginLeft: 8 },
  summaryPrice: { fontSize: 14, fontWeight: "700" },
  divider: { height: 1, marginVertical: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalVal: { fontSize: 20, fontWeight: "800" },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, textAlign: "right" },
  input: { borderWidth: 1, padding: 12, fontSize: 14 },
  textarea: { height: 80, paddingTop: 10 },
  cityList: { gap: 8, paddingVertical: 4 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 8 },
  cityText: { fontSize: 13, fontWeight: "600" },
  codNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    justifyContent: "flex-end",
  },
  codText: { fontSize: 13 },
  footer: { padding: 16, borderTopWidth: 1 },
  submitBtn: { padding: 16, alignItems: "center" },
  submitText: { fontSize: 16, fontWeight: "700" },
});
