import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useListProducts } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useCart } from "@/lib/cart";
import { FlaskConical, Leaf, Ruler, Sprout, CheckCircle2, ShoppingCart } from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";
import { useToast } from "@/hooks/use-toast";

const SOIL_TYPES = [
  { value: "sandy", label: "رملية" },
  { value: "clay", label: "طينية" },
  { value: "silt", label: "طمية" },
  { value: "loam", label: "طينية رملية" },
  { value: "rocky", label: "صخرية" },
  { value: "other", label: "أخرى" },
];

const CROPS = [
  { value: "tomato", label: "طماطم" },
  { value: "potato", label: "بطاطس" },
  { value: "wheat", label: "قمح" },
  { value: "corn", label: "ذرة" },
  { value: "pepper", label: "فلفل" },
  { value: "cucumber", label: "خيار" },
  { value: "fruit_tree", label: "أشجار مثمرة" },
  { value: "flowers", label: "زهور وزينة" },
  { value: "lawn", label: "عشب وحدائق" },
  { value: "other", label: "أخرى" },
];

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
): Recommendation[] {
  const recs: Recommendation[] = [];
  const units = areaSqm / 100;

  // Base dose: 5 kg solid per 100 m²
  let solidDosePerUnit = 5;
  // Adjust for soil
  if (soilType === "sandy" || soilType === "rocky") solidDosePerUnit = 7;
  if (soilType === "clay") solidDosePerUnit = 4;
  // Adjust for pH extremes
  if (ph < 6) solidDosePerUnit *= 1.2;
  if (ph > 7.5) solidDosePerUnit *= 0.9;
  // Adjust for crop
  if (["tomato", "potato", "pepper", "cucumber"].includes(crop)) solidDosePerUnit *= 1.3;
  if (["wheat", "corn"].includes(crop)) solidDosePerUnit *= 1.1;

  const solidKg = Math.ceil(solidDosePerUnit * units);

  const solidFrequency =
    ph < 6 ? "مرة كل 3 أسابيع" :
    ["tomato", "potato", "pepper"].includes(crop) ? "مرة كل 4 أسابيع" :
    "مرة كل 6 أسابيع";

  const solidNote =
    ph < 6 ? "التربة حمضية — الجرعة الموصى بها مرتفعة قليلاً لتصحيح التوازن" :
    ph > 7.5 ? "التربة قلوية — يُنصح بتهوية التربة قبل الإضافة" :
    "درجة الحموضة مناسبة";

  const solid = solidProducts?.[0];
  if (solid) {
    recs.push({
      productId: solid.id,
      name: solid.name,
      price: solid.price,
      unit: solid.unit,
      imageUrl: solid.imageUrl,
      quantityNeeded: solidKg,
      frequency: solidFrequency,
      note: solidNote,
    });
  }

  // Liquid: 1 L per 100 m²
  let liquidL = Math.ceil(units);
  if (["tomato", "pepper", "cucumber", "flowers"].includes(crop)) liquidL = Math.ceil(units * 1.5);

  const liquidFrequency =
    ["tomato", "pepper", "cucumber"].includes(crop) ? "مرة كل أسبوعين" :
    "مرة كل 3 أسابيع";

  const liquid = liquidProducts?.[0];
  if (liquid) {
    recs.push({
      productId: liquid.id,
      name: liquid.name,
      price: liquid.price,
      unit: liquid.unit,
      imageUrl: liquid.imageUrl,
      quantityNeeded: liquidL,
      frequency: liquidFrequency,
      note: "مستخلص سائل لتحفيز النمو ومقاومة الأمراض",
    });
  }

  return recs;
}

