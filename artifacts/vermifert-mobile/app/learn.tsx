import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const getBaseUrl = () =>
  `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}`;

const FARM_STEPS = [
  { icon: "map-pin" as const, title: "اختيار الموقع المناسب", desc: "اختر مكاناً في الظل الجزئي بعيداً عن الشمس المباشرة مع تهوية جيدة." },
  { icon: "box" as const, title: "تحضير الحاوية", desc: "استخدم صناديق بلاستيكية أو خشبية بفتحات سفلية لتصريف السوائل." },
  { icon: "layers" as const, title: "طبقة القاعدة", desc: "ضع طبقة أولى من الورق المبلل أو الكرتون في قاع الحاوية." },
  { icon: "zap" as const, title: "إضافة الديدان", desc: "أضف ديدان Eisenia fetida — 500 غرام لكل متر مربع كمية ابتداء." },
  { icon: "sun" as const, title: "التغذية الأولى", desc: "ابدأ بمخلفات الخضار والفاكهة. تجنب اللحوم، الزيوت، والأطعمة الحارة." },
  { icon: "heart" as const, title: "المتابعة الدورية", desc: "أضف الغذاء كل يومين وتحقق من الرطوبة — يجب أن تكون كالإسفنجة المبللة." },
  { icon: "package" as const, title: "الحصاد", desc: "بعد 60-90 يوماً يمكن حصاد السماد الناضج ذي اللون الداكن والرائحة الترابية." },
];

const COURSES = [
  {
    id: "beginner",
    title: "مربي الديدان المبتدئ",
    level: "مبتدئ",
    duration: "4 أسابيع",
    mode: "أونلاين",
    price: "مجاني",
    desc: "تعلم أساسيات تربية الديدان وإنتاج السماد العضوي من الصفر بخطوات مبسطة.",
    isFree: true,
    color: "#22c55e",
    bgColor: "#f0fdf4",
  },
  {
    id: "intermediate",
    title: "الإنتاج التجاري للسماد",
    level: "متوسط",
    duration: "6 أسابيع",
    mode: "حضوري",
    price: "5,000 د.ج",
    desc: "توسيع الإنتاج لأغراض تجارية مع معرفة معايير الجودة والتسويق.",
    isFree: false,
    color: "#f59e0b",
    bgColor: "#fffbeb",
  },
  {
    id: "workshop",
    title: "ورشة التطبيق الحقلي",
    level: "متقدم",
    duration: "3 أيام",
    mode: "حضوري",
    price: "8,000 د.ج",
    desc: "ورشة ميدانية في المزرعة لتطبيق أفضل الممارسات وحل المشاكل الشائعة.",
    isFree: false,
    color: "#3b82f6",
    bgColor: "#eff6ff",
  },
  {
    id: "professional",
    title: "شهادة المحترف الزراعي",
    level: "متقدم",
    duration: "3 أشهر",
    mode: "هجين",
    price: "20,000 د.ج",
    desc: "برنامج متكامل ينتهي بشهادة معتمدة لمن يريد الاحتراف في هذا المجال.",
    isFree: false,
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
  },
];

