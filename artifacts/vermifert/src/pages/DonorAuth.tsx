import { useState } from "react";
import { useLocation } from "wouter";
import { Recycle, User, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export default function DonorAuth() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", password: "" });

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/donors/login" : "/api/donors/register";
      const body = tab === "login"
        ? { phone: form.phone, password: form.password }
        : { name: form.name, phone: form.phone, password: form.password };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "حدث خطأ"); return; }
      localStorage.setItem("donorToken", data.token);
      setLocation("/donor/dashboard");
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white">
        <div className="max-w-sm mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Recycle size={32} />
            <h1 className="text-2xl font-bold">حساب المتبرع</h1>
          </div>
          <p className="text-green-200 text-sm">تبرع بنفاياتك واكسب نقاطاً خضراء</p>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pt-8">
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 w-full max-w-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(["login", "register"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-3.5 text-sm font-bold transition
                  ${tab === t ? "text-green-700 border-b-2 border-green-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                {t === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            {tab === "register" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <User size={14} /> الاسم الكامل
                </label>
                <input
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="محمد أحمد"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Phone size={14} /> رقم الهاتف
              </label>
              <input
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="06xxxxxxxx"
                dir="ltr"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Lock size={14} /> كلمة المرور
              </label>
              <div className="relative">
                <input
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder={tab === "register" ? "6 أحرف على الأقل" : "••••••••"}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "جارٍ التحميل..." : tab === "login" ? "دخول" : "إنشاء الحساب"}
              <ArrowRight size={16} />
            </button>

            <p className="text-center text-xs text-gray-400 pt-2">
              <Link href="/waste-collection" className="text-green-600 hover:underline">
                ← العودة إلى صفحة التبرع
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
