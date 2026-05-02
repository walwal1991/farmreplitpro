import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";
import { CheckCircle2, Package, Leaf, BookOpen, HeadphonesIcon, ArrowLeft, Loader2, X } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

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

const CROP_OPTIONS_AR = [
  "القمح", "الشعير", "الذرة", "الطماطم", "البطاطس", "الفلفل", "الباذنجان",
  "الخس", "الجزر", "البصل", "الثوم", "البطيخ", "الشمام", "العنب",
  "الزيتون", "التين", "الرمان", "الأشجار المثمرة", "النخيل", "أخرى",
];

const WILAYA_OPTIONS = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار","البليدة","البويرة",
  "تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر","الجلفة","جيجل","سطيف","سعيدة",
  "سكيكدة","سيدي بلعباس","عنابة","قالمة","قسنطينة","المدية","مستغانم","المسيلة","معسكر",
  "ورقلة","وهران","البيض","إليزي","برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت",
  "الوادي","خنشلة","سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تيموشنت",
  "غرداية","غليزان","تيميمون","برج باجي مختار","أولاد جلال","بني عباس","عين صالح",
  "عين قزام","تقرت","جانت","المغير","المنيعة",
];

function PlanCard({
  plan, lang, onSubscribe,
}: {
  plan: Plan;
  lang: string;
  onSubscribe: (plan: Plan) => void;
}) {
  const name = lang === "ar" ? plan.name_ar : lang === "fr" ? plan.name_fr : plan.name;
  const desc = lang === "ar" ? plan.description_ar : lang === "fr" ? plan.description_fr : plan.description;

  const colorMap: Record<string, { border: string; badge: string; btn: string }> = {
    green:  { border: "border-green-500",  badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",  btn: "bg-green-600 hover:bg-green-700" },
    amber:  { border: "border-amber-500",  badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",  btn: "bg-amber-600 hover:bg-amber-700" },
    emerald:{ border: "border-emerald-600",badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", btn: "bg-emerald-700 hover:bg-emerald-800" },
  };
  const c = colorMap[plan.color] ?? colorMap.green;

  const features = [
    { label: `${plan.fertilizer_kg} كغ سماد ديدان عضوي/شهر`, always: true },
    { label: "نصائح زراعية شهرية", show: plan.includes_tips },
    { label: "خطة زراعية مخصصة لمحصولك", show: plan.includes_plan },
    { label: "استشارة زراعية أولوية", show: plan.includes_consultation },
  ];

  return (
    <div className={`bg-card border-2 ${c.border} rounded-3xl p-7 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow relative`}>
      <div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${c.badge}`}>{name}</span>
        <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-4xl font-bold text-foreground">{plan.price_per_month.toLocaleString("ar-DZ")}</span>
        <span className="text-muted-foreground mb-1">د.ج / شهر</span>
      </div>
      <ul className="space-y-2.5 flex-1">
        {features.filter(f => f.always || f.show).map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <span>{f.label}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={() => onSubscribe(plan)}
        className={`w-full text-white font-semibold py-5 rounded-xl ${c.btn}`}
      >
        اشترك الآن
      </Button>
    </div>
  );
}

export default function Subscriptions() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [form, setForm] = useState({ cropType: "", deliveryAddress: "", deliveryCity: "", notes: "" });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { lang } = useLang();

  useEffect(() => {
    fetch(`${API}/api/subscription-plans`)
      .then(r => r.json())
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  function handleSubscribe(plan: Plan) {
    const token = localStorage.getItem("customerToken");
    if (!token) {
      toast({ title: "يجب تسجيل الدخول أولاً", description: "سجّل دخولك للاشتراك في الخطة" });
      setLocation("/customer/login");
      return;
    }
    setSelectedPlan(plan);
    setPaymentMethod("cod");
    setForm({ cropType: "", deliveryAddress: "", deliveryCity: "", notes: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!form.deliveryAddress.trim() || !form.deliveryCity) {
      toast({ title: "يرجى تعبئة عنوان التوصيل والولاية", variant: "destructive" });
      return;
    }
    const token = localStorage.getItem("customerToken");
    if (!token) { setLocation("/customer/login"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-customer-token": token },
        body: JSON.stringify({ planId: selectedPlan.id, ...form, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "حدث خطأ", variant: "destructive" });
        return;
      }
      if (paymentMethod === "online" && data.checkoutUrl) {
        // Redirect to Chargily payment
        setSelectedPlan(null);
        window.open(data.checkoutUrl, "_blank");
        toast({ title: "🔗 جاري فتح صفحة الدفع...", description: "أكمل الدفع في النافذة الجديدة ثم ارجع للوحة التحكم" });
        setTimeout(() => setLocation("/customer/dashboard"), 1500);
      } else {
        toast({ title: "✅ تم الاشتراك بنجاح!", description: data.message });
        setSelectedPlan(null);
        setLocation("/customer/dashboard");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          <Leaf className="w-4 h-4" />
          اشتراك شهري للفلاحين
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          صندوقك الزراعي كل شهر 📦
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          استلم سمادك العضوي مع نصائح زراعية مخصصة لمحصولك — مباشرةً إلى بابك كل شهر
        </p>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">لا توجد خطط متاحة حالياً</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(p => (
              <PlanCard key={p.id} plan={p} lang={lang} onSubscribe={handleSubscribe} />
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="mt-16 bg-card border border-border rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6 text-center">كيف يعمل الاشتراك؟</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Package, title: "اختر خطتك", desc: "اختر الصندوق المناسب لمحصولك وميزانيتك" },
              { icon: Leaf, title: "حدد محصولك", desc: "أخبرنا بنوع المحصول لنرسل لك السماد المناسب" },
              { icon: BookOpen, title: "استلم كل شهر", desc: "يصلك صندوقك مع نصائح زراعية مخصصة" },
              { icon: HeadphonesIcon, title: "دعم مستمر", desc: "فريقنا جاهز لمساعدتك في أي وقت" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-green-700 dark:text-green-400" />
                  </div>
                  <div className="font-semibold text-sm">{s.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subscription Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPlan(null)}>
          <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full p-7 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">
                الاشتراك في: {lang === "ar" ? selectedPlan.name_ar : selectedPlan.name}
              </h2>
              <button onClick={() => setSelectedPlan(null)} className="p-1 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Payment method toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">طريقة الدفع</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex flex-col items-center gap-1.5 border-2 rounded-xl py-3 px-2 transition-colors text-sm ${
                      paymentMethod === "cod" ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300" : "border-border text-muted-foreground"
                    }`}
                  >
                    <span className="text-xl">💵</span>
                    <span className="font-medium">دفع عند الاستلام</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("online")}
                    className={`flex flex-col items-center gap-1.5 border-2 rounded-xl py-3 px-2 transition-colors text-sm ${
                      paymentMethod === "online" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300" : "border-border text-muted-foreground"
                    }`}
                  >
                    <span className="text-xl">💳</span>
                    <span className="font-medium">دفع إلكتروني</span>
                    <span className="text-xs opacity-70">Edahabia / CIB</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">نوع المحصول</label>
                <select
                  value={form.cropType}
                  onChange={e => setForm(f => ({ ...f, cropType: e.target.value }))}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background"
                >
                  <option value="">اختر نوع المحصول</option>
                  {CROP_OPTIONS_AR.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">الولاية <span className="text-red-500">*</span></label>
                <select
                  value={form.deliveryCity}
                  onChange={e => setForm(f => ({ ...f, deliveryCity: e.target.value }))}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background"
                  required
                >
                  <option value="">اختر الولاية</option>
                  {WILAYA_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">عنوان التوصيل <span className="text-red-500">*</span></label>
                <input
                  value={form.deliveryAddress}
                  onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))}
                  placeholder="الحي، الشارع، رقم البيت..."
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ملاحظات إضافية</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="أي معلومات إضافية عن مزرعتك..."
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background resize-none"
                />
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">السعر الشهري</span>
                  <span className="font-bold">{selectedPlan.price_per_month.toLocaleString("ar-DZ")} د.ج</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">كمية السماد</span>
                  <span className="font-semibold">{selectedPlan.fertilizer_kg} كغ / شهر</span>
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full py-5 text-base font-semibold">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin me-2" /> جاري التسجيل...</> : "تأكيد الاشتراك"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
