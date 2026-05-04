import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const getBaseUrl = () =>
  `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}`;

interface Plan {
  id: number;
  name: string;
  name_ar: string;
  name_fr: string;
  description: string;
  description_ar: string;
  description_fr: string;
  price_per_month: number;
  fertilizer_kg: number;
  includes_tips: boolean;
  includes_plan: boolean;
  includes_consultation: boolean;
  color: string;
}

const PLAN_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  green:   { bg: "#f0fdf4", border: "#22c55e", badge: "#16a34a" },
  amber:   { bg: "#fffbeb", border: "#f59e0b", badge: "#b45309" },
  emerald: { bg: "#ecfdf5", border: "#10b981", badge: "#065f46" },
};

const WILAYA_OPTIONS = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار","البليدة","البويرة",
  "تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر","الجلفة","جيجل","سطيف","سعيدة",
  "سكيكدة","سيدي بلعباس","عنابة","قالمة","قسنطينة","المدية","مستغانم","المسيلة","معسكر",
  "ورقلة","وهران","البيض","إليزي","برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت",
  "الوادي","خنشلة","سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تيموشنت","غرداية","غليزان",
];

const CROP_OPTIONS = [
  "القمح","الشعير","الذرة","الطماطم","البطاطس","الفلفل","الباذنجان",
  "الخس","الجزر","البصل","الثوم","البطيخ","الشمام","العنب","الزيتون","التين","أشجار مثمرة","أخرى",
];

