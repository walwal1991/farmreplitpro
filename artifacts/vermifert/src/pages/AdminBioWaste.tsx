import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Leaf, Clock, BadgeCheck, Truck, Package, CheckCircle2, XCircle,
  ChevronDown, Trash2, Weight, Phone, MapPin, User, Pencil, DollarSign
} from "lucide-react";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const TOKEN = () => localStorage.getItem("adminToken") ?? "";

const WASTE_LABELS: Record<string, string> = {
  food_scraps: "بقايا طعام 🍽️",
  fruit_veg_peels: "قشور الفواكه والخضار 🥬",
  agricultural_residue: "مخلفات زراعية 🌾",
  cardboard_paper: "كرتون وورق 📦",
  coffee_grounds: "تفل القهوة ☕",
  manure: "روث حيواني 🐄",
  mixed: "مختلطة ♻️",
};

const STATUSES = [
  { value: "pending",   label: "في الانتظار",    icon: Clock,        color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "approved",  label: "موافق عليه",     icon: BadgeCheck,   color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "scheduled", label: "مجدول",          icon: Truck,        color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { value: "collected", label: "تم الاستلام",    icon: Package,      color: "bg-green-100 text-green-800 border-green-300" },
  { value: "paid",      label: "تم الدفع ✓",     icon: CheckCircle2, color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { value: "rejected",  label: "مرفوض",          icon: XCircle,      color: "bg-red-100 text-red-800 border-red-300" },
];

interface BioRequest {
  id: number;
  request_code: string;
  seller_name: string;
  seller_phone: string;
  wilaya: string;
  address: string;
  waste_type: string;
  estimated_weight_kg: string;
  price_per_kg: string;
  total_payout: string;
  actual_weight_kg: string | null;
  actual_payout: string | null;
  status: string;
  pickup_date: string | null;
  collected_date: string | null;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface Price {
  waste_type: string;
  label_ar: string;
  price_per_kg: string;
}

function statusInfo(val: string) {
  return STATUSES.find(s => s.value === val) ?? STATUSES[0];
}

function EditModal({ item, onClose, onSaved }: { item: BioRequest; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    status: item.status,
    pickupDate: item.pickup_date ?? "",
    collectedDate: item.collected_date ?? "",
    actualWeightKg: item.actual_weight_kg ?? "",
    paymentStatus: item.payment_status,
    adminNotes: item.admin_notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const estimatedActualPayout = form.actualWeightKg
    ? (parseFloat(item.price_per_kg) * parseFloat(form.actualWeightKg)).toFixed(0)
    : null;

  async function save() {
    setSaving(true);
    await fetch(`${API}/api/admin/bio-waste/${item.id}`, {
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]" dir="rtl">
        <div className="bg-gradient-to-r from-amber-700 to-yellow-600 text-white rounded-t-2xl px-6 py-4">
          <p className="font-bold text-lg">{item.request_code}</p>
          <p className="text-yellow-200 text-sm">{item.seller_name} — {item.seller_phone} — {item.wilaya}</p>
        </div>
        <div className="p-6 space-y-4">
          {/* Request summary */}
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">نوع المخلفات: </span>{WASTE_LABELS[item.waste_type] ?? item.waste_type}</div>
            <div><span className="text-gray-500">الكمية التقديرية: </span>{item.estimated_weight_kg} كغ</div>
            <div><span className="text-gray-500">السعر/كغ: </span>{item.price_per_kg} د.ج</div>
            <div><span className="text-gray-500">المبلغ التقديري: </span>
              <span className="font-bold text-green-600">{parseInt(item.total_payout ?? "0").toLocaleString("ar-DZ")} د.ج</span>
            </div>
            <div className="col-span-2"><span className="text-gray-500">طريقة الدفع: </span>{item.payment_method === "cash" ? "نقداً 💵" : "تحويل بنكي 🏦"}</div>
          </div>

          {/* Status selector */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">الحالة</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setForm(f => ({ ...f, status: s.value }))}
                  className={`border rounded-xl p-2 flex items-center gap-2 text-xs font-medium transition
                    ${form.status === s.value ? s.color + " border-current" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-amber-300"}`}
                >
                  <s.icon size={13} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">موعد الاستلام</label>
              <input
                type="date"
                value={form.pickupDate}
                onChange={e => setForm(f => ({ ...f, pickupDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">تاريخ الاستلام الفعلي</label>
              <input
                type="date"
                value={form.collectedDate}
                onChange={e => setForm(f => ({ ...f, collectedDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Actual weight & payout */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Weight size={14} /> الوزن الفعلي (كغ)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.actualWeightKg}
              onChange={e => setForm(f => ({ ...f, actualWeightKg: e.target.value }))}
              placeholder="أدخل الوزن بعد الوزن الفعلي"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {estimatedActualPayout && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-1">
                <DollarSign size={14} className="text-green-600" />
                <span className="text-sm font-bold text-green-700">المبلغ الفعلي: {parseInt(estimatedActualPayout).toLocaleString("ar-DZ")} د.ج</span>
              </div>
            )}
          </div>

          {/* Payment status */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">حالة الدفع للبائع</label>
            <select
              value={form.paymentStatus}
              onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="unpaid">لم يُدفع بعد</option>
              <option value="paid">تم الدفع ✓</option>
            </select>
          </div>

          {/* Admin notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">ملاحظات الإدارة</label>
            <textarea
              value={form.adminNotes}
              onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
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

function PricesModal({ prices, onClose, onSaved }: { prices: Price[]; onClose: () => void; onSaved: () => void }) {
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(prices.map(p => [p.waste_type, p.price_per_kg]))
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await Promise.all(
      Object.entries(vals).map(([type, price]) =>
        fetch(`${API}/api/admin/bio-waste/prices/${type}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-admin-token": TOKEN() },
          body: JSON.stringify({ pricePerKg: price }),
        })
      )
    );
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" dir="rtl">
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-t-2xl px-6 py-4">
          <p className="font-bold text-lg">تعديل أسعار الشراء</p>
          <p className="text-green-200 text-sm">السعر بالدينار الجزائري لكل كيلوغرام</p>
        </div>
        <div className="p-6 space-y-3">
          {prices.map(p => (
            <div key={p.waste_type} className="flex items-center gap-3">
              <span className="flex-1 text-sm font-medium">{WASTE_LABELS[p.waste_type] ?? p.label_ar}</span>
              <div className="flex items-center gap-1 w-32">
                <input
                  type="number"
                  min="1"
                  value={vals[p.waste_type] ?? p.price_per_kg}
                  onChange={e => setVals(v => ({ ...v, [p.waste_type]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span className="text-xs text-gray-500 shrink-0">د.ج</span>
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
            >
              {saving ? "حفظ..." : "حفظ الأسعار"}
            </button>
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBioWaste() {
  const [items, setItems] = useState<BioRequest[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BioRequest | null>(null);
  const [showPrices, setShowPrices] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  async function load() {
    setLoading(true);
    const [itemsRes, pricesRes] = await Promise.all([
      fetch(`${API}/api/admin/bio-waste`, { headers: { "x-admin-token": TOKEN() } }),
      fetch(`${API}/api/bio-waste/prices`),
    ]);
    if (itemsRes.ok) setItems(await itemsRes.json());
    if (pricesRes.ok) setPrices(await pricesRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id: number) {
    if (!confirm("حذف هذا الطلب؟")) return;
    await fetch(`${API}/api/admin/bio-waste/${id}`, {
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

  const totalEstimated = items.reduce((s, i) => s + parseFloat(i.total_payout ?? "0"), 0);
  const totalActual = items
    .filter(i => i.actual_payout)
    .reduce((s, i) => s + parseFloat(i.actual_payout!), 0);

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Leaf size={28} className="text-amber-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">سوق المخلفات العضوية</h1>
              <p className="text-sm text-gray-500">شراء المخلفات من البائعين وتحويلها إلى سماد</p>
            </div>
          </div>
          <button
            onClick={() => setShowPrices(true)}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded-xl transition text-sm"
          >
            <Pencil size={15} />
            تعديل الأسعار
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">إجمالي الطلبات</p>
            <p className="text-2xl font-extrabold text-gray-900">{items.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">في الانتظار</p>
            <p className="text-2xl font-extrabold text-yellow-600">{counts["pending"] ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">المبلغ التقديري</p>
            <p className="text-lg font-extrabold text-green-600">{totalEstimated.toLocaleString("ar-DZ")} د.ج</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">المبلغ الفعلي</p>
            <p className="text-lg font-extrabold text-emerald-700">{totalActual.toLocaleString("ar-DZ")} د.ج</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? "all" : s.value)}
              className={`rounded-xl border p-2.5 text-center transition
                ${filterStatus === s.value ? s.color + " border-current shadow-sm" : "bg-white border-gray-200 hover:border-amber-300"}`}
            >
              <p className="text-xl font-bold">{counts[s.value] ?? 0}</p>
              <p className="text-xs mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Leaf size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const si = statusInfo(item.status);
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-start gap-4 p-4">
                    <div className="bg-amber-100 rounded-xl p-2.5 shrink-0 mt-1">
                      <Leaf size={20} className="text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-700">{item.request_code}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${si.color}`}>
                          {si.label}
                        </span>
                        {item.payment_status === "paid" && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-300">💵 مدفوع</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                        <span className="flex items-center gap-1"><User size={13} className="text-gray-400" />{item.seller_name}</span>
                        <span className="flex items-center gap-1"><Phone size={13} className="text-gray-400" />{item.seller_phone}</span>
                        <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" />{item.wilaya} — {item.address}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>{WASTE_LABELS[item.waste_type] ?? item.waste_type}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Weight size={12} />{item.estimated_weight_kg} كغ مقدّر</span>
                        <span>·</span>
                        <span className="font-semibold text-green-600">{parseInt(item.total_payout ?? "0").toLocaleString("ar-DZ")} د.ج تقديري</span>
                        {item.actual_weight_kg && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-emerald-700">{parseInt(item.actual_payout ?? "0").toLocaleString("ar-DZ")} د.ج فعلي</span>
                          </>
                        )}
                      </div>
                      {item.pickup_date && (
                        <div className="text-xs text-gray-400">📅 موعد: {item.pickup_date}</div>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => setEditing(item)}
                        className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1"
                      >
                        <Pencil size={13} /> تحديث
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

      {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {showPrices && <PricesModal prices={prices} onClose={() => setShowPrices(false)} onSaved={load} />}
    </div>
  );
}
