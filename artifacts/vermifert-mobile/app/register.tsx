import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import * as Haptics from "expo-haptics";

export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { login } = useAuth();
  const params = useLocalSearchParams<{ ref?: string }>();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    refCode: params.ref ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleRegister = async () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password.trim()
    ) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      const result = await api.customer.register({
        name: form.name,
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        refCode: form.refCode.trim() || undefined,
      });
      await login({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        token: result.token,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.welcomeCode) {
        Alert.alert(
          "مرحباً بك!",
          `حصلت على كود خصم 10%\n${result.welcomeCode}`,
          [
            {
              text: "رائع!",
              onPress: () => {
                if (router.canGoBack()) router.back();
                else router.replace("/(tabs)/account");
              },
            },
          ]
        );
      } else {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)/account");
      }
    } catch (e: unknown) {
      Alert.alert("خطأ", (e as Error).message ?? "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "حساب جديد", headerBackTitle: "رجوع" }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 24, paddingTop: 36, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            إنشاء حساب
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            انضم إلى متجر Vermifert
          </Text>
        </View>

        {[
          {
            key: "name" as const,
            label: "الاسم الكامل *",
            placeholder: "محمد أمين",
            keyboard: "default" as const,
            capitalize: "words" as const,
          },
          {
            key: "email" as const,
            label: "البريد الإلكتروني *",
            placeholder: "example@mail.com",
            keyboard: "email-address" as const,
            capitalize: "none" as const,
          },
          {
            key: "phone" as const,
            label: "الهاتف *",
            placeholder: "0X XX XX XX XX",
            keyboard: "phone-pad" as const,
            capitalize: "none" as const,
          },
        ].map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              {field.label}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  backgroundColor: colors.card,
                },
              ]}
              value={form[field.key]}
              onChangeText={(v) => set(field.key, v)}
              placeholder={field.placeholder}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize={field.capitalize}
              keyboardType={field.keyboard}
              textAlign="right"
            />
          </View>
        ))}

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            كلمة المرور *
          </Text>
          <View
            style={[
              styles.pwdWrap,
              {
                borderColor: colors.border,
                borderRadius: colors.radius,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Pressable
              onPress={() => setShowPwd(!showPwd)}
              style={{ padding: 14 }}
            >
              <Feather
                name={showPwd ? "eye-off" : "eye"}
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
            <TextInput
              style={[styles.pwdInput, { color: colors.foreground }]}
              value={form.password}
              onChangeText={(v) => set("password", v)}
              placeholder="6 أحرف على الأقل"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPwd}
              textAlign="right"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            كود الإحالة (اختياري)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                borderRadius: colors.radius,
                backgroundColor: colors.card,
              },
            ]}
            value={form.refCode}
            onChangeText={(v) => set("refCode", v)}
            placeholder="REF-XXXXXXXX"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            textAlign="right"
          />
        </View>

        <Pressable
          style={[
            styles.btn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
              إنشاء الحساب
            </Text>
          )}
        </Pressable>

        <View style={styles.loginRow}>
          <Pressable onPress={() => router.replace("/login")}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>
              تسجيل الدخول
            </Text>
          </Pressable>
          <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
            لديك حساب؟
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: 8, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "800" },
  sub: { fontSize: 15 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, textAlign: "right" },
  input: { borderWidth: 1, padding: 14, fontSize: 15 },
  pwdWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
  pwdInput: { flex: 1, padding: 14, fontSize: 15 },
  btn: { padding: 16, alignItems: "center", marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: "700" },
  loginRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: "700" },
});
