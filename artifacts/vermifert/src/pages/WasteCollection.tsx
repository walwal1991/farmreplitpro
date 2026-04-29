import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import {
  Leaf, Home, Utensils, Tractor, ArrowRight,
  CheckCircle, Recycle, Apple, Layers, Weight,
  Phone, MapPin, User, FileText, Info,
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

export default function WasteCollection() {
  const { dir } = useLang();
  const [step, setStep] = useState<"how" | "form" | "done">("how");
  const [submitting, setSubmitting] = useState(false);
  const [resultCode, setResultCode] = useState("");

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

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Recycle size={36} />
            <h1 className="text-3xl font-bold">من النفايات إلى السماد</h1>
          </div>
          <p className="text-green-100 text-lg">تبرّع بنفاياتك العضوية — نحوّلها إلى Vermicompost طبيعي</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

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

            {/* Benefits */}
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

            {/* Source type */}
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

            {/* Waste type */}
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

            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-green-900">بياناتك</h3>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <User size={14} /> الاسم الكامل
                </label>
                <input
                  {...register("contactName", { required: true })}
                  placeholder="محمد أحمد"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400
                    ${errors.contactName ? "border-red-400" : "border-gray-300"}`}
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
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400
                    ${errors.contactPhone ? "border-red-400" : "border-gray-300"}`}
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
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none
                    ${errors.address ? "border-red-400" : "border-gray-300"}`}
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
            <div className="flex flex-col gap-3">
              <Link href="/">
                <button className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition">
                  العودة للمتجر
                </button>
              </Link>
              <button
                onClick={() => { setStep("how"); setResultCode(""); }}
                className="w-full border border-green-300 text-green-700 font-semibold py-3 rounded-xl hover:bg-green-50 transition"
              >
                تسجيل طلب جديد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