export default function SubscriptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ cropType: "", deliveryCity: "", deliveryAddress: "", notes: "" });
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [showCropPicker, setShowCropPicker] = useState(false);

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/subscription-plans`)
      .then(r => r.json())
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubscribe() {
    if (!token) { router.push("/login"); return; }
    if (!selectedPlan) return;
    if (!form.deliveryAddress.trim() || !form.deliveryCity) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-customer-token": token },
        body: JSON.stringify({ planId: selectedPlan.id, ...form, paymentMethod: "cod" }),
      });
      if (res.ok) {
        setSuccess(true);
        setSelectedPlan(null);
        setTimeout(() => setSuccess(false), 4000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const HOW_IT_WORKS = [
    { icon: "package" as const, title: "اختر خطتك", desc: "اختر الصندوق المناسب لمزرعتك" },
    { icon: "filter" as const, title: "حدد محصولك", desc: "نرسل لك السماد المناسب" },
    { icon: "truck" as const, title: "استلم كل شهر", desc: "مع نصائح زراعية مخصصة" },
    { icon: "headphones" as const, title: "دعم مستمر", desc: "فريقنا جاهز للمساعدة" },
  ];

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الاشتراك الشهري</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: "#f0fdf4", borderBottomColor: "#bbf7d0" }]}>
        <View style={[styles.heroBadge, { backgroundColor: "#dcfce7" }]}>
          <Feather name="leaf" size={14} color="#16a34a" />
          <Text style={[styles.heroBadgeText, { color: "#15803d" }]}>اشتراك شهري للفلاحين</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>صندوقك الزراعي كل شهر 📦</Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
          استلم سمادك العضوي مع نصائح زراعية مخصصة لمحصولك — مباشرةً إلى بابك
        </Text>
      </View>

      {success && (
        <View style={[styles.successBanner, { backgroundColor: "#f0fdf4", borderColor: "#22c55e" }]}>
          <Feather name="check-circle" size={20} color="#22c55e" />
          <Text style={[styles.successText, { color: "#15803d" }]}>تم الاشتراك بنجاح! سيتواصل معك فريقنا قريباً.</Text>
        </View>
      )}

      {/* Plans */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const pc = PLAN_COLORS[plan.color] ?? PLAN_COLORS.green;
            const features = [
              `${plan.fertilizer_kg} كغ سماد ديدان عضوي / شهر`,
              ...(plan.includes_tips ? ["نصائح زراعية شهرية"] : []),
              ...(plan.includes_plan ? ["خطة زراعية مخصصة"] : []),
              ...(plan.includes_consultation ? ["استشارة زراعية أولوية"] : []),
            ];
            return (
              <View key={plan.id} style={[styles.planCard, { backgroundColor: pc.bg, borderColor: pc.border }]}>
                <View style={[styles.planBadge, { backgroundColor: pc.border + "25" }]}>
                  <Text style={[styles.planBadgeText, { color: pc.badge }]}>{plan.name_ar}</Text>
                </View>
                <Text style={[styles.planDesc, { color: colors.mutedForeground }]}>{plan.description_ar}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, { color: colors.foreground }]}>
                    {plan.price_per_month.toLocaleString("ar-DZ")}
                  </Text>
                  <Text style={[styles.planPriceUnit, { color: colors.mutedForeground }]}>د.ج / شهر</Text>
                </View>
                {features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Feather name="check-circle" size={16} color="#22c55e" />
                    <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                  </View>
                ))}
                <Pressable
                  style={[styles.subscribeBtn, { backgroundColor: pc.border }]}
                  onPress={() => {
                    if (!token) { router.push("/login"); return; }
                    setSelectedPlan(plan);
                    setForm({ cropType: "", deliveryCity: "", deliveryAddress: "", notes: "" });
                  }}
                >
                  <Text style={styles.subscribeBtnText}>اشترك الآن</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* How it works */}
      <View style={[styles.howBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.howTitle, { color: colors.foreground }]}>كيف يعمل الاشتراك؟</Text>
        <View style={styles.howGrid}>
          {HOW_IT_WORKS.map((h, i) => (
            <View key={i} style={styles.howItem}>
              <View style={[styles.howIcon, { backgroundColor: "#dcfce7" }]}>
                <Feather name={h.icon} size={20} color="#16a34a" />
              </View>
              <Text style={[styles.howItemTitle, { color: colors.foreground }]}>{h.title}</Text>
              <Text style={[styles.howItemDesc, { color: colors.mutedForeground }]}>{h.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Subscription Modal */}
      <Modal visible={!!selectedPlan} animationType="slide" transparent onRequestClose={() => setSelectedPlan(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                الاشتراك في: {selectedPlan?.name_ar}
              </Text>
              <Pressable onPress={() => setSelectedPlan(null)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12 }}>
                {/* Crop picker */}
                <View>
                  <Text style={[styles.label, { color: colors.foreground }]}>نوع المحصول</Text>
                  <Pressable
                    style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => setShowCropPicker(true)}
                  >
                    <Text style={{ color: form.cropType ? colors.foreground : colors.mutedForeground, textAlign: "right" }}>
                      {form.cropType || "اختر نوع المحصول"}
                    </Text>
                    <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                {/* Wilaya picker */}
                <View>
                  <Text style={[styles.label, { color: colors.foreground }]}>الولاية *</Text>
                  <Pressable
                    style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => setShowWilayaPicker(true)}
                  >
                    <Text style={{ color: form.deliveryCity ? colors.foreground : colors.mutedForeground, textAlign: "right" }}>
                      {form.deliveryCity || "اختر الولاية"}
                    </Text>
                    <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                {/* Address */}
                <View>
                  <Text style={[styles.label, { color: colors.foreground }]}>عنوان التوصيل *</Text>
                  <TextInput
                    value={form.deliveryAddress}
                    onChangeText={t => setForm(f => ({ ...f, deliveryAddress: t }))}
                    placeholder="الحي، الشارع، رقم البيت..."
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                </View>

                {/* Notes */}
                <View>
                  <Text style={[styles.label, { color: colors.foreground }]}>ملاحظات</Text>
                  <TextInput
                    value={form.notes}
                    onChangeText={t => setForm(f => ({ ...f, notes: t }))}
                    placeholder="معلومات إضافية..."
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    numberOfLines={2}
                    style={[styles.textInput, styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  />
                </View>

                {/* Summary */}
                <View style={[styles.summaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryVal, { color: colors.foreground }]}>{selectedPlan?.price_per_month.toLocaleString()} د.ج</Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>السعر الشهري</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryVal, { color: colors.foreground }]}>{selectedPlan?.fertilizer_kg} كغ / شهر</Text>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>كمية السماد</Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.confirmBtn, { backgroundColor: colors.primary, opacity: submitting || !form.deliveryAddress || !form.deliveryCity ? 0.6 : 1 }]}
                  onPress={handleSubscribe}
                  disabled={submitting || !form.deliveryAddress.trim() || !form.deliveryCity}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.confirmBtnText}>تأكيد الاشتراك</Text>
                  }
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Wilaya picker modal */}
        <Modal visible={showWilayaPicker} animationType="slide" transparent onRequestClose={() => setShowWilayaPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>اختر الولاية</Text>
              <ScrollView>
                {WILAYA_OPTIONS.map(w => (
                  <Pressable key={w} style={[styles.pickerOption, { borderBottomColor: colors.border }]}
                    onPress={() => { setForm(f => ({ ...f, deliveryCity: w })); setShowWilayaPicker(false); }}>
                    <Text style={[styles.pickerOptionText, { color: colors.foreground }]}>{w}</Text>
                    {form.deliveryCity === w && <Feather name="check" size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Crop picker modal */}
        <Modal visible={showCropPicker} animationType="slide" transparent onRequestClose={() => setShowCropPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>اختر نوع المحصول</Text>
              <ScrollView>
                {CROP_OPTIONS.map(c => (
                  <Pressable key={c} style={[styles.pickerOption, { borderBottomColor: colors.border }]}
                    onPress={() => { setForm(f => ({ ...f, cropType: c })); setShowCropPicker(false); }}>
                    <Text style={[styles.pickerOptionText, { color: colors.foreground }]}>{c}</Text>
                    {form.cropType === c && <Feather name="check" size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  hero: { padding: 24, borderBottomWidth: 1, alignItems: "center", gap: 10 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { fontSize: 13, fontWeight: "600" },
  heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  heroSub: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  successText: { flex: 1, fontSize: 14, fontWeight: "600", textAlign: "right" },
  plansContainer: { padding: 16, gap: 14 },
  planCard: { borderWidth: 2, borderRadius: 20, padding: 20, gap: 10 },
  planBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  planBadgeText: { fontSize: 13, fontWeight: "700" },
  planDesc: { fontSize: 13, lineHeight: 20, textAlign: "right" },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  planPrice: { fontSize: 36, fontWeight: "800" },
  planPriceUnit: { fontSize: 14, marginBottom: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13 },
  subscribeBtn: { padding: 14, borderRadius: 14, alignItems: "center", marginTop: 4 },
  subscribeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  howBlock: { margin: 16, borderRadius: 20, borderWidth: 1, padding: 20 },
  howTitle: { fontSize: 17, fontWeight: "700", textAlign: "center", marginBottom: 16 },
  howGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  howItem: { width: "45%", alignItems: "center", gap: 6 },
  howIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  howItemTitle: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  howItemDesc: { fontSize: 11, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%", gap: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "right" },
  label: { fontSize: 13, fontWeight: "600", textAlign: "right", marginBottom: 6 },
  picker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, padding: 14 },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, textAlign: "right" },
  textArea: { height: 80, textAlignVertical: "top" },
  summaryBox: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13 },
  summaryVal: { fontSize: 13, fontWeight: "700" },
  confirmBtn: { padding: 16, borderRadius: 14, alignItems: "center" },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pickerModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "60%", padding: 16 },
  pickerTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  pickerOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1 },
  pickerOptionText: { fontSize: 14, textAlign: "right" },
});
