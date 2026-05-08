import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "@tanstack/react-query";
import { api, type Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";

const SOIL_TYPES = [
  { value: "sandy", label: "رملية" },
  { value: "clay",  label: "طينية" },
  { value: "silt",  label: "طميية" },
  { value: "loam",  label: "لومية" },
  { value: "rocky", label: "صخرية" },
  { value: "other", label: "أخرى" },
];

const CROPS = [
  { value: "tomato",     label: "طماطم" },
  { value: "potato",     label: "بطاطس" },
  { value: "wheat",      label: "قمح" },
  { value: "corn",       label: "ذرة" },
  { value: "pepper",     label: "فلفل" },
  { value: "cucumber",   label: "خيار" },
  { value: "fruit_tree", label: "أشجار فاكهة" },
  { value: "flowers",    label: "زهور" },
  { value: "lawn",       label: "عشب" },
  { value: "other",      label: "أخرى" },
];

interface Rec {
  productId: number;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  quantityNeeded: number;
  frequency: string;
  note: string;
}

interface IrrigationPlan {
  waterPerSqm: number;
  freqDays: number;
  bestTime: string;
  method: string;
  methodIcon: string;
  monthlyTotal: number;
  totalPerSession: number;
  tips: string[];
}

function calcIrrigation(soilType: string, crop: string, area: number): IrrigationPlan {
  let waterPerSqm = 4;
  if (soilType === "sandy" || soilType === "rocky") waterPerSqm = 6;
  else if (soilType === "clay") waterPerSqm = 3;
  else if (soilType === "silt") waterPerSqm = 4.5;

  if (["tomato", "cucumber", "pepper"].includes(crop)) waterPerSqm *= 1.4;
  else if (crop === "potato") waterPerSqm *= 1.2;
  else if (crop === "fruit_tree") waterPerSqm *= 0.85;

  let freqDays = 3;
  if (soilType === "sandy" || soilType === "rocky") freqDays = 2;
  else if (soilType === "clay") freqDays = 6;
  else if (soilType === "silt") freqDays = 4;
  if (["tomato", "cucumber", "pepper"].includes(crop)) freqDays = Math.max(1, freqDays - 1);
  if (crop === "fruit_tree") freqDays += 2;

  const bestTime = "الصباح (7–10 ص)";

  let method = "بالغمر (فيضاني)";
  let methodIcon = "🌊";
  if (["tomato", "cucumber", "pepper", "flowers"].includes(crop) || soilType === "sandy") {
    method = "بالتنقيط (Drip)"; methodIcon = "💧";
  } else if (["wheat", "corn", "lawn"].includes(crop)) {
    method = "بالرش (Sprinkler)"; methodIcon = "🚿";
  } else if (crop === "fruit_tree") {
    method = "بالتنقيط أو الحوض"; methodIcon = "🌳";
  }

  const tips: string[] = ["✅ ظروف الريّ مثالية — التزم بالجدول المقترح للحصول على أفضل نتيجة."];
  const sessionsPerMonth = Math.round(30 / freqDays);
  const monthlyTotal = Math.round(waterPerSqm * area * sessionsPerMonth);
  const totalPerSession = Math.round(waterPerSqm * area);

  return {
    waterPerSqm: Math.round(waterPerSqm * 10) / 10,
    freqDays,
    bestTime,
    method,
    methodIcon,
    monthlyTotal,
    totalPerSession,
    tips,
  };
}

function buildRecs(soilType: string, ph: number, area: number, crop: string, products: Product[]): Rec[] {
  const recs: Rec[] = [];
  const units = area / 100;
  let dose = 5;
  if (soilType === "sandy" || soilType === "rocky") dose = 7;
  if (soilType === "clay") dose = 4;
  if (ph < 6) dose *= 1.2;
  if (ph > 7.5) dose *= 0.9;
  if (["tomato", "potato", "pepper", "cucumber"].includes(crop)) dose *= 1.3;
  if (["wheat", "corn"].includes(crop)) dose *= 1.1;
  const solidKg = Math.ceil(dose * units);

  const freq1 = ph < 6 ? "كل 3 أسابيع" : ["tomato", "potato", "pepper"].includes(crop) ? "كل 4 أسابيع" : "كل 6 أسابيع";
  const note1 = ph < 6 ? "التربة حمضية — زِد الجرعة قليلاً وراقب مستوى pH" : ph > 7.5 ? "التربة قلوية — استخدم الجرعة المقترحة مع ري منتظم" : "pH مثالي — ظروف ممتازة للامتصاص";

  const solid = products.find(p => p.category === "solid" && p.active);
  if (solid) recs.push({ productId: solid.id, name: solid.name, price: solid.price, unit: solid.unit, imageUrl: solid.imageUrl, quantityNeeded: solidKg, frequency: freq1, note: note1 });

  let liquidL = Math.ceil(units);
  if (["tomato", "pepper", "cucumber", "flowers"].includes(crop)) liquidL = Math.ceil(units * 1.5);
  const freq2 = ["tomato", "pepper", "cucumber"].includes(crop) ? "كل أسبوعين" : "كل 3 أسابيع";

  const liquid = products.find(p => p.category === "liquid" && p.active);
  if (liquid) recs.push({ productId: liquid.id, name: liquid.name, price: liquid.price, unit: liquid.unit, imageUrl: liquid.imageUrl, quantityNeeded: liquidL, frequency: freq2, note: "السماد السائل يُرش مباشرةً على الأوراق أو يُضاف لماء الري" });

  return recs;
}

export default function DiagnosisScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();

  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: api.products.list });

  const [soilType, setSoilType] = useState("sandy");
  const [ph, setPh] = useState("7");
  const [area, setArea] = useState("1000");
  const [crop, setCrop] = useState("tomato");
  const [submitted, setSubmitted] = useState(false);
  const [added, setAdded] = useState(false);

  const recs = useMemo(() => {
    if (!submitted) return [];
    return buildRecs(soilType, parseFloat(ph) || 7, parseFloat(area) || 100, crop, products);
  }, [submitted, soilType, ph, area, crop, products]);

  const irrigation = useMemo(
    () => calcIrrigation(soilType, crop, parseFloat(area) || 100),
    [soilType, crop, area]
  );

  const totalCost = recs.reduce((s, r) => s + r.price * r.quantityNeeded, 0);

  const phNum = parseFloat(ph) || 7;
  const phStatus = phNum < 6 ? { label: "حمضية", color: "#ef4444" } : phNum > 7.5 ? { label: "قلوية", color: "#f59e0b" } : { label: "مثالية ✓", color: "#22c55e" };

  function handleAddAll() {
    recs.forEach(r => {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost";
      const imgUri = r.imageUrl.startsWith("http") ? r.imageUrl : `https://${domain}${r.imageUrl}`;
      for (let i = 0; i < Math.min(r.quantityNeeded, 10); i++) {
        addItem({ productId: r.productId, name: r.name, price: r.price, unit: r.unit, imageUrl: imgUri });
      }
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>التشخيص الذكي للتربة</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.heroBanner, { backgroundColor: colors.primary + "12", borderBottomColor: colors.primary + "30" }]}>
        <Feather name="cpu" size={28} color={colors.primary} />
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>التشخيص الذكي للتربة</Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>أدخل بيانات تربتك واحصل على توصية دقيقة بالمنتج والكمية</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Soil type */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>نوع التربة</Text>
          <View style={styles.chipRow}>
            {SOIL_TYPES.map(s => (
              <Pressable
                key={s.value}
                style={[styles.chip, { borderColor: soilType === s.value ? colors.primary : colors.border, backgroundColor: soilType === s.value ? colors.primary + "15" : colors.card }]}
                onPress={() => { setSoilType(s.value); setSubmitted(false); }}
              >
                <Text style={[styles.chipText, { color: soilType === s.value ? colors.primary : colors.mutedForeground }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* pH */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <View style={[styles.phBadge, { backgroundColor: phStatus.color + "20" }]}>
              <Text style={[styles.phBadgeText, { color: phStatus.color }]}>{phStatus.label}</Text>
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>مستوى pH</Text>
          </View>
          <TextInput
            value={ph}
            onChangeText={t => { setPh(t); setSubmitted(false); }}
            placeholder="6.5 - 7.5 مثالي"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          />
        </View>

        {/* Area */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>المساحة (م²)</Text>
          <TextInput
            value={area}
            onChangeText={t => { setArea(t); setSubmitted(false); }}
            placeholder="مثال: 1000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          />
        </View>

        {/* Crop */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>نوع المحصول</Text>
          <View style={styles.chipRow}>
            {CROPS.map(c => (
              <Pressable
                key={c.value}
                style={[styles.chip, { borderColor: crop === c.value ? colors.primary : colors.border, backgroundColor: crop === c.value ? colors.primary + "15" : colors.card }]}
                onPress={() => { setCrop(c.value); setSubmitted(false); }}
              >
                <Text style={[styles.chipText, { color: crop === c.value ? colors.primary : colors.mutedForeground }]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.diagnoseBtn, { backgroundColor: colors.primary }]}
          onPress={() => setSubmitted(true)}
        >
          <Feather name="zap" size={18} color="#fff" />
          <Text style={styles.diagnoseBtnText}>احصل على التوصية</Text>
        </Pressable>
      </View>

      {submitted && recs.length > 0 && (
        <View style={styles.recsContainer}>
          <Text style={[styles.recsTitle, { color: colors.foreground }]}>التوصية المخصصة لتربتك</Text>
          {recs.map(r => (
            <View key={r.productId} style={[styles.recCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
              <View style={styles.recHeader}>
                <View style={[styles.recBadge, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.recBadgeText, { color: colors.primary }]}>{r.quantityNeeded} {r.unit}</Text>
                </View>
                <Text style={[styles.recName, { color: colors.foreground }]}>{r.name}</Text>
              </View>
              <View style={styles.recMeta}>
                <View style={styles.recMetaItem}>
                  <Feather name="calendar" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.recMetaText, { color: colors.mutedForeground }]}>{r.frequency}</Text>
                </View>
                <View style={styles.recMetaItem}>
                  <Feather name="dollar-sign" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.recMetaText, { color: colors.mutedForeground }]}>{(r.price * r.quantityNeeded).toLocaleString()} د.ج</Text>
                </View>
              </View>
              <Text style={[styles.recNote, { color: colors.mutedForeground, backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>{r.note}</Text>
            </View>
          ))}

          <View style={[styles.totalRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.totalVal, { color: colors.primary }]}>{totalCost.toLocaleString()} د.ج</Text>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>التكلفة الإجمالية المقدّرة</Text>
          </View>

          <Pressable
            style={[styles.addAllBtn, { backgroundColor: added ? "#22c55e" : colors.primary }]}
            onPress={handleAddAll}
          >
            <Feather name={added ? "check" : "shopping-bag"} size={18} color="#fff" />
            <Text style={styles.addAllBtnText}>{added ? "تمت الإضافة إلى السلة" : "أضف الكل إلى السلة"}</Text>
          </Pressable>
        </View>
      )}

      {submitted && recs.length === 0 && (
        <View style={styles.noProductsBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.noProductsText, { color: colors.mutedForeground }]}>لا توجد منتجات متاحة حالياً</Text>
        </View>
      )}

      {/* ── Irrigation System ───────────────────────────────── */}
      {submitted && (
        <View style={styles.irrigationContainer}>
          <View style={styles.irrigationHeader}>
            <Text style={styles.irrigationHeaderIcon}>💧</Text>
            <Text style={[styles.irrigationTitle, { color: "#1e40af" }]}>نظام الريّ الذكي</Text>
          </View>

          <View style={styles.irrigationGrid}>
            {[
              { icon: "💧", label: "كمية الريّ (لكل م²)", value: `${irrigation.waterPerSqm} لتر` },
              { icon: "📅", label: "تكرار الريّ", value: `كل ${irrigation.freqDays} يوم` },
              { icon: "⏰", label: "أفضل وقت", value: irrigation.bestTime },
              { icon: irrigation.methodIcon, label: "طريقة الريّ", value: irrigation.method },
            ].map(({ icon, label, value }) => (
              <View key={label} style={styles.irrigationCard}>
                <Text style={styles.irrigationCardIcon}>{icon}</Text>
                <Text style={styles.irrigationCardLabel}>{label}</Text>
                <Text style={[styles.irrigationCardValue, { color: "#1e40af" }]}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.irrigationSummary}>
            <View style={styles.irrigationSummaryHalf}>
              <Text style={styles.irrigationSummaryLabel}>إجمالي المياه / شهر</Text>
              <Text style={styles.irrigationSummaryVal}>
                {irrigation.monthlyTotal.toLocaleString()}
                <Text style={styles.irrigationSummaryUnit}> لتر</Text>
              </Text>
            </View>
            <View style={[styles.irrigationSummaryHalf, styles.irrigationSummaryRight]}>
              <Text style={styles.irrigationSummaryLabel}>كل جلسة ريّ</Text>
              <Text style={styles.irrigationSummaryVal}>
                {irrigation.totalPerSession.toLocaleString()}
                <Text style={styles.irrigationSummaryUnit}> لتر</Text>
              </Text>
            </View>
          </View>

          {irrigation.tips.map((tip, i) => (
            <View key={i} style={styles.irrigationTip}>
              <Text style={styles.irrigationTipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  heroBanner: { alignItems: "center", padding: 24, gap: 10, borderBottomWidth: 1 },
  heroTitle: { fontSize: 20, fontWeight: "800" },
  heroSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  formContainer: { padding: 16, gap: 16 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "700", textAlign: "right" },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  phBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  phBadgeText: { fontSize: 12, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: "600" },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, textAlign: "right" },
  diagnoseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 16, marginTop: 8 },
  diagnoseBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  recsContainer: { padding: 16, gap: 12 },
  recsTitle: { fontSize: 17, fontWeight: "700", textAlign: "right", marginBottom: 4 },
  recCard: { borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 10 },
  recHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  recBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  recBadgeText: { fontSize: 13, fontWeight: "800" },
  recName: { fontSize: 15, fontWeight: "700", flex: 1, textAlign: "right" },
  recMeta: { flexDirection: "row", gap: 16, justifyContent: "flex-end" },
  recMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  recMetaText: { fontSize: 12 },
  recNote: { fontSize: 12, lineHeight: 18, textAlign: "right", padding: 10, borderRadius: 10, borderWidth: 1 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 14, borderWidth: 1 },
  totalLabel: { fontSize: 13 },
  totalVal: { fontSize: 20, fontWeight: "800" },
  addAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 16 },
  addAllBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  noProductsBox: { alignItems: "center", padding: 32, gap: 12 },
  noProductsText: { fontSize: 14 },
  irrigationContainer: { margin: 16, marginTop: 4, backgroundColor: "#eff6ff", borderRadius: 20, borderWidth: 1.5, borderColor: "#bfdbfe", padding: 16, gap: 12 },
  irrigationHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  irrigationHeaderIcon: { fontSize: 20 },
  irrigationTitle: { fontSize: 16, fontWeight: "800" },
  irrigationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  irrigationCard: { width: "47%", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#bfdbfe", padding: 12, gap: 4 },
  irrigationCardIcon: { fontSize: 18 },
  irrigationCardLabel: { fontSize: 10, color: "#64748b" },
  irrigationCardValue: { fontSize: 12, fontWeight: "700" },
  irrigationSummary: { backgroundColor: "#2563eb", borderRadius: 14, padding: 14, flexDirection: "row" },
  irrigationSummaryHalf: { flex: 1 },
  irrigationSummaryRight: { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.25)", paddingRight: 14, marginRight: 14 },
  irrigationSummaryLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  irrigationSummaryVal: { color: "#fff", fontSize: 22, fontWeight: "800" },
  irrigationSummaryUnit: { fontSize: 13, fontWeight: "400" },
  irrigationTip: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 12, borderWidth: 1, borderColor: "#bfdbfe", padding: 10 },
  irrigationTipText: { fontSize: 12, color: "#1e40af", lineHeight: 18, textAlign: "right" },
});
