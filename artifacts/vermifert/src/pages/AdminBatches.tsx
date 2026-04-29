import AdminSidebar from "@/components/AdminSidebar";
import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Recycle, Plus, Trash2, QrCode, Download, Home, Leaf,
  FlaskConical, Calendar, ChevronDown, ChevronUp, X,
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
  createdAt: string;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  household: { label: "نفايات منزلية", color: "bg-blue-100 text-blue-700" },
  agricultural: { label: "نفايات فلاحية", color: "bg-green-100 text-green-700" },
  mixed: { label: "مختلطة", color: "bg-amber-100 text-amber-700" },
};

const EMPTY_FORM = {
  sourceType: "mixed",
  sourceDescription: "",
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  organicMatter: "",
  productionDate: new Date().toISOString().split("T")[0],
  notes: "",
};

function NutrientBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

export default function AdminBatches() {
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken") ?? "";
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [qrOpenId, setQrOpenId] = useState<number | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const BASE = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");

  async function fetchBatches() {
    setLoading(true);
    const res = await fetch(`${API}/api/admin/batches`, { headers: { "x-admin-token": token } });
    if (res.ok) setBatches(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchBatches(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`${API}/api/admin/batches`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({
        ...form,
        nitrogen: parseFloat(form.nitrogen) || 0,
        phosphorus: parseFloat(form.phosphorus) || 0,
        potassium: parseFloat(form.potassium) || 0,
        organicMatter: parseFloat(form.organicMatter) || 0,
      }),
    });
    if (res.ok) {
      toast({ title: "تم إنشاء الدفعة", description: "تم توليد رمز QR تلقائياً" });
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      fetchBatches();
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: "خطأ", description: err.error ?? "تعذر الحفظ", variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("هل تريد حذف هذه الدفعة؟")) return;
    setDeletingId(id);
    await fetch(`${API}/api/admin/batches/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token },
    });
    setBatches((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
    toast({ title: "تم الحذف" });
  }

  function downloadQR(batch: Batch) {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([svgData], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-batch-${batch.batchCode}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Recycle className="w-6 h-6 text-primary" />
              دفعات السماد
            </h1>
            <p className="text-sm text-muted-foreground mt-1">من النفايات إلى السماد — تتبع كل دفعة بـ QR</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            دفعة جديدة
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" />تسجيل دفعة جديدة</h2>
              <button type="button" onClick={() => setShowForm(false)} className="hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {/* Source type */}
            <div>
              <label className="text-sm font-medium block mb-2">مصدر النفايات</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SOURCE_LABELS).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, sourceType: key }))}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.sourceType === key ? "border-primary " + color : "border-border bg-muted/50 text-muted-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">وصف المصدر</label>
              <input value={form.sourceDescription} onChange={(e) => setForm((f) => ({ ...f, sourceDescription: e.target.value }))}
                placeholder="مثال: نفايات مطبخ + قش شعير من مزارع ولاية المدية"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>

            {/* Nutrients */}
            <div>
              <label className="text-sm font-medium block mb-2">العناصر الغذائية (%)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "nitrogen", label: "آزوت (N)" },
                  { key: "phosphorus", label: "فوسفور (P)" },
                  { key: "potassium", label: "بوتاسيوم (K)" },
                  { key: "organicMatter", label: "مادة عضوية" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                    <input
                      type="number" min="0" max="100" step="0.01"
                      value={(form as Record<string, string>)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">تاريخ الإنتاج</label>
                <input type="date" value={form.productionDate} onChange={(e) => setForm((f) => ({ ...f, productionDate: e.target.value }))}
                  required className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">ملاحظات (اختياري)</label>
                <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="أي معلومات إضافية عن الدفعة"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
              {saving ? "جارٍ الحفظ..." : "حفظ وتوليد QR"}
            </button>
          </form>
        )}

        {/* Batch list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Recycle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">لا توجد دفعات بعد</p>
            <p className="text-sm">أنشئ أول دفعة وابدأ تتبع رحلة السماد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => {
              const src = SOURCE_LABELS[batch.sourceType] ?? { label: batch.sourceType, color: "bg-muted text-muted-foreground" };
              const qrUrl = `${BASE}/batch/${batch.batchCode}`;
              const qrOpen = qrOpenId === batch.id;
              return (
                <div key={batch.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 flex flex-col sm:flex-row gap-4">
                    {/* Left info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-primary text-sm">{batch.batchCode}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${src.color}`}>{src.label}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(batch.productionDate), "d MMMM yyyy", { locale: ar })}
                        </span>
                      </div>
                      {batch.sourceDescription && (
                        <p className="text-sm text-muted-foreground">{batch.sourceDescription}</p>
                      )}
                      {/* Nutrients compact */}
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {[
                          { label: "N", value: batch.nitrogen, color: "bg-blue-500" },
                          { label: "P", value: batch.phosphorus, color: "bg-orange-400" },
                          { label: "K", value: batch.potassium, color: "bg-purple-500" },
                          { label: "عضوي", value: batch.organicMatter, color: "bg-green-500" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center bg-muted rounded-xl py-2">
                            <div className="text-xs text-muted-foreground">{label}</div>
                            <div className={`font-bold text-sm ${color.replace("bg-", "text-")}`}>{parseFloat(value).toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex flex-row sm:flex-col gap-2 items-start sm:items-end shrink-0">
                      <button
                        onClick={() => setQrOpenId(qrOpen ? null : batch.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        {qrOpen ? "إخفاء QR" : "عرض QR"}
                        {qrOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleDelete(batch.id)}
                        disabled={deletingId === batch.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive font-semibold text-xs hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  </div>

                  {/* QR panel */}
                  {qrOpen && (
                    <div className="border-t border-border bg-muted/30 px-5 py-5 flex flex-col sm:flex-row items-center gap-6">
                      <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-md">
                        <QRCodeSVG value={qrUrl} size={160} includeMargin={false} level="H" />
                      </div>
                      <div className="space-y-3 text-center sm:text-right flex-1">
                        <p className="font-bold text-sm">رمز التتبع</p>
                        <p className="text-xs text-muted-foreground font-mono break-all">{qrUrl}</p>
                        <p className="text-xs text-muted-foreground">يمكن للعميل مسح هذا الرمز لرؤية رحلة السماد كاملة — من المصدر إلى التغليف</p>
                        <button
                          onClick={() => downloadQR(batch)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          تحميل SVG
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
