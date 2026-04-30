import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Cpu, Plus, Trash2, RefreshCw, Copy, MapPin, Thermometer, Droplets, Clock,
  CheckCircle2, AlertCircle,
} from "lucide-react";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

type SensorDevice = {
  id: number;
  deviceId: string;
  token: string;
  name: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
  lastReading: { moisture: number; temperature: number | null; createdAt: string } | null;
};

function moistureStatus(m: number) {
  if (m < 20) return { label: "جاف جداً", color: "text-red-600 bg-red-50 border-red-200" };
  if (m < 40) return { label: "جاف", color: "text-orange-600 bg-orange-50 border-orange-200" };
  if (m < 65) return { label: "مناسب", color: "text-green-600 bg-green-50 border-green-200" };
  if (m < 85) return { label: "رطب", color: "text-blue-600 bg-blue-50 border-blue-200" };
  return { label: "مشبع", color: "text-purple-600 bg-purple-50 border-purple-200" };
}

export default function AdminSensors() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");

  const [devices, setDevices] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", notes: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState<SensorDevice | null>(null);

  useEffect(() => {
    if (!token) { setLocation("/admin/login"); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/admin/sensors`, { headers: { "x-admin-token": token! } });
      if (!res.ok) throw new Error("فشل التحميل");
      setDevices(await res.json());
    } catch { setError("تعذّر تحميل الأجهزة"); }
    finally { setLoading(false); }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const res = await fetch(`${API}/api/admin/sensors`, {
        method: "POST",
        headers: { "x-admin-token": token!, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const d: SensorDevice = await res.json();
      setNewDevice(d);
      setDevices(prev => [d, ...prev]);
      setAdding(false);
      setForm({ name: "", location: "", notes: "" });
    } catch { alert("فشل إضافة الجهاز"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف الجهاز وجميع قراءاته؟")) return;
    const res = await fetch(`${API}/api/admin/sensors/${id}`, {
      method: "DELETE", headers: { "x-admin-token": token! },
    });
    if (res.ok) { setDevices(prev => prev.filter(d => d.id !== id)); if (newDevice?.id === id) setNewDevice(null); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">أجهزة حساسات التربة (IoT)</h1>
              <p className="text-sm text-muted-foreground">إدارة أجهزة قياس رطوبة التربة</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted">
              <RefreshCw className="w-4 h-4" /> تحديث
            </button>
            <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary/90">
              <Plus className="w-4 h-4" /> جهاز جديد
            </button>
          </div>
        </div>

        {/* New device form */}
        {adding && (
          <div className="bg-white rounded-2xl border border-border p-5 mb-6 shadow-sm">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> إضافة جهاز جديد</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">اسم الجهاز *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: حقل القمح الشمالي" required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الموقع</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="مثال: ورقلة، المنطقة الغربية"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ملاحظات</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="وصف اختياري"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="sm:col-span-3 flex gap-2 justify-end">
                <button type="button" onClick={() => setAdding(false)} className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-muted">إلغاء</button>
                <button type="submit" className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary/90">حفظ</button>
              </div>
            </form>
          </div>
        )}

        {/* Newly created device — show credentials */}
        {newDevice && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 text-green-700 font-bold mb-3">
              <CheckCircle2 className="w-5 h-5" /> تم إنشاء الجهاز — احفظ هذه البيانات الآن
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: "معرّف الجهاز (Device ID)", val: newDevice.deviceId },
                { label: "الرمز السري (Token)", val: newDevice.token },
              ].map(({ label, val }) => (
                <div key={label} className="bg-white rounded-xl border border-green-200 px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono break-all">{val}</code>
                    <button onClick={() => copyText(val, val)} className="text-green-700 hover:text-green-900 shrink-0">
                      {copiedId === val ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-white rounded-xl border border-green-200 px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">مثال على إرسال قراءة (curl)</p>
              <code className="text-xs font-mono text-gray-600 break-all block">
                {`curl -X POST ${window.location.origin}/api/sensors/data \\`}<br />
                {`  -H "Content-Type: application/json" \\`}<br />
                {`  -d '{"deviceId":"${newDevice.deviceId}","token":"${newDevice.token}","moisture":45,"temperature":24}'`}
              </code>
            </div>
            <button onClick={() => setNewDevice(null)} className="mt-3 text-xs text-green-700 underline">إخفاء</button>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد أجهزة مسجّلة بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {devices.map(d => {
              const st = d.lastReading ? moistureStatus(d.lastReading.moisture) : null;
              const ago = d.lastReading
                ? Math.round((Date.now() - new Date(d.lastReading.createdAt).getTime()) / 60000)
                : null;

              return (
                <div key={d.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold">{d.name}</p>
                      {d.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {d.location}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(d.id)} className="text-muted-foreground hover:text-red-500 p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {d.lastReading ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none"
                              stroke={d.lastReading.moisture < 40 ? "#ef4444" : d.lastReading.moisture < 65 ? "#22c55e" : "#3b82f6"}
                              strokeWidth="3"
                              strokeDasharray={`${d.lastReading.moisture} ${100 - d.lastReading.moisture}`}
                              strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{Math.round(d.lastReading.moisture)}%</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${st?.color}`}>{st?.label}</span>
                          {d.lastReading.temperature !== null && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Thermometer className="w-3 h-3" /> {d.lastReading.temperature}°C
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ago === 0 ? "الآن" : ago === 1 ? "منذ دقيقة" : `منذ ${ago} دقيقة`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" /> لا توجد قراءات بعد
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border/40">
                    <p className="text-[10px] text-muted-foreground mb-1">معرّف الجهاز</p>
                    <div className="flex items-center gap-1">
                      <code className="text-[11px] font-mono text-gray-500 flex-1 truncate">{d.deviceId}</code>
                      <button onClick={() => copyText(d.deviceId, `id-${d.id}`)} className="text-muted-foreground hover:text-primary p-0.5">
                        {copiedId === `id-${d.id}` ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