export default function SmartDiagnosis() {
  const { data: products } = useListProducts();
  const { add } = useCart();
  const { toast } = useToast();

  const [soilType, setSoilType] = useState("sandy");
  const [ph, setPh] = useState("7");
  const [area, setArea] = useState("1000");
  const [crop, setCrop] = useState("tomato");
  const [submitted, setSubmitted] = useState(false);

  const solidProducts = useMemo(
    () => products?.filter((p) => p.category === "solid" && p.active) ?? [],
    [products],
  );
  const liquidProducts = useMemo(
    () => products?.filter((p) => p.category === "liquid" && p.active) ?? [],
    [products],
  );

  const recommendations = useMemo(() => {
    if (!submitted) return [];
    return buildRecommendations(
      soilType,
      parseFloat(ph) || 7,
      parseFloat(area) || 100,
      crop,
      solidProducts,
      liquidProducts,
    );
  }, [submitted, soilType, ph, area, crop, solidProducts, liquidProducts]);

  const totalCost = useMemo(
    () => recommendations.reduce((s, r) => s + r.price * r.quantityNeeded, 0),
    [recommendations],
  );

  const phNum = parseFloat(ph) || 7;
  const phComment =
    phNum < 6 ? "التربة حمضية — تحتاج إلى تعديل" :
    phNum > 7.5 ? "التربة قلوية — جرعة معتدلة كافية" :
    "درجة الحموضة مناسبة";

  const soilLabel = SOIL_TYPES.find((s) => s.value === soilType)?.label ?? "";
  const areaNum = parseFloat(area) || 100;
  const summaryNote = `درجة الحموضة المُدخلة: ${ph}. التربة ${soilLabel}. المساحة: ${areaNum} م². ${phComment}.`;

  const addAllToCart = () => {
    recommendations.forEach((r) => {
      for (let i = 0; i < r.quantityNeeded; i++) {
        add({
          id: r.productId,
          name: r.name,
          price: r.price,
          unit: r.unit,
          weightKg: 1,
          imageUrl: r.imageUrl,
        });
      }
    });
    toast({ title: "تمت الإضافة", description: "تم إضافة المنتجات الموصى بها إلى السلة" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">التشخيص الذكي للتربة</h1>
          <p className="text-lg text-muted-foreground">
            أدخل معلومات تربتك وحصولك وسنوصيك بالمنتجات والجرعات المثلى.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Soil type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Sprout className="w-4 h-4 text-primary" />
                    نوع التربة
                  </Label>
                  <select
                    value={soilType}
                    onChange={(e) => { setSoilType(e.target.value); setSubmitted(false); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SOIL_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* pH */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="ph">
                    <FlaskConical className="w-4 h-4 text-primary" />
                    مستوى الحموضة (pH)
                  </Label>
                  <Input
                    id="ph"
                    type="number"
                    min="1"
                    max="14"
                    step="0.1"
                    value={ph}
                    onChange={(e) => { setPh(e.target.value); setSubmitted(false); }}
                    dir="ltr"
                  />
                </div>

                {/* Crop */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Leaf className="w-4 h-4 text-primary" />
                    المحصول المراد زراعته
                  </Label>
                  <select
                    value={crop}
                    onChange={(e) => { setCrop(e.target.value); setSubmitted(false); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CROPS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Area */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="area">
                    <Ruler className="w-4 h-4 text-primary" />
                    المساحة (متر مربع)
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    min="1"
                    value={area}
                    onChange={(e) => { setArea(e.target.value); setSubmitted(false); }}
                    dir="ltr"
                  />
                </div>
              </div>

              <Button
                className="w-full h-12 text-base font-bold"
                onClick={() => setSubmitted(true)}
                disabled={!ph || !area || parseFloat(area) <= 0}
              >
                احصل على التوصية
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {submitted && recommendations.length > 0 ? (
            <div className="rounded-2xl bg-primary text-primary-foreground p-6 space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                البرنامج الموصى به
              </h2>

              <div className="space-y-3">
                {recommendations.map((r) => (
                  <div key={r.productId} className="bg-white/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.imageUrl || vermicompostBag}
                        alt={r.name}
                        className="w-10 h-10 rounded-lg object-cover bg-white/20"
                      />
                      <span className="font-bold text-amber-300">{r.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-white/60 text-xs">الكمية المطلوبة</div>
                        <div className="font-bold">{r.quantityNeeded} {r.unit}</div>
                      </div>
                      <div>
                        <div className="text-white/60 text-xs">التكرار</div>
                        <div className="font-bold">{r.frequency}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/20 pt-4 space-y-1">
                <div className="text-white/70 text-sm">التكلفة التقديرية للبرنامج</div>
                <div className="text-4xl font-extrabold tabular-nums">
                  {totalCost.toLocaleString("ar-DZ")}
                  <span className="text-2xl mr-1">د.ج</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-3 text-sm text-white/80 leading-relaxed border-r-4 border-amber-300">
                {summaryNote}
              </div>

              <Button
                className="w-full h-11 font-bold bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2"
                onClick={addAllToCart}
              >
                <ShoppingCart className="w-4 h-4" />
                أضف المنتجات للسلة
              </Button>
            </div>
          ) : submitted && recommendations.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
              <p className="text-lg">لا توجد منتجات كافية في المتجر لإنشاء توصية.</p>
              <p className="text-sm mt-2">أضف منتجات من نوع "سماد صلب" و"سماد سائل" في لوحة الإدارة.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
              <FlaskConical className="w-10 h-10 text-primary/40" />
              <p className="text-base">أدخل بيانات تربتك ثم اضغط على "احصل على التوصية"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
