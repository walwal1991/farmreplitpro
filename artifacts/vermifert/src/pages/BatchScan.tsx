import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import {
  Recycle, Home, Leaf, FlaskConical, Calendar, CheckCircle2,
  Package, Sprout, Factory, ArrowLeft, Info,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Batch {
  id: number;
  batchCode: string;
  sourceType: string;
  sourceDescription: string | null;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  organicMatter: string;
  productionDate: string;
  notes: string | null;
}

const SOURCE_INFO: Record<string, { label: string; icon: typeof Home; color: string; bg: string; desc: string }> = {
  household: {
    label: "نفايات منزلية", icon: Home, color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    desc: "مُعالَج من بقايا المطبخ والنفايات العضوية المنزلية",
  },
  agricultural: {
    label: "نفايات فلاحية", icon: Leaf, color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    desc: "مُعالَج من نفايات المحاصيل وروث الحيوانات",
  },
  mixed: {
    label: "مصدر مختلط", icon: Recycle, color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    desc: "مزيج من النفايات المنزلية والفلاحية",
  },
};

const JOURNEY_STEPS = [
  { icon: Recycle, label: "جمع النفايات", desc: "فرز وجمع المواد العضوية" },
  { icon: Factory, label: "التحويل", desc: "تحليل بيولوجي بالديدان" },
  { icon: FlaskConical, label: "الفحص", desc: "تحليل العناصر الغذائية" },
  { icon: Package, label: "التغليف", desc: "تعبئة وترميز بـ QR" },
];

function NutrientCard({ label, value, color, bg, desc }: { label: string; value: number; color: string; bg: string; desc: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <div className={`text-2xl font-black ${color}`}>{value.toFixed(1)}%</div>
      <div className={`font-bold text-sm mt-0.5 ${color}`}>{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
        <div className={`h-full rounded-full ${color.replace("text-", "bg-")}`} style={{ width: `${Math.min(value * 5, 100)}%` }} />
      </div>
    </div>
  );
}

export default function BatchScan() {
  const { code } = useParams<{ code: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch(`${API}/api/batches/${code}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => { if (data) { setBatch(data); setLoading(false); } })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground">جارٍ تحميل معلومات الدفعة…</p>
        </div>
      </div>
    );
  }

  if (notFound || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" dir="rtl">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Info className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold">رمز غير موجود</h1>
          <p className="text-muted-foreground text-sm">هذا الرمز غير مسجل في نظامنا. تأكد من مسح الرمز الصحيح.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            <ArrowLeft className="w-4 h-4" />
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  const src = SOURCE_INFO[batch.sourceType] ?? SOURCE_INFO.mixed;
  const SrcIcon = src.icon;
  const nutrients = [
    { label: "آزوت (N)", value: parseFloat(batch.nitrogen), color: "text-blue-600", bg: "bg-blue-50 border-blue-200", desc: "ينشط نمو الأوراق والسيقان" },
    { label: "فوسفور (P)", value: parseFloat(batch.phosphorus), color: "text-orange-500", bg: "bg-orange-50 border-orange-200", desc: "يقوي الجذور والإزهار" },
    { label: "بوتاسيوم (K)", value: parseFloat(batch.potassium), color: "text-purple-600", bg: "bg-purple-50 border-purple-200", desc: "يحسن جودة الثمار" },
    { label: "مادة عضوية", value: parseFloat(batch.organicMatter), color: "text-green-700", bg: "bg-green-50 border-green-200", desc: "يحسن بنية التربة" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background" dir="rtl">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-10 pb-16">
        <Link href="/" className="inline-flex items-center gap-2 text-primary-foreground/70 text-sm mb-6 hover:text-primary-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Vermifert
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Recycle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-primary-foreground/70 text-xs">من النفايات إلى السماد</p>
            <h1 className="text-xl font-black">رحلة الدفعة</h1>
          </div>
        </div>
        <div className="font-mono text-3xl font-black tracking-widest opacity-90">{batch.batchCode}</div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-8 pb-16 space-y-6">
        {/* Source card */}
        <div className={`bg-white rounded-2xl border-2 ${src.bg} shadow-lg p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl ${src.bg} flex items-center justify-center border`}>
              <SrcIcon className={`w-5 h-5 ${src.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">مصدر السماد</p>
              <p className={`font-bold ${src.color}`}>{src.label}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{src.desc}</p>
          {batch.sourceDescription && (
            <div className="mt-3 text-sm text-foreground bg-white/60 rounded-xl px-3 py-2 border">
              {batch.sourceDescription}
            </div>
          )}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            تاريخ الإنتاج: {format(new Date(batch.productionDate), "d MMMM yyyy", { locale: ar })}
          </div>
        </div>

        {/* Journey timeline */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-primary" />
            رحلة التحويل
          </h2>
          <div className="relative">
            <div className="absolute right-5 top-5 bottom-5 w-0.5 bg-primary/20" />
            <div className="space-y-5">
              {JOURNEY_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md relative z-10">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="pt-1.5">
                      <p className="font-bold text-sm">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-primary absolute left-0 top-3" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nutrients */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            التركيبة الغذائية
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {nutrients.map((n) => (
              <NutrientCard key={n.label} {...n} />
            ))}
          </div>
        </div>

        {/* Notes */}
        {batch.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            <p className="font-bold mb-1 flex items-center gap-2"><Info className="w-4 h-4" />ملاحظات</p>
            <p>{batch.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1 pt-2">
          <p className="font-bold text-primary">Vermifert — سماد الديدان</p>
          <p>هذا المنتج 100% طبيعي ومستدام</p>
          <Link href="/" className="text-primary underline underline-offset-2">زيارة المتجر</Link>
        </div>
      </div>
    </div>
  );
}
