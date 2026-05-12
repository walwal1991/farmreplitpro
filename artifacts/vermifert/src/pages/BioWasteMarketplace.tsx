import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Leaf, Weight, MapPin, Phone, User, BadgeCheck, Search,
  ChevronDown, ArrowLeft, Banknote, CreditCard, CheckCircle2,
  Clock, Truck, Package, DollarSign
} from "lucide-react";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const WILAYAS = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار","البليدة","البويرة",
  "تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر العاصمة","الجلفة","جيجل","سطيف","سعيدة",
  "سكيكدة","سيدي بلعباس","عنابة","قالمة","قسنطينة","المدية","مستغانم","المسيلة","معسكر","ورقلة",
  "وهران","البيض","إليزي","برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت","الوادي","خنشلة",
  "سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تيموشنت","غرداية","غليزان","تيميمون",
  "برج باجي مختار","أولاد جلال","بني عباس","عين صالح","عين قزام","توقرت","جانت","المغير","المنيعة"
];

const WASTE_TYPES = [
  { value: "food_scraps",          label: "بقايا طعام",           icon: "🍽️" },
  { value: "fruit_veg_peels",      label: "قشور الفواكه والخضار", icon: "🥬" },
  { value: "agricultural_residue", label: "مخلفات زراعية",        icon: "🌾" },
  { value: "cardboard_paper",      label: "كرتون وورق",           icon: "📦" },
  { value: "coffee_grounds",       label: "تفل القهوة",           icon: "☕" },
  { value: "manure",               label: "روث حيواني",           icon: "🐄" },
  { value: "mixed",                label: "مختلطة",               icon: "♻️" },
];

interface Price {
  waste_type: string;
  label_ar: string;
  price_per_kg: string;
}

interface RequestResult {
  request_code: string;
  total_payout: string;
  status: string;
}

