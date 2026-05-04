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
import { useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import * as Haptics from "expo-haptics";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      Alert.alert("خطأ", "يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const result = await api.customer.login({
        email: form.email.trim(),
        password: form.password,
      });
      await login({ ...result, token: result.token });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/account");
      }
    } catch (e: unknown) {
      Alert.alert("خطأ", (e as Error).message ?? "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "تسجيل الدخول", headerBackTitle: "رجوع" }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 28, paddingTop: 48, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.logoWrap,
              {
                backgroundColor: colors.primary + "18",
                borderRadius: 40,
              },
            ]}
          >
            <Feather name="leaf" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            مرحباً بعودتك
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            سجّل دخولك للمتابعة
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            البريد الإلكتروني
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
            value={form.email}
            onChangeText={(v) => set("email", v)}
            placeholder="example@mail.com"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign="right"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            كلمة المرور
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
              placeholder="••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPwd}
              textAlign="right"
            />
          </View>
        </View>

        <Pressable
          style={[
            styles.btn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
              دخول
            </Text>
          )}
        </Pressable>

        <View style={styles.signupRow}>
          <Pressable onPress={() => router.replace("/register")}>
            <Text style={[styles.signupLink, { color: colors.primary }]}>
              إنشاء حساب
            </Text>
          </Pressable>
          <Text style={[styles.signupText, { color: colors.mutedForeground }]}>
            ليس لديك حساب؟
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: 12, marginBottom: 8 },
  logoWrap: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 26, fontWeight: "800" },
  sub: { fontSize: 15 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, textAlign: "right" },
  input: { borderWidth: 1, padding: 14, fontSize: 15 },
  pwdWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
  pwdInput: { flex: 1, padding: 14, fontSize: 15 },
  btn: { padding: 16, alignItems: "center", marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: "700" },
  signupRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: "700" },
});
