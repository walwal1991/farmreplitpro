import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useListProducts } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { FlaskConical, Leaf, Ruler, Sprout, CheckCircle2, ShoppingCart } from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";
import { useToast } from "@/hooks/use-toast";
import type { Lang } from "@/lib/translations";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Recommendation {
  productId: number;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  quantityNeeded: number;
  frequency: string;
  note: string;
}

function buildRecommendations(
  soilType: string,
  ph: number,
  areaSqm: number,
  crop: string,
  solidProducts: ReturnType<typeof useListProducts>["data"],
  liquidProducts: ReturnType<typeof useListProducts>["data"],
  lang: Lang,
  t: (k: string) => string,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const units = areaSqm / 100;

  let solidDosePerUnit = 5;
  if (soilType === "sandy" || soilType === "rocky") solidDosePerUnit = 7;
  if (soilType === "clay") solidDosePerUnit = 4;
  if (ph < 6) solidDosePerUnit *= 1.2;
  if (ph > 7.5) solidDosePerUnit *= 0.9;
  if (["tomato", "potato", "pepper", "cucumber"].includes(crop)) solidDosePerUnit *= 1.3;
  if (["wheat", "corn"].includes(crop)) solidDosePerUnit *= 1.1;

  const solidKg = Math.ceil(solidDosePerUnit * units);

  const solidFrequency =
    ph < 6 ? t("diag_freq_3w") :
    ["tomato", "potato", "pepper"].includes(crop) ? t("diag_freq_4w") :
    t("diag_freq_6w");

  const solidNote =
    ph < 6 ? t("diag_note_acidic") :
    ph > 7.5 ? t("diag_note_alkaline") :
    t("diag_note_neutral");

  const solid = solidProducts?.[0];
  if (solid) {
    recs.push({ productId: solid.id, name: solid.name, price: solid.price, unit: solid.unit, imageUrl: solid.imageUrl, quantityNeeded: solidKg, frequency: solidFrequency, note: solidNote });
  }

  let liquidL = Math.ceil(units);
  if (["tomato", "pepper", "cucumber", "flowers"].includes(crop)) liquidL = Math.ceil(units * 1.5);

  const liquidFrequency =
    ["tomato", "pepper", "cucumber"].includes(crop) ? t("diag_freq_2w") :
    t("diag_freq_3w");

  const liquid = liquidProducts?.[0];
  if (liquid) {
    recs.push({ productId: liquid.id, name: liquid.name, price: liquid.price, unit: liquid.unit, imageUrl: liquid.imageUrl, quantityNeeded: liquidL, frequency: liquidFrequency, note: t("diag_liquid_note") });
  }

  return recs;
}