export default function LearnScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollName, setEnrollName] = useState(user?.name ?? "");
  const [enrollPhone, setEnrollPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleEnroll(courseId: string) {
    if (!enrollName.trim() || !enrollPhone.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${getBaseUrl()}/api/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: enrollName.trim(), phone: enrollPhone.trim(), courseId }),
      });
      if (!res.ok) throw new Error("فشل في التسجيل");
      setSuccessId(courseId);
      setEnrollingId(null);
    } catch {
      setError("حدث خطأ أثناء التسجيل، يرجى المحاولة مجدداً.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>التعليم والتكوين</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: colors.primary + "10", borderBottomColor: colors.primary + "25" }]}>
        <View style={[styles.heroBadge, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="award" size={14} color={colors.primary} />
          <Text style={[styles.heroBadgeText, { color: colors.primary }]}>التعليم والتكوين</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>تعلم زراعة سماد الديدان</Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
          من مزرعة المنزل إلى الإنتاج التجاري — رحلتك تبدأ هنا
        </Text>
      </View>

      {/* Farm steps */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>خطوات إنشاء مزرعة الديدان</Text>
        <View style={{ gap: 10 }}>
          {FARM_STEPS.map((s, i) => (
            <View key={i} style={[styles.farmStep, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.farmStepIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={s.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.farmStepTitleRow}>
                  <View style={[styles.stepNumBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.farmStepTitle, { color: colors.foreground }]}>{s.title}</Text>
                </View>
                <Text style={[styles.farmStepDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tip */}
        <View style={[styles.tipBox, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
          <Feather name="zap" size={18} color="#d97706" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: "#92400e" }]}>نصيحة ذهبية</Text>
            <Text style={[styles.tipDesc, { color: "#b45309" }]}>
              ابدأ بكمية صغيرة من الديدان (0.5 كغ) وزِدها تدريجياً كلما اعتدت على الديدان وفهمت احتياجاتها.
            </Text>
          </View>
        </View>
      </View>

      {/* Courses */}
      <View style={[styles.coursesSection, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>الدورات التدريبية</Text>
        <View style={{ gap: 14 }}>
          {COURSES.map(course => {
            const isSuccess = successId === course.id;
            const isEnrolling = enrollingId === course.id;
            return (
              <View key={course.id} style={[styles.courseCard, { backgroundColor: course.bgColor, borderColor: course.color + "60" }]}>
                <View style={styles.courseBadges}>
                  <View style={[styles.badge, { backgroundColor: course.isFree ? "#dcfce7" : "#fef9c3" }]}>
                    <Feather name="check" size={11} color={course.isFree ? "#16a34a" : "#b45309"} />
                    <Text style={[styles.badgeText, { color: course.isFree ? "#15803d" : "#92400e" }]}>{course.price}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: "#f1f5f9" }]}>
                    <Feather name={course.mode === "أونلاين" ? "monitor" : "map-pin"} size={11} color="#475569" />
                    <Text style={[styles.badgeText, { color: "#475569" }]}>{course.mode}</Text>
                  </View>
                </View>
                <Text style={[styles.courseTitle, { color: "#1e293b" }]}>{course.title}</Text>
                <Text style={[styles.courseDesc, { color: "#64748b" }]}>{course.desc}</Text>
                <View style={styles.courseMeta}>
                  <View style={styles.courseMetaItem}>
                    <Feather name="clock" size={13} color={course.color} />
                    <Text style={[styles.courseMetaText, { color: "#475569" }]}>{course.duration}</Text>
                  </View>
                  <View style={styles.courseMetaItem}>
                    <Feather name="users" size={13} color={course.color} />
                    <Text style={[styles.courseMetaText, { color: "#475569" }]}>{course.level}</Text>
                  </View>
                </View>

                {isSuccess ? (
                  <View style={[styles.successRow, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
                    <Feather name="check-circle" size={16} color="#22c55e" />
                    <Text style={[styles.successText, { color: "#15803d" }]}>تم التسجيل! سيتواصل معك فريقنا قريباً.</Text>
                  </View>
                ) : isEnrolling ? (
                  <View style={[styles.enrollForm, { backgroundColor: "#fff", borderColor: "#e2e8f0" }]}>
                    <TextInput
                      value={enrollName}
                      onChangeText={setEnrollName}
                      placeholder="اسمك الكامل"
                      placeholderTextColor="#94a3b8"
                      style={[styles.enrollInput, { borderColor: "#e2e8f0" }]}
                      editable={!user}
                    />
                    <TextInput
                      value={enrollPhone}
                      onChangeText={setEnrollPhone}
                      placeholder="رقم هاتفك"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      style={[styles.enrollInput, { borderColor: "#e2e8f0" }]}
                      editable={!user}
                    />
                    {error ? <Text style={{ color: "#ef4444", fontSize: 12, textAlign: "right" }}>{error}</Text> : null}
                    <View style={styles.enrollBtns}>
                      <Pressable
                        style={[styles.cancelBtn, { borderColor: "#e2e8f0" }]}
                        onPress={() => { setEnrollingId(null); setError(""); }}
                      >
                        <Text style={{ color: "#64748b", fontSize: 14 }}>إلغاء</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.submitBtn, { backgroundColor: course.color, opacity: submitting ? 0.7 : 1 }]}
                        onPress={() => handleEnroll(course.id)}
                        disabled={submitting}
                      >
                        {submitting
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.submitBtnText}>تأكيد التسجيل</Text>
                        }
                      </Pressable>
                    </View>
                  </View>
                ) : course.isFree ? (
                  <Pressable
                    style={[styles.enrollBtn, { backgroundColor: course.color }]}
                    onPress={() => { setEnrollingId(course.id); setError(""); }}
                  >
                    <Feather name="award" size={16} color="#fff" />
                    <Text style={styles.enrollBtnText}>سجّل مجاناً</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.contactBtn, { borderColor: course.color + "50", backgroundColor: "#fff" }]}
                    onPress={() => router.push("/consultation")}
                  >
                    <Feather name="message-circle" size={16} color={course.color} />
                    <Text style={[styles.contactBtnText, { color: course.color }]}>تواصل معنا</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* CTA */}
      <Pressable
        style={[styles.ctaBtn, { backgroundColor: colors.primary, margin: 16 }]}
        onPress={() => router.push("/consultation")}
      >
        <Feather name="message-circle" size={18} color="#fff" />
        <Text style={styles.ctaBtnText}>لديك سؤال؟ تواصل مع فريقنا</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  hero: { alignItems: "center", padding: 24, gap: 10, borderBottomWidth: 1 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { fontSize: 13, fontWeight: "600" },
  heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  heroSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", textAlign: "right", marginBottom: 4 },
  farmStep: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  farmStepIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  farmStepTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  stepNumBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  farmStepTitle: { fontSize: 14, fontWeight: "700", flex: 1, textAlign: "right" },
  farmStepDesc: { fontSize: 12, lineHeight: 18, textAlign: "right" },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  tipTitle: { fontSize: 13, fontWeight: "700", textAlign: "right", marginBottom: 3 },
  tipDesc: { fontSize: 12, lineHeight: 18, textAlign: "right" },
  coursesSection: { borderTopWidth: 1, borderBottomWidth: 1, padding: 16, gap: 12 },
  courseCard: { borderWidth: 1.5, borderRadius: 18, padding: 16, gap: 10 },
  courseBadges: { flexDirection: "row", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  courseTitle: { fontSize: 16, fontWeight: "700", textAlign: "right" },
  courseDesc: { fontSize: 13, lineHeight: 19, textAlign: "right" },
  courseMeta: { flexDirection: "row", gap: 16, justifyContent: "flex-end" },
  courseMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  courseMetaText: { fontSize: 12 },
  enrollBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12 },
  enrollBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  contactBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  contactBtnText: { fontSize: 14, fontWeight: "700" },
  successRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  successText: { fontSize: 13, flex: 1, textAlign: "right" },
  enrollForm: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  enrollInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, textAlign: "right" },
  enrollBtns: { flexDirection: "row", gap: 8 },
  cancelBtn: { flex: 1, alignItems: "center", padding: 11, borderRadius: 10, borderWidth: 1 },
  submitBtn: { flex: 2, alignItems: "center", padding: 11, borderRadius: 10 },
  submitBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 16 },
  ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