export default function BioWasteMarketplace() {
  const { toast } = useToast();
  const [prices, setPrices] = useState<Price[]>([]);
  const [step, setStep] = useState<"info" | "form" | "success">("info");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RequestResult | null>(null);
  const [trackCode, setTrackCode] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const token = localStorage.getItem("customerToken");
  const userStr = localStorage.getItem("customerUser");
  const user = userStr ? JSON.parse(userStr) : null;

  const [form, setForm] = useState({
    sellerName: user?.name ?? "",
    sellerPhone: user?.phone ?? "",
    wilaya: "",
    address: "",
    wasteType: "food_scraps",
    estimatedWeightKg: "",
    paymentMethod: "cash",
    notes: "",
  });

  useEffect(() => {
    fetch(`${API}/api/bio-waste/prices`)
      .then(r => r.json())
      .then(setPrices)
      .catch(() => {});
  }, []);

  const selectedPrice = prices.find(p => p.waste_type === form.wasteType);
  const estimatedPayout = selectedPrice && form.estimatedWeightKg
    ? (parseFloat(selectedPrice.price_per_kg) * parseFloat(form.estimatedWeightKg)).toFixed(0)
    : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const customerId = user?.id ?? null;
      const res = await fetch(`${API}/api/bio-waste/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, customerId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "خطأ", description: err.error, variant: "destructive" });
        return;
      }
      const data = await res.json();
      setResult(data);
      setStep("success");
    } finally {
      setSubmitting(false);
    }
  }

  async function track() {
    if (!trackCode.trim()) return;
    setTrackLoading(true);
    setTrackResult(null);
    try {
      const res = await fetch(`${API}/api/bio-waste/requests/${trackCode.trim().toUpperCase()}`);
      if (!res.ok) { toast({ title: "الطلب غير موجود", variant: "destructive" }); return; }
      setTrackResult(await res.json());
    } finally {
      setTrackLoading(false);
    }
  }

  const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    pending:   { label: "في الانتظار",    color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved:  { label: "موافق عليه",    color: "bg-blue-100 text-blue-800",     icon: BadgeCheck },
    scheduled: { label: "مجدول للاستلام", color: "bg-indigo-100 text-indigo-800", icon: Truck },
    collected: { label: "تم الاستلام",   color: "bg-green-100 text-green-800",   icon: Package },
    paid:      { label: "تم الدفع ✓",    color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
    rejected:  { label: "مرفوض",         color: "bg-red-100 text-red-800",       icon: ChevronDown },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-700 via-yellow-700 to-green-800 text-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Leaf className="w-4 h-4" />
              سوق المخلفات العضوية
            </div>
            <h1 className="text-4xl font-extrabold mb-4 leading-tight">
              حوّل مخلفاتك إلى <span className="text-yellow-300">ذهب أخضر</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              نشتري منك المخلفات العضوية بأسعار عادلة ونحوّلها إلى سماد ديدان عالي الجودة. فائدة لك وللبيئة.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold" onClick={() => setStep("form")}>
                <Banknote className="w-5 h-5 me-2" />
                بيع مخلفاتي الآن
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => document.getElementById("track-section")?.scrollIntoView({ behavior: "smooth" })}>
                <Search className="w-5 h-5 me-2" />
                تتبع طلبي
              </Button>
            </div>
          </div>
        </div>

        {/* Prices Table */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-2 text-center">أسعار الشراء</h2>
          <p className="text-muted-foreground text-center mb-8 text-sm">نحدّث الأسعار دورياً — الأسعار الحالية للكيلوغرام الواحد</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {prices.map(p => {
              const wt = WASTE_TYPES.find(w => w.value === p.waste_type);
              return (
                <div key={p.waste_type} className="bg-card border border-border rounded-2xl p-4 text-center hover:border-primary/40 transition-colors">
                  <div className="text-3xl mb-2">{wt?.icon ?? "♻️"}</div>
                  <div className="font-semibold text-sm mb-1">{p.label_ar}</div>
                  <div className="text-xl font-extrabold text-primary">{p.price_per_kg} <span className="text-sm font-normal text-muted-foreground">د.ج/كغ</span></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-muted/30 border-y border-border py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">كيف يعمل؟</h2>
            <div className="grid sm:grid-cols-4 gap-6">
              {[
                { n: "١", icon: "📝", title: "أرسل طلبك", desc: "أدخل نوع المخلفات والكمية المقدّرة" },
                { n: "٢", icon: "✅", title: "موافقة سريعة", desc: "نراجع طلبك خلال 24 ساعة ونحدد موعد الاستلام" },
                { n: "٣", icon: "🚛", title: "نستلم منك", desc: "يأتي فريقنا لاستلام المخلفات من موقعك" },
                { n: "٤", icon: "💵", title: "تستلم ثمنها", desc: "ندفع لك فور الوزن الفعلي — نقداً أو تحويلاً" },
              ].map(s => (
                <div key={s.n} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl mx-auto mb-3">{s.icon}</div>
                  <div className="font-bold mb-1">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        {step === "form" && (
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="flex items-center gap-3 mb-8">
              <button onClick={() => setStep("info")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold">طلب بيع مخلفات عضوية</h2>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {/* Contact info */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> بيانات البائع</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">الاسم الكامل *</label>
                    <input
                      required
                      value={form.sellerName}
                      onChange={e => setForm(f => ({ ...f, sellerName: e.target.value }))}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="اسمك الكامل"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">رقم الهاتف *</label>
                    <input
                      required
                      value={form.sellerPhone}
                      onChange={e => setForm(f => ({ ...f, sellerPhone: e.target.value }))}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="0XX XX XX XX"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> موقع الاستلام</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">الولاية *</label>
                    <select
                      required
                      value={form.wilaya}
                      onChange={e => setForm(f => ({ ...f, wilaya: e.target.value }))}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">اختر الولاية</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">العنوان التفصيلي *</label>
                    <input
                      required
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="الحي، الشارع، الرقم..."
                    />
                  </div>
                </div>
              </div>

              {/* Waste info */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Leaf className="w-4 h-4 text-primary" /> نوع المخلفات والكمية</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WASTE_TYPES.map(wt => {
                    const p = prices.find(pr => pr.waste_type === wt.value);
                    return (
                      <button
                        key={wt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, wasteType: wt.value }))}
                        className={`border rounded-xl p-3 text-center text-sm transition
                          ${form.wasteType === wt.value
                            ? "border-primary bg-primary/5 text-primary font-semibold"
                            : "border-border bg-card hover:border-primary/40"}`}
                      >
                        <div className="text-2xl mb-1">{wt.icon}</div>
                        <div className="text-xs font-medium leading-tight">{wt.label}</div>
                        {p && <div className="text-xs text-muted-foreground mt-0.5">{p.price_per_kg} د.ج/كغ</div>}
                      </button>
                    );
                  })}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">الكمية التقديرية (كغ) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={form.estimatedWeightKg}
                      onChange={e => setForm(f => ({ ...f, estimatedWeightKg: e.target.value }))}
                      className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="مثال: 10"
                    />
                  </div>
                  {estimatedPayout && (
                    <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5">
                      <DollarSign className="w-5 h-5 text-green-600 shrink-0" />
                      <div>
                        <div className="text-xs text-green-600 font-medium">المبلغ التقديري</div>
                        <div className="text-lg font-extrabold text-green-700">{parseInt(estimatedPayout).toLocaleString("ar-DZ")} د.ج</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment method */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> طريقة استلام المبلغ</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { value: "cash", label: "نقداً عند الاستلام", icon: "💵" },
                    { value: "bank_transfer", label: "تحويل بنكي (CCP / Baridimob)", icon: "🏦" },
                  ].map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, paymentMethod: pm.value }))}
                      className={`border rounded-xl p-3 flex items-center gap-3 text-sm transition
                        ${form.paymentMethod === pm.value
                          ? "border-primary bg-primary/5 text-primary font-semibold"
                          : "border-border bg-card hover:border-primary/40"}`}
                    >
                      <span className="text-2xl">{pm.icon}</span>
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm font-medium">ملاحظات إضافية (اختياري)</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="أي معلومات إضافية تريد إضافتها..."
                />
              </div>

              <Button type="submit" size="lg" disabled={submitting} className="w-full font-bold text-base">
                {submitting ? "جارٍ الإرسال..." : "إرسال طلب البيع"}
              </Button>
            </form>
          </div>
        )}

        {/* Success */}
        {step === "success" && result && (
          <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">تم إرسال طلبك!</h2>
            <p className="text-muted-foreground mb-6">سنتواصل معك خلال 24 ساعة لتحديد موعد الاستلام</p>
            <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-right space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">كود الطلب</span>
                <code className="font-mono font-bold text-primary text-lg">{result.request_code}</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">المبلغ التقديري</span>
                <span className="font-bold text-green-600">{parseInt(result.total_payout ?? "0").toLocaleString("ar-DZ")} د.ج</span>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-3">احتفظ بهذا الكود لتتبع طلبك</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setStep("info"); setTrackCode(result.request_code); }} variant="outline">
                تتبع الطلب
              </Button>
              <Button onClick={() => { setStep("form"); setResult(null); }}>
                طلب جديد
              </Button>
            </div>
          </div>
        )}

        {/* Track section */}
        {step === "info" && (
          <div id="track-section" className="max-w-xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold mb-2 text-center">تتبع طلبي</h2>
            <p className="text-muted-foreground text-center text-sm mb-6">أدخل كود الطلب الذي استلمته عند التسجيل</p>
            <div className="flex gap-2">
              <input
                value={trackCode}
                onChange={e => setTrackCode(e.target.value)}
                placeholder="BW-XXXXXX"
                dir="ltr"
                className="flex-1 border border-border rounded-xl px-4 py-2.5 bg-background text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
                onKeyDown={e => e.key === "Enter" && track()}
              />
              <Button onClick={track} disabled={trackLoading}>
                {trackLoading ? "..." : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {trackResult && (
              <div className="mt-4 bg-card border border-border rounded-2xl p-5 space-y-3">
                {(() => {
                  const si = STATUS_LABELS[trackResult.status] ?? { label: trackResult.status, color: "bg-gray-100 text-gray-700", icon: Clock };
                  const Icon = si.icon;
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <code className="font-mono font-bold text-primary">{trackResult.request_code}</code>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${si.color}`}>
                          <Icon className="w-3 h-3 inline me-1" />{si.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">البائع: </span>{trackResult.seller_name}</div>
                        <div><span className="text-muted-foreground">الولاية: </span>{trackResult.wilaya}</div>
                        <div><span className="text-muted-foreground">الكمية المقدّرة: </span>{trackResult.estimated_weight_kg} كغ</div>
                        <div><span className="text-muted-foreground">المبلغ التقديري: </span>
                          <span className="font-semibold text-green-600">{parseInt(trackResult.total_payout ?? "0").toLocaleString("ar-DZ")} د.ج</span>
                        </div>
                        {trackResult.actual_weight_kg && (
                          <div><span className="text-muted-foreground">الوزن الفعلي: </span>{trackResult.actual_weight_kg} كغ</div>
                        )}
                        {trackResult.actual_payout && (
                          <div><span className="text-muted-foreground">المبلغ الفعلي: </span>
                            <span className="font-bold text-green-700">{parseInt(trackResult.actual_payout).toLocaleString("ar-DZ")} د.ج</span>
                          </div>
                        )}
                        {trackResult.pickup_date && (
                          <div><span className="text-muted-foreground">موعد الاستلام: </span>{trackResult.pickup_date}</div>
                        )}
                      </div>
                      {trackResult.admin_notes && (
                        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                          ملاحظة الإدارة: {trackResult.admin_notes}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