export default function SmartDiagnosis() {
  const { data: products } = useListProducts();
  const { add } = useCart();
  const { toast } = useToast();
  const { t, lang } = useLang();

  const SOIL_TYPES = [
    { value: "sandy", label: t("soil_sandy") },
    { value: "clay",  label: t("soil_clay") },
    { value: "silt",  label: t("soil_silt") },
    { value: "loam",  label: t("soil_loam") },
    { value: "rocky", label: t("soil_rocky") },
    { value: "other", label: t("soil_other") },
  ];

  const CROPS = [
    { value: "tomato",     label: t("crop_tomato") },
    { value: "potato",     label: t("crop_potato") },
    { value: "wheat",      label: t("crop_wheat") },
    { value: "corn",       label: t("crop_corn") },
    { value: "pepper",     label: t("crop_pepper") },
    { value: "cucumber",   label: t("crop_cucumber") },
    { value: "fruit_tree", label: t("crop_fruit_tree") },
    { value: "flowers",    label: t("crop_flowers") },
    { value: "lawn",       label: t("crop_lawn") },
    { value: "other",      label: t("crop_other") },
  ];

  const [soilType, setSoilType] = useState("sandy");
  const [ph, setPh] = useState("7");
  const [area, setArea] = useState("1000");
  const [crop, setCrop] = useState("tomato");
  const [submitted, setSubmitted] = useState(false);

  const solidProducts = useMemo(() => products?.filter((p) => p.category === "solid" && p.active) ?? [], [products]);
  const liquidProducts = useMemo(() => products?.filter((p) => p.category === "liquid" && p.active) ?? [], [products]);

  const recommendations = useMemo(() => {
    if (!submitted) return [];
    return buildRecommendations(soilType, parseFloat(ph) || 7, parseFloat(area) || 100, crop, solidProducts, liquidProducts, lang, t as (k: string) => string);
  }, [submitted, soilType, ph, area, crop, solidProducts, liquidProducts, lang]);

  const totalCost = useMemo(() => recommendations.reduce((s, r) => s + r.price * r.quantityNeeded, 0), [recommendations]);

  const phNum = parseFloat(ph) || 7;
  const phComment =
    phNum < 6 ? t("diag_ph_acidic") :
    phNum > 7.5 ? t("diag_ph_alkaline") :
    t("diag_ph_neutral");

  const soilLabel = SOIL_TYPES.find((s) => s.value === soilType)?.label ?? "";
  const areaNum = parseFloat(area) || 100;
  const summaryNote = `${t("diag_summary")} ${ph}. ${t("diag_summary_soil")}: ${soilLabel}. ${t("diag_summary_area")} ${areaNum} ${t("diag_summary_sqm")}. ${phComment}.`;

  const addAllToCart = () => {
    recommendations.forEach((r) => {
      for (let i = 0; i < r.quantityNeeded; i++) {
        add({ id: r.productId, name: r.name, price: r.price, unit: r.unit, weightKg: 1, imageUrl: r.imageUrl });
      }
    });
    toast({ title: t("diag_added"), description: t("diag_added_desc") });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("diag_title")}</h1>
          <p className="text-lg text-muted-foreground">{t("diag_sub")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Sprout className="w-4 h-4 text-primary" />
                    {t("diag_soil_type")}
                  </Label>
                  <select
                    value={soilType}
                    onChange={(e) => { setSoilType(e.target.value); setSubmitted(false); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SOIL_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="ph">
                    <FlaskConical className="w-4 h-4 text-primary" />
                    {t("diag_ph")}
                  </Label>
                  <Input id="ph" type="number" min="1" max="14" step="0.1" value={ph} onChange={(e) => { setPh(e.target.value); setSubmitted(false); }} dir="ltr" />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Leaf className="w-4 h-4 text-primary" />
                    {t("diag_crop")}
                  </Label>
                  <select
                    value={crop}
                    onChange={(e) => { setCrop(e.target.value); setSubmitted(false); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CROPS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="area">
                    <Ruler className="w-4 h-4 text-primary" />
                    {t("diag_area")}
                  </Label>
                  <Input id="area" type="number" min="1" value={area} onChange={(e) => { setArea(e.target.value); setSubmitted(false); }} dir="ltr" />
                </div>
              </div>

              <Button className="w-full h-12 text-base font-bold" onClick={() => setSubmitted(true)} disabled={!ph || !area || parseFloat(area) <= 0}>
                {t("diag_btn")}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {submitted && recommendations.length > 0 ? (
            <div className="rounded-2xl bg-primary text-primary-foreground p-6 space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                {t("diag_result_title")}
              </h2>

              <div className="space-y-3">
                {recommendations.map((r) => (
                  <div key={r.productId} className="bg-white/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <img src={r.imageUrl || vermicompostBag} alt={r.name} className="w-10 h-10 rounded-lg object-cover bg-white/20" />
                      <span className="font-bold text-amber-300">{r.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-white/60 text-xs">{t("diag_qty_needed")}</div>
                        <div className="font-bold">{r.quantityNeeded} {r.unit}</div>
                      </div>
                      <div>
                        <div className="text-white/60 text-xs">{t("diag_frequency")}</div>
                        <div className="font-bold">{r.frequency}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/20 pt-4 space-y-1">
                <div className="text-white/70 text-sm">{t("diag_est_cost")}</div>
                <div className="text-4xl font-extrabold tabular-nums">
                  {totalCost.toLocaleString()}
                  <span className="text-2xl ms-1">د.ج</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-3 text-sm text-white/80 leading-relaxed border-s-4 border-amber-300">
                {summaryNote}
              </div>

              <Button className="w-full h-11 font-bold bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2" onClick={addAllToCart}>
                <ShoppingCart className="w-4 h-4" />
                {t("diag_add_cart")}
              </Button>
            </div>
          ) : submitted && recommendations.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
              <p className="text-lg">{t("diag_no_products")}</p>
              <p className="text-sm mt-2">{t("diag_no_products_hint")}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
              <FlaskConical className="w-10 h-10 text-primary/40" />
              <p className="text-base">{t("diag_enter_first")}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
