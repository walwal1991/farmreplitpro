import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  { icon: "layers" as const, n: "1", title: "قياس الجرعة المناسبة", body: "استخدم 100-200 غرام لكل متر مربع من التربة في الزراعة العادية، أو 500 غرام لكل شجرة مثمرة." },
  { icon: "wind" as const, n: "2", title: "خلط السماد بالتربة", body: "وزّع السماد بشكل منتظم ثم اخلطه بالتربة على عمق 5 إلى 10 سم لضمان توزيع المغذيات." },
  { icon: "droplet" as const, n: "3", title: "الري بعد التسميد", body: "اسقِ التربة فور التسميد لتنشيط الكائنات الحية الدقيقة ومساعدة النبات على امتصاص العناصر الغذائية." },
  { icon: "calendar" as const, n: "4", title: "التكرار الموسمي", body: "كرّر عملية التسميد كل 4 إلى 6 أسابيع خلال موسم النمو للحصول على أفضل النتائج." },
];

const CROPS = [
  { icon: "sun" as const, name: "أشجار الفاكهة", dose: "500 غرام / شجرة — كل 6 أسابيع" },
  { icon: "star" as const, name: "الزهور والنباتات الزينة", dose: "100 غرام / م² — كل 4 أسابيع" },
  { icon: "activity" as const, name: "الخضروات الورقية", dose: "150 غرام / م² — كل 3 أسابيع" },
  { icon: "grid" as const, name: "المحاصيل الحقلية", dose: "200 غرام / م² — كل 6 أسابيع" },
];

const TEA_STEPS = [
  "أضف 200 غرام من سماد الديدان إلى 5 لترات ماء.",
  "حرّك جيداً ثم اتركه 24 ساعة في مكان دافئ.",
  "صفّ السائل وأضفه مخففاً (1:5) مباشرةً على التربة أو الأوراق.",
];

const SAFETY = [
  "خزّن السماد في مكان جاف وبارد بعيداً عن أشعة الشمس.",
  "أغلق الكيس جيداً بعد الاستعمال للحفاظ على الرطوبة.",
  "السماد آمن تماماً — لا توجد مواد كيماوية.",
  "لا فترة انتظار قبل الحصاد — يمكن تطبيقه حتى أيام قبل القطف.",
];

export default function GuideScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>دليل الاستعمال</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <View style={[styles.heroBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <Feather name="book-open" size={14} color="#fff" />
          <Text style={styles.heroBadgeText}>دليل الاستعمال</Text>
        </View>
        <Text style={styles.heroTitle}>كيف تستخدم سماد الديدان؟</Text>
        <Text style={styles.heroSub}>4 خطوات بسيطة لأفضل النتائج</Text>
      </View>

      {/* Steps */}
      <View style={styles.section}>
        {STEPS.map((s) => (
          <View key={s.n} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.stepNum, { backgroundColor: colors.primary + "15" }]}>
              <Feather name={s.icon} size={20} color={colors.primary} />
              <Text style={[styles.stepNumText, { color: colors.primary }]}>{s.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>{s.title}</Text>
              <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{s.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Dosage per crop */}
      <View style={[styles.sectionBlock, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الجرعة حسب نوع المحصول</Text>
        <View style={styles.cropsGrid}>
          {CROPS.map((c) => (
            <View key={c.name} style={[styles.cropCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.cropIcon, { backgroundColor: colors.primary + "12" }]}>
                <Feather name={c.icon} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.cropName, { color: colors.foreground }]}>{c.name}</Text>
              <Text style={[styles.cropDose, { color: colors.mutedForeground }]}>{c.dose}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Worm tea */}
      <View style={styles.section}>
        <View style={[styles.teaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.teaHeader}>
            <View style={[styles.teaIconWrap, { backgroundColor: "#dbeafe" }]}>
              <Feather name="droplet" size={22} color="#2563eb" />
            </View>
            <Text style={[styles.teaTitle, { color: colors.foreground }]}>شاي الديدان (السائل)</Text>
          </View>
          {TEA_STEPS.map((s, i) => (
            <View key={i} style={styles.teaStep}>
              <View style={[styles.teaStepNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.teaStepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.teaStepText, { color: colors.foreground }]}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Safety */}
      <View style={styles.section}>
        <View style={[styles.safetyCard, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
          <View style={styles.safetyHeader}>
            <Feather name="shield" size={22} color="#16a34a" />
            <Text style={[styles.safetyTitle, { color: "#15803d" }]}>نصائح للسلامة والتخزين</Text>
          </View>
          {SAFETY.map((s, i) => (
            <View key={i} style={styles.safetyRow}>
              <Feather name="check-circle" size={16} color="#22c55e" />
              <Text style={[styles.safetyText, { color: "#166534" }]}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <Pressable
        style={[styles.ctaBtn, { backgroundColor: colors.primary, marginHorizontal: 16 }]}
        onPress={() => router.push("/consultation")}
      >
        <Feather name="message-circle" size={18} color="#fff" />
        <Text style={styles.ctaBtnText}>احصل على استشارة مجانية</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  hero: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    paddingTop: 28,
    overflow: "hidden",
    position: "relative",
  },
  heroCircle1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)", top: -60, left: -60,
  },
  heroCircle2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)", bottom: -30, right: -20,
  },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    alignSelf: "flex-start", marginBottom: 12,
  },
  heroBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "right", marginBottom: 6 },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 14, textAlign: "right" },
  section: { padding: 16, gap: 12 },
  stepCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center", gap: 2,
  },
  stepNumText: { fontSize: 11, fontWeight: "800" },
  stepTitle: { fontSize: 15, fontWeight: "700", textAlign: "right", marginBottom: 4 },
  stepBody: { fontSize: 13, lineHeight: 20, textAlign: "right" },
  sectionBlock: {
    borderTopWidth: 1, borderBottomWidth: 1,
    padding: 20, marginVertical: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", textAlign: "right", marginBottom: 16 },
  cropsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cropCard: {
    width: "47%", borderRadius: 14, borderWidth: 1,
    padding: 14, alignItems: "center", gap: 8,
  },
  cropIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  cropName: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  cropDose: { fontSize: 11, textAlign: "center" },
  teaCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  teaHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  teaIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  teaTitle: { fontSize: 16, fontWeight: "700" },
  teaStep: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  teaStepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 1 },
  teaStepNumText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  teaStepText: { flex: 1, fontSize: 13, lineHeight: 20, textAlign: "right" },
  safetyCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  safetyHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  safetyTitle: { fontSize: 16, fontWeight: "700" },
  safetyRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  safetyText: { flex: 1, fontSize: 13, lineHeight: 20, textAlign: "right" },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, padding: 16, borderRadius: 16,
  },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
