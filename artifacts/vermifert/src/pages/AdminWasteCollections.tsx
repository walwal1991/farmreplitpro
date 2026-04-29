import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Recycle, Home, Utensils, Tractor, Leaf, Apple, Layers,
  Clock, CalendarCheck, Truck, FlaskConical, CheckCircle2,
  ChevronDown, Trash2, Weight, Phone, MapPin, User, Link2,
} from "lucide-react";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const TOKEN = () => localStorage.getItem("adminToken") ?? "";

type WC = {
  id: number;
  requestCode: string;
  sourceType: string;
  contactName: string;
  contactPhone: string;
  address: string;
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

const STATUSES = [
  { value: "pending", label: "في الانتظار", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "scheduled", label: "مجدول", icon: CalendarCheck, color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "collected", label: "تم الجمع", icon: Truck, color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { value: "processing", label: "قيد التحويل", icon: FlaskConical, color: "bg-purple-100 text-purple-800 border-purple-300" },
  { value: "completed", label: "سماد جاهز ✓", icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-300" },
];

const SOURCE_ICONS: Record<string, typeof Home> = {
  household: Home,
  restaurant: Utensils,
  farm: Tractor,
};
const SOURCE_LABELS: Record<string, string> = {
  household: "منزل",
  restaurant: "مطعم",
  farm: "مزرعة",
};
const WASTE_ICONS: Record<string, typeof Apple> = {
  food_scraps: Apple,
  garden_waste: Leaf,
  mixed: Layers,
};
const WASTE_LABELS: Record<string, string> = {
  food_scraps: "بقايا طعام",
  garden_waste: "نفايات حديقة",
  mixed: "مختلطة",
};

function statusInfo(val: string) {
  return STATUSES.find((s) => s.value === val) ?? STATUSES[0];
}

function EditModal({ item, onClose, onSaved }: { item: WC; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    status: item.status,
    scheduledDate: item.scheduledDate ?? "",
    collectedDate: item.collectedDate ?? "",
    processingStartDate: item.processingStartDate ?? "",
    completedDate: item.completedDate ?? "",
    linkedBatchCode: item.linkedBatchCode ?? "",
    notes: item.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`${API}/api/admin/waste-collections/${item.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": TOKEN() },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  const si = statusInfo(form.status);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" dir="rtl">
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-t-2xl px-6 py-4">
          <p className="font-bold text-lg">{item.requestCode}</p>
          <p className="text-green-200 text-sm">{item.contactName} — {item.contactPhone}</p>
        </div>
        <div className="p-6 space-y-4">
          {/* Status selector */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">الحالة</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setForm(f => ({ ...f, status: s.value }))}
                  className={`border rounded-xl p-2 flex items-center gap-2 text-sm font-medium transition
                    ${form.status === s.value ? s.color + " border-current" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300"}`}
                >
                  <s.icon size={15} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date fields */}
          <div className="grid grid-cols-2 gap-3">
            {([
              ["scheduledDate", "موعد الجمع"],
              ["collectedDate", "تاريخ الجمع"],
              ["processingStartDate", "بدء التحويل"],
              ["completedDate", "تاريخ الاكتمال"],
            ] as [keyof typeof form, string][]).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-gray-600">{label}</label>
                <input
                  type="date"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            ))}
          </div>

          {/* Linked batch */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Link2 size={14} /> ربط بدفعة سماد (كود الدفعة)
            </label>
            <input
              value={form.linkedBatchCode}
              onChange={e => setForm(f => ({ ...f, linkedBatchCode: e.target.value }))}
              placeholder="مثال: JZG8I38A"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">ملاحظات الإدارة</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
            >
              {saving ? "حفظ..." : "حفظ التغييرات"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminWasteCollections() {
  const [items, setItems] = useState<WC[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WC | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  async function load() {
    setLoading(true);
    const res = await fetch(`${API}/api/admin/waste-collections`, {
      headers: { "x-admin-token": TOKEN() },
    });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id: number) {
    if (!confirm("حذف هذا الطلب؟")) return;
    await fetch(`${API}/api/admin/waste-collections/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": TOKEN() },
    });
    load();
  }

  const filtered = filterStatus === "all" ? items : items.filter(i => i.status === filterStatus);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.value] = items.filter(i => i.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Recycle size={28} className="text-green-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">طلبات جمع النفايات</h1>
              <p className="text-sm text-gray-500">من النفايات إلى Vermicompost</p>
            </div>
          </div>
          <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-sm">
            {items.length} طلب
          </span>
        </div>

        {/* Status pipeline stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? "all" : s.value)}
              className={`rounded-xl border p-3 text-center transition
                ${filterStatus === s.value ? s.color + " border-current shadow-sm" : "bg-white border-gray-200 hover:border-green-300"}`}
            >
              <p className="text-2xl font-bold">{counts[s.value] ?? 0}</p>
              <p className="text-xs mt-1">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filter badge */}
        {filterStatus !== "all" && (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusInfo(filterStatus).color}`}>
              {statusInfo(filterStatus).label}
            </span>
            <button onClick={() => setFilterStatus("all")} className="text-xs text-gray-400 hover:text-gray-600">
              × عرض الكل
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Recycle size={48} className="mx-auto text-gray-300" />
            <p className="text-gray-400">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const si = statusInfo(item.status);
              const SrcIcon = SOURCE_ICONS[item.sourceType] ?? Home;
              const WIcon = WASTE_ICONS[item.wasteType] ?? Layers;
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-start gap-4 p-4">
                    {/* Source icon */}
                    <div className="bg-green-100 rounded-xl p-2.5 shrink-0 mt-1">
                      <SrcIcon size={20} className="text-green-700" />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-green-700">{item.requestCode}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${si.color}`}>
                          {si.label}
                        </span>
                        {item.linkedBatchCode && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-300 flex items-center gap-1">
                            <Link2 size={10} /> {item.linkedBatchCode}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                        <span className="flex items-center gap-1"><User size={13} className="text-gray-400" />{item.contactName}</span>
                        <span className="flex items-center gap-1"><Phone size={13} className="text-gray-400" />{item.contactPhone}</span>
                        <span className="flex items-center gap-1 col-span-full"><MapPin size={13} className="text-gray-400" />{item.address}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <WIcon size={12} /> {WASTE_LABELS[item.wasteType] ?? item.wasteType}
                        </span>
                        <span>·</span>
                        <span>{SOURCE_LABELS[item.sourceType] ?? item.sourceType}</span>
                        {item.estimatedWeightKg && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Weight size={12} /> {item.estimatedWeightKg} كغ</span>
                          </>
                        )}
                      </div>

                      {/* Timeline dates */}
                      {(item.scheduledDate || item.collectedDate || item.processingStartDate || item.completedDate) && (
                        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                          {item.scheduledDate && <span>📅 موعد: {item.scheduledDate}</span>}
                          {item.collectedDate && <span>🚛 جُمع: {item.collectedDate}</span>}
                          {item.processingStartDate && <span>🧪 تحويل: {item.processingStartDate}</span>}
                          {item.completedDate && <span>✅ اكتمل: {item.completedDate}</span>}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => setEditing(item)}
                        className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1"
                      >
                        <ChevronDown size={14} /> تحديث
                      </button>
                      <button
                        onClick={() => del(item.id)}
                        className="border border-red-200 text-red-500 hover:bg-red-50 text-xs px-3 py-2 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editing && (
        <EditModal item={editing} onClose={() => setEditing(null)} onSaved={load} />
      )}
    </div>
  );
}
