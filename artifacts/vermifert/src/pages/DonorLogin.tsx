import { useState } from "react";
import { useLocation } from "wouter";
import { Leaf, Phone, Lock, User, Eye, EyeOff, Recycle } from "lucide-react";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export default function DonorLogin() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name: "", phone: "", password: "" });

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = tab === "login" ? "/donors/login" : "/donors/register";
      const body = tab === "login"
        ? { phone: form.phone, password: form.password }
        : { name: form.name, phone: form.phone, password: form.password };

      const res = await fetch(`${API}/api${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "حدث خطأ"); return; }
      localStorage.setItem("donorToken", data.token);
      setLocation("/donor/dashboard");
    } catch {
      setError("حدث خطأ في الاتصال، يرجى المحاولة مجدداً");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-green-700 rounded-2xl p-4 mb-4 shadow-lg">
            <Recycle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-green-900">حساب المتبرع</h1>
          <p className="text-gray-500 text-sm mt-1">تبرّع بنفاياتك واحصل على نقاط خضراء</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2
                ${tab === "login" ? "text-green-700 border-green-600 bg-green-50" : "text-gray-400 border-transparent hover:text-gray-600"}`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2
                ${tab === "register" ? "text-green-700 border-green-600 bg-green-50" : "text-gray-400 border-transparent hover:text-gray-600"}`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            {tab === "register" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <User size={14} /> الاسم الكامل
                </label>
                <input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
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
                onChange={e => update("phone", e.target.value)}
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
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                  placeholder={tab === "register" ? "6 أحرف على الأقل" : "كلمة المرور"}
                  required
                  minLength={6}
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
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60"
            >
              {loading ? "..." : tab === "login" ? "دخول" : "إنشاء حساب"}
            </button>
          </form>

          {/* Benefits hint */}
          {tab === "register" && (
            <div className="px-6 pb-6">
              <div className="bg-green-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-green-800">مزايا حساب المتبرع:</p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li className="flex items-center gap-1.5">🌱 اكسب نقاطاً خضراء مقابل كل تبرع</li>
                  <li className="flex items-center gap-1.5">🎁 استبدل نقاطك بكوبونات خصم</li>
                  <li className="flex items-center gap-1.5">📊 تابع جميع تبرعاتك في مكان واحد</li>
                  <li className="flex items-center gap-1.5">🏅 ارتقِ في مستويات الشارات الخضراء</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
