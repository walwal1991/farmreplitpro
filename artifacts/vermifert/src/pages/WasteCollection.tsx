import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import {
  Leaf, Home, Utensils, Tractor, ArrowRight,
  CheckCircle, Recycle, Apple, Layers, Weight,
  Phone, MapPin, User, FileText, Info, Search,
  Clock, CalendarCheck, Truck, FlaskConical, CheckCircle2,
  AlertCircle, ClipboardList,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

type FormData = {
  sourceType: string;
  contactName: string;
  contactPhone: string;
  address: string;
  wasteType: string;
  estimatedWeightKg: string;
  notes: string;
};

type WC = {
  id: number;
  requestCode: string;
  sourceType: string;
  contactName: string;
  wasteType: string;
  estimatedWeightKg: string | null;
  status: string;
  scheduledDate: string | null;
  collectedDate: string | null;
  processingStartDate: string | null;
  completedDate: string | null;
  linkedBatchCode: string | null;
  notes: string | null;
  createdAt: string;
};

const SOURCE_TYPES = [
  { value: "household", label: "منزل / عائلة", icon: Home, color: "bg-green-100 border-green-400 text-green-800" },
  { value: "restaurant", label: "مطعم / كافيه", icon: Utensils, color: "bg-orange-100 border-orange-400 text-orange-800" },
  { value: "farm", label: "مزرعة / حديقة", icon: Tractor, color: "bg-emerald-100 border-emerald-400 text-emerald-800" },
];

const WASTE_TYPES = [
  { value: "food_scraps", label: "بقايا طعام", icon: Apple },
  { value: "garden_waste", label: "نفايات حديقة", icon: Leaf },
  { value: "mixed", label: "مختلطة", icon: Layers },
];

const HOW_STEPS = [
  { icon: Recycle, title: "سجّل طلبك", desc: "أدخل بياناتك ونوع النفايات العضوية المتوفرة لديك" },
  { icon: CheckCircle, title: "نحدد موعد الجمع", desc: "يتواصل معك فريقنا لتحديد أقرب موعد مناسب" },
  { icon: Leaf, title: "التحويل إلى سماد", desc: "تُعالَج النفايات بالديدان الحمراء لإنتاج سماد Vermicompost" },
  { icon: Weight, title: "دفعة قابلة للتتبع", desc: "يحصل كل منتج على رمز QR يوثّق رحلة المواد العضوية" },
];

const PIPELINE = [
  { status: "pending",    label: "استلام الطلب",    icon: ClipboardList,  color: "bg-yellow-500",  textColor: "text-yellow-700",  date: null as string | null },
  { status: "scheduled",  label: "تحديد موعد الجمع", icon: CalendarCheck,  color: "bg-blue-500",    textColor: "text-blue-700",    date: null as string | null },
  { status: "collected",  label: "جمع النفايات",     icon: Truck,          color: "bg-indigo-500",  textColor: "text-indigo-700",  date: null as string | null },
  { status: "processing", label: "التحويل بالديدان", icon: FlaskConical,   color: "bg-purple-500",  textColor: "text-purple-700",  date: null as string | null },
  { status: "completed",  label: "سماد Vermicompost جاهز", icon: CheckCircle2, color: "bg-green-600", textColor: "text-green-700",  date: null as string | null },
];

const STATUS_ORDER = ["pending", "scheduled", "collected", "processing", "completed"];

function statusIndex(status: string) {
  return STATUS_ORDER.indexOf(status);
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ar-MA", { day: "numeric", month: "long", year: "numeric" });
}

function TrackingResult({ item, onReset }: { item: WC; onReset: () => void }) {
  const currentIdx = statusIndex(item.status);
  const dateMap: Record<string, string | null> = {
    pending: formatDate(item.createdAt),
    scheduled: formatDate(item.scheduledDate),
    collected: formatDate(item.collectedDate),
    processing: formatDate(item.processingStartDate),
    completed: formatDate(item.completedDate),
  };

  return (
    <div className="space-y-5">
      <button
        onClick={onReset}
        className="flex items-center gap-1 text-green-700 text-sm hover:underline"
      >
        <ArrowRight size={16} className="rotate-180" /> البحث عن رمز آخر
      </button>

      {/* Request summary card */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-5 py-4">
          <p className="text-xs text-green-200 mb-1">رمز الطلب</p>
          <p className="text-2xl font-mono font-bold tracking-widest">{item.requestCode}</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">المتبرع</p>
            <p className="font-semibold text-gray-800">{item.contactName}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">نوع النفايات</p>
            <p className="font-semibold text-gray-800">
              {WASTE_TYPES.find(w => w.value === item.wasteType)?.label ?? item.wasteType}
            </p>
          </div>
          {item.estimatedWeightKg && (
            <div>
              <p className="text-gray-400 text-xs mb-0.5">الكمية التقريبية</p>
              <p className="font-semibold text-gray-800">{item.estimatedWeightKg} كغ</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 text-xs mb-0.5">تاريخ التسجيل</p>
            <p className="font-semibold text-gray-800">{formatDate(item.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Pipeline timeline */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
        <h3 className="font-bold text-green-900 mb-5 flex items-center gap-2">
          <Recycle size={18} /> رحلة تبرعك
        </h3>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-gray-100" />

          <div className="space-y-1">
            {PIPELINE.map((step, i) => {
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;
              const date = dateMap[step.status];
              const Icon = step.icon;

              return (
                <div key={step.status} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                  {/* Icon */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all
                    ${isDone ? step.color + " shadow-md" : "bg-gray-100"}
                    ${isCurrent ? "ring-4 ring-offset-2 ring-green-200" : ""}`}
                  >
                    <Icon size={18} className={isDone ? "text-white" : "text-gray-300"} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1.5">
                    <p className={`font-semibold text-sm ${isDone ? step.textColor : "text-gray-400"}`}>
                      {step.label}
                      {isCurrent && (
                        <span className={`mr-2 text-xs font-bold px-2 py-0.5 rounded-full 
                          ${step.color} text-white`}>
                          الحالة الحالية
                        </span>
                      )}
                    </p>
                    {isDone && date && (
                      <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                    )}
                    {!isDone && (
                      <p className="text-xs text-gray-300 mt-0.5">في الانتظار</p>
                    )}
                  </div>

                  {/* Check mark for completed steps */}
                  {isDone && !isCurrent && (
                    <CheckCircle size={16} className="text-green-500 mt-2 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Linked batch note */}
      {item.linkedBatchCode && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <Leaf size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">تبرعك أصبح سماداً!</p>
            <p className="text-emerald-600 text-xs mt-0.5">
              تم ربط نفاياتك بدفعة السماد رقم:{" "}
              <span className="font-mono font-bold">{item.linkedBatchCode}</span>
            </p>
          </div>
        </div>
      )}

      {/* Admin notes (if any) */}
      {item.notes && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">ملاحظة من الفريق:</p>
          <p>{item.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function WasteCollection() {
  const { dir } = useLang();
  const [mode, setMode] = useState<"how" | "track">("how");
  const [step, setStep] = useState<"how" | "form" | "done">("how");
  const [submitting, setSubmitting] = useState(false);
  const [resultCode, setResultCode] = useState("");

  // Tracking state
  const [trackCode, setTrackCode] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<WC | null>(null);
  const [trackError, setTrackError] = useState("");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { sourceType: "household", wasteType: "mixed" },
  });

  const sourceType = watch("sourceType");
  const wasteType = watch("wasteType");

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/waste-collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          estimatedWeightKg: data.estimatedWeightKg ? parseFloat(data.estimatedWeightKg) : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const row = await res.json();
      setResultCode(row.requestCode);
      setStep("done");
    } catch {
      alert("حدث خطأ، يرجى المحاولة مجدداً");
    } finally {
      setSubmitting(false);
    }
  }

  async function onTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!trackCode.trim()) return;
    setTracking(true);
    setTrackError("");
    setTrackResult(null);
    try {
      const res = await fetch(`${API}/api/waste-collections/${trackCode.trim().toUpperCase()}`);
      if (res.status === 404) { setTrackError("لم يُعثر على هذا الرمز. تأكد من الرمز وحاول مجدداً."); return; }
      if (!res.ok) throw new Error();
      setTrackResult(await res.json());
    } catch {
      setTrackError("حدث خطأ أثناء البحث، يرجى المحاولة مجدداً.");
    } finally {
      setTracking(false);
    }
  }

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Recycle size={36} />
            <h1 className="text-3xl font-bold">من النفايات إلى السماد</h1>
          </div>
          <p className="text-green-100 text-lg mb-4">تبرّع بنفاياتك العضوية — نحوّلها إلى Vermicompost طبيعي</p>
          <Link href="/donor/login">
            <button className="text-xs text-green-200 hover:text-white underline underline-offset-2 mb-4 flex items-center gap-1 mx-auto">
              <User size={13} /> تسجيل الدخول / إنشاء حساب متبرع
            </button>
          </Link>

          {/* Mode tabs */}
          <div className="inline-flex bg-white/20 rounded-2xl p-1 gap-1">
            <button
              onClick={() => { setMode("how"); setStep("how"); }}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition
                ${mode === "how" ? "bg-white text-green-700 shadow" : "text-white hover:bg-white/20"}`}
            >
              سجّل طلب جمع
            </button>
            <button
              onClick={() => { setMode("track"); setTrackResult(null); setTrackError(""); }}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2
                ${mode === "track" ? "bg-white text-green-700 shadow" : "text-white hover:bg-white/20"}`}
            >
              <Search size={15} />
              تتبع طلبي
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* ── TRACK MODE ──────────────────────────────────────────────────── */}
        {mode === "track" && (
          <>
            {!trackResult ? (
              <div className="space-y-5">
                {/* Code entry form */}
                <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
                  <h2 className="font-bold text-green-900 text-lg mb-1">تتبع طلبك</h2>
                  <p className="text-sm text-gray-500 mb-5">
                    أدخل رمز التتبع الذي حصلت عليه بعد تسجيل طلب الجمع
                  </p>
                  <form onSubmit={onTrack} className="space-y-4">
                    <div className="relative">
                      <input
                        value={trackCode}
                        onChange={e => setTrackCode(e.target.value)}
                        placeholder="مثال: WC-12FKJ0"
                        dir="ltr"
                        className="w-full border-2 border-gray-200 focus:border-green-400 rounded-xl px-4 py-3 text-lg font-mono text-center tracking-widest focus:outline-none transition placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal"
                      />
                    </div>
                    {trackError && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                        <AlertCircle size={16} className="shrink-0" />
                        {trackError}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={tracking || !trackCode.trim()}
                      className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Search size={18} />
                      {tracking ? "جارٍ البحث..." : "تتبع الطلب"}
                    </button>
                  </form>
                </div>

                {/* Hint box */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">أين أجد رمز التتبع؟</p>
                    <p>يظهر الرمز في آخر خطوة بعد إتمام تسجيل طلب الجمع. يبدو هكذا: <span className="font-mono font-bold">WC-XXXXXX</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <TrackingResult item={trackResult} onReset={() => { setTrackResult(null); setTrackCode(""); setTrackError(""); }} />
            )}
          </>
        )}

        {/* ── HOW / REGISTER MODE ───────────────────────────────────────────── */}
        {mode === "how" && (
          <>
            {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
            {step === "how" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {HOW_STEPS.map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 flex gap-4 items-start">
                      <div className="bg-green-100 rounded-xl p-2 shrink-0">
                        <s.icon size={22} className="text-green-700" />
                      </div>
                      <div>
                        <p className="font-bold text-green-900 mb-1">{s.title}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-green-700 rounded-2xl p-6 text-white text-center space-y-4">
                  <p className="text-lg font-semibold">هل لديك نفايات عضوية؟ ساهم في دورة الحياة!</p>
                  <p className="text-green-200 text-sm">نقبل بقايا الطعام، ونفايات الحديقة، والمواد العضوية المختلطة</p>
                  <button
                    onClick={() => setStep("form")}
                    className="bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition flex items-center gap-2 mx-auto"
                  >
                    <span>سجّل طلب جمع</span>
                    <ArrowRight size={18} />
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm">
                  <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                    <Info size={18} /> لماذا المشاركة؟
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> تقليل النفايات التي تذهب إلى المكبّات</li>
                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> المساهمة في إنتاج سماد عضوي طبيعي 100%</li>
                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> تتبّع رحلة نفاياتك من الجمع حتى السماد</li>
                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> الخدمة مجانية — نحن من نأتي إليك</li>
                  </ul>
                </div>
              </>
            )}

            {/* ── FORM ──────────────────────────────────────────────────────────── */}
            {step === "form" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <button
                  type="button"
                  onClick={() => setStep("how")}
                  className="flex items-center gap-1 text-green-700 text-sm hover:underline"
                >
                  <ArrowRight size={16} className="rotate-180" /> العودة
                </button>

                <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-green-900">نوع المصدر</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {SOURCE_TYPES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setValue("sourceType", s.value)}
                        className={`border-2 rounded-xl p-3 flex flex-col items-center gap-2 text-sm font-semibold transition
                          ${sourceType === s.value ? s.color + " border-current" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300"}`}
                      >
                        <s.icon size={20} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-green-900">نوع النفايات العضوية</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {WASTE_TYPES.map((w) => (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => setValue("wasteType", w.value)}
                        className={`border-2 rounded-xl p-3 flex flex-col items-center gap-2 text-sm font-semibold transition
                          ${wasteType === w.value ? "bg-emerald-100 border-emerald-500 text-emerald-800" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300"}`}
                      >
                        <w.icon size={20} />
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-green-900">بياناتك</h3>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <User size={14} /> الاسم الكامل
                    </label>
                    <input
                      {...register("contactName", { required: true })}
                      placeholder="محمد أحمد"
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.contactName ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors.contactName && <p className="text-red-500 text-xs">الاسم مطلوب</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Phone size={14} /> رقم الهاتف
                    </label>
                    <input
                      {...register("contactPhone", { required: true })}
                      placeholder="06xxxxxxxx"
                      dir="ltr"
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.contactPhone ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors.contactPhone && <p className="text-red-500 text-xs">رقم الهاتف مطلوب</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <MapPin size={14} /> العنوان
                    </label>
                    <textarea
                      {...register("address", { required: true })}
                      placeholder="الشارع، الحي، المدينة..."
                      rows={2}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${errors.address ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors.address && <p className="text-red-500 text-xs">العنوان مطلوب</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Weight size={14} /> الكمية التقريبية (كيلوغرام) — اختياري
                    </label>
                    <input
                      {...register("estimatedWeightKg")}
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="مثال: 5"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <FileText size={14} /> ملاحظات — اختياري
                    </label>
                    <textarea
                      {...register("notes")}
                      placeholder="أي معلومات إضافية..."
                      rows={2}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-2xl text-lg transition disabled:opacity-60"
                >
                  {submitting ? "جارٍ الإرسال..." : "إرسال طلب الجمع"}
                </button>
              </form>
            )}

            {/* ── DONE ──────────────────────────────────────────────────────────── */}
            {step === "done" && (
              <div className="text-center space-y-6 py-8">
                <div className="flex justify-center">
                  <div className="bg-green-100 rounded-full p-6">
                    <CheckCircle size={56} className="text-green-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-900 mb-2">تم استلام طلبك!</h2>
                  <p className="text-gray-600">سنتواصل معك قريباً لتحديد موعد الجمع</p>
                </div>
                <div className="bg-white rounded-2xl border-2 border-green-300 p-6 shadow-sm">
                  <p className="text-sm text-gray-500 mb-2">رمز تتبع طلبك</p>
                  <p className="text-3xl font-mono font-bold text-green-700 tracking-widest">{resultCode}</p>
                  <p className="text-xs text-gray-400 mt-2">احتفظ بهذا الرمز لمتابعة حالة طلبك</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 text-start flex items-start gap-3">
                  <Search size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <p>يمكنك في أي وقت تتبع حالة طلبك باستخدام هذا الرمز عبر زر <strong>"تتبع طلبي"</strong> في الأعلى.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setMode("track"); setTrackCode(resultCode); setTrackResult(null); setTrackError(""); }}
                    className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition flex items-center justify-center gap-2"
                  >
                    <Search size={18} /> تتبع طلبي الآن
                  </button>
                  <Link href="/">
                    <button className="w-full border border-green-300 text-green-700 font-semibold py-3 rounded-xl hover:bg-green-50 transition">
                      العودة للمتجر
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
