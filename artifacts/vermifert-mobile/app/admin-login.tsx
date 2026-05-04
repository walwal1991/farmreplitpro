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
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getBaseUrl = () =>
  `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}`;

export default function AdminLoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleLogin = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل تسجيل الدخول");
      await AsyncStorage.setItem("admin_token", data.token);
      await AsyncStorage.setItem("admin_username", form.username.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/admin-dashboard" as never);
    } catch (e: unknown) {
      Alert.alert("خطأ", (e as Error).message ?? "فشل تسجيل الدخول");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: "#0f172a" }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dark header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color="#94a3b8" />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: "#1e293b" }]}>
            <Feather name="shield" size={44} color="#3b82f6" />
          </View>

          <Text style={styles.title}>لوحة الإدارة</Text>
          <Text style={styles.sub}>الوصول مقيد للمشرفين فقط</Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>اسم المستخدم</Text>
              <View style={[styles.inputWrap, { borderColor: "#334155" }]}>
                <Feather name="user" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.username}
                  onChangeText={(v) => set("username", v)}
                  placeholder="admin"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  textAlign="right"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>كلمة المرور</Text>
              <View style={[styles.inputWrap, { borderColor: "#334155" }]}>
                <Pressable onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
                  <Feather name={showPwd ? "eye-off" : "eye"} size={18} color="#64748b" />
                </Pressable>
                <TextInput
                  style={styles.input}
                  value={form.password}
                  onChangeText={(v) => set("password", v)}
                  placeholder="••••••"
                  placeholderTextColor="#475569"
                  secureTextEntry={!showPwd}
                  textAlign="right"
                />
              </View>
            </View>

            <Pressable
              style={[styles.btn, { backgroundColor: "#3b82f6", opacity: loading ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Feather name="log-in" size={18} color="#fff" />
                    <Text style={styles.btnText}>دخول إلى لوحة التحكم</Text>
                  </>
              }
            </Pressable>
          </View>

          {/* Security note */}
          <View style={[styles.secNote, { backgroundColor: "#1e293b", borderColor: "#334155" }]}>
            <Feather name="lock" size={14} color="#64748b" />
            <Text style={styles.secNoteText}>الجلسة محمية ومشفرة</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, padding: 28, alignItems: "center", gap: 12 },
  iconWrap: {
    width: 96, height: 96, borderRadius: 32,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  title: { color: "#f1f5f9", fontSize: 26, fontWeight: "800" },
  sub: { color: "#64748b", fontSize: 14, marginBottom: 16 },
  form: { width: "100%", gap: 16 },
  fieldGroup: { gap: 8 },
  label: { color: "#94a3b8", fontSize: 13, textAlign: "right", fontWeight: "600" },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1e293b", borderWidth: 1, borderRadius: 14,
    overflow: "hidden",
  },
  inputIcon: { paddingHorizontal: 14 },
  eyeBtn: { paddingHorizontal: 14 },
  input: { flex: 1, color: "#f1f5f9", padding: 14, fontSize: 15 },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, padding: 16, borderRadius: 14, marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, marginTop: 8,
  },
  secNoteText: { color: "#64748b", fontSize: 12 },
});
