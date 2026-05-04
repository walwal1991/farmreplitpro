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
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { api, type WasteCollection } from "@/lib/api";
import * as Haptics from "expo-haptics";

const SOURCE_TYPES = [
  { key: "household", label: "منزلي" },
  { key: "farm", label: "مزرعة" },
  { key: "restaurant", label: "مطعم" },
  { key: "market", label: "سوق" },
  { key: "other", label: "أخرى" },
];

const WC_STATUS: Record<string, string> = {
  pending: "قيد الانتظار",
  scheduled: "مجدول",
  in_progress: "جاري التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغى",
};

type Tab = "submit" | "track";

function formatLocalDate(d: string) {
  const parts = d.split("T")[0].split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("ar-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function WasteCollectionScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<Tab>("submit");

  const [form, setForm] = useState({
    contactName: "",
    contactPhone: "",
    address: "",
    sourceType: "household",
    wasteType: "mixed",
    estimatedWeightKg: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<WasteCollection | null>(null);

  const [trackCode, setTrackCode] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackedWC, setTrackedWC] = useState<WasteCollection | null>(null);
  const [trackError, setTrackError] = useState("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.contactName.trim() || !form.contactPhone.trim() || !form.address.trim()) {
      Alert.alert("خطأ", "يرجى ملء الاسم والهاتف والعنوان");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.wasteCollections.create({
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        address: form.address,
        sourceType: form.sourceType,
        wasteType: form.wasteType,
        estimatedWeightKg: form.estimatedWeightKg
          ? Number(form.estimatedWeightKg)
          : undefined,
        notes: form.notes || undefined,
      });
      setSubmitted(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      Alert.alert("خطأ", (e as Error).message ?? "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async () => {
    if (!trackCode.trim()) return;
    setTracking(true);
    setTrackError("");
    setTrackedWC(null);
    try {
      const result = await api.wasteCollections.track(trackCode.trim().toUpperCase());
      setTrackedWC(result);
    } catch (e: unknown) {
      setTrackError((e as Error).message ?? "الكود غير صحيح");
    } finally {
      setTracking(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "جمع المخلفات", headerBackTitle: "رجوع" }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Tab Bar */}
        <View
          style={[
            styles.tabRow,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          {(["submit", "track"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[
                styles.tabBtn,
                tab === t && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setTab(t)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: tab === t ? colors.primary : colors.mutedForeground,
                    fontWeight: tab === t ? "700" : "500",
                  },
                ]}
              >
                {t === "submit" ? "تقديم طلب" : "تتبع طلب"}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "submit" ? (
          submitted ? (
            <ScrollView
              contentContainerStyle={styles.successWrap}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.successIconWrap,
                  {
                    backgroundColor: colors.primary + "18",
                    borderRadius: 52,
                  },
                ]}
              >
                <Feather name="check-circle" size={52} color={colors.primary} />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                تم استلام طلبك!
              </Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                رقم تتبع طلبك
              </Text>
              <View
                style={[
                  styles.codeBox,
                  {
                    backgroundColor: colors.muted,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={[styles.codeText, { color: colors.foreground }]}>
                  {submitted.requestCode}
                </Text>
              </View>
              <Text style={[styles.successNote, { color: colors.mutedForeground }]}>
                احتفظ بهذا الرقم لمتابعة حالة الطلب. سنتواصل معك لتحديد موعد الجمع.
              </Text>
              <Pressable
                style={[
                  styles.trackNowBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                  },
                ]}
                onPress={() => {
                  setTab("track");
                  setTrackCode(submitted.requestCode);
                }}
              >
                <Text style={[styles.trackNowText, { color: colors.primaryForeground }]}>
                  تتبع طلبي
                </Text>
              </Pressable>
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 14 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  نوع المصدر *
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {SOURCE_TYPES.map((st) => (
                    <Pressable
                      key={st.key}
                      style={[
                        styles.chip,
                        { borderRadius: 20 },
                        form.sourceType === st.key
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.muted },
                      ]}
                      onPress={() => set("sourceType", st.key)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color:
                              form.sourceType === st.key
                                ? colors.primaryForeground
                                : colors.mutedForeground,
                          },
                        ]}
                      >
                        {st.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {[
                { key: "contactName" as const, label: "الاسم *", placeholder: "اسمك الكامل", keyboard: "default" },
                { key: "contactPhone" as const, label: "الهاتف *", placeholder: "0X XX XX XX XX", keyboard: "phone-pad" },
              ].map((f) => (
                <View key={f.key} style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    {f.label}
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
                    value={form[f.key]}
                    onChangeText={(v) => set(f.key, v)}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType={f.keyboard as "default" | "phone-pad"}
                    textAlign="right"
                  />
                </View>
              ))}

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  العنوان *
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
                  placeholder="عنوانك التفصيلي"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  textAlign="right"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  الوزن التقديري (كغ) — اختياري
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
                  value={form.estimatedWeightKg}
                  onChangeText={(v) => set("estimatedWeightKg", v)}
                  placeholder="مثلاً: 5"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>

              <Pressable
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    marginTop: 4,
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
                    إرسال الطلب
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          )
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 14 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                رقم التتبع
              </Text>
              <View style={styles.trackRow}>
                <Pressable
                  style={[
                    styles.trackBtn,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: colors.radius,
                    },
                  ]}
                  onPress={handleTrack}
                  disabled={tracking}
                >
                  {tracking ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Feather name="search" size={18} color={colors.primaryForeground} />
                  )}
                </Pressable>
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      color: colors.foreground,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                  value={trackCode}
                  onChangeText={setTrackCode}
                  placeholder="WC-XXXXXX"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                  textAlign="right"
                />
              </View>
            </View>

            {trackError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {trackError}
              </Text>
            ) : null}

            {trackedWC && (
              <View
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={[styles.resultName, { color: colors.foreground }]}>
                  {trackedWC.contactName}
                </Text>
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: colors.primary + "18", borderRadius: 8 },
                  ]}
                >
                  <Text style={[styles.statusText, { color: colors.primary }]}>
                    {WC_STATUS[trackedWC.status] ?? trackedWC.status}
                  </Text>
                </View>
                {trackedWC.scheduledDate && trackedWC.status !== "completed" && (
                  <View
                    style={[
                      styles.dateRow,
                      {
                        backgroundColor: colors.accent,
                        borderRadius: 8,
                      },
                    ]}
                  >
                    <Text style={[styles.dateText, { color: colors.accentForeground }]}>
                      موعد الجمع: {formatLocalDate(trackedWC.scheduledDate)}
                    </Text>
                    <Feather
                      name="calendar"
                      size={16}
                      color={colors.accentForeground}
                    />
                  </View>
                )}
                <Text style={[styles.resultAddress, { color: colors.mutedForeground }]}>
                  {trackedWC.address}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabText: { fontSize: 15 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, textAlign: "right" },
  input: { borderWidth: 1, padding: 12, fontSize: 14 },
  textarea: { height: 76, paddingTop: 10 },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: "600" },
  submitBtn: { padding: 16, alignItems: "center" },
  submitText: { fontSize: 16, fontWeight: "700" },
  successWrap: {
    padding: 28,
    alignItems: "center",
    gap: 16,
    paddingTop: 40,
  },
  successIconWrap: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successSub: { fontSize: 14 },
  codeBox: { padding: 18 },
  codeText: { fontSize: 22, fontWeight: "800", letterSpacing: 2, textAlign: "center" },
  successNote: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  trackNowBtn: { paddingHorizontal: 36, paddingVertical: 14, marginTop: 4 },
  trackNowText: { fontWeight: "700", fontSize: 15 },
  trackRow: { flexDirection: "row", gap: 10 },
  trackBtn: { width: 50, alignItems: "center", justifyContent: "center" },
  errorText: { textAlign: "right", fontSize: 14 },
  resultCard: { padding: 16, borderWidth: 1, gap: 10 },
  resultName: { fontSize: 16, fontWeight: "700", textAlign: "right" },
  statusChip: { padding: 8, alignSelf: "flex-end" },
  statusText: { fontSize: 14, fontWeight: "600" },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    justifyContent: "flex-end",
  },
  dateText: { fontSize: 14, fontWeight: "600" },
  resultAddress: { fontSize: 13, textAlign: "right" },
});
