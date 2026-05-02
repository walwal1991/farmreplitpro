import AdminSidebar from "@/components/AdminSidebar";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw, Package, MapPin, Phone, Leaf, ChevronDown, ChevronUp,
  Truck, CheckCircle2, Clock, Plus, Save, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Delivery {
  id: number;
  month_label: string;
  status: string;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Subscription {
  id: number;
  customer_name: string;
  customer_phone: string;
  plan_name: string;
  price_at_subscription: number;
  fertilizer_kg: number;
  crop_type: string | null;
  delivery_address: string;
  delivery_city: string;
  status: string;
  payment_method: string;
  payment_status: string;
  start_date: string;
  next_renewal_date: string;
  notes: string | null;
  created_at: string;
  deliveries: Delivery[];
}

const SUB_STATUS_LABELS: Record<string, string> = {
  active: "نشط", paused: "موقوف", cancelled: "ملغى", pending_payment: "في انتظار الدفع",
};
const SUB_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending_payment: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};
const DEL_STATUS_LABELS: Record<string, string> = {
  preparing: "قيد الإعداد", shipped: "تم الإرسال", delivered: "تم التسليم",
};
const DEL_STATUS_COLORS: Record<string, string> = {
  preparing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};
const DEL_STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  preparing: Clock, shipped: Truck, delivered: CheckCircle2,
};

function getCurrentMonthLabel() {
  return new Date().toLocaleString("ar-DZ", { month: "long", year: "numeric" });
}

export default function AdminSubscriptions() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const { toast } = useToast();

  useEffect(() => { if (!token) setLocation("/admin/login"); }, [token, setLocation]);

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingSubId, setUpdatingSubId] = useState<number | null>(null);
  const [updatingDelId, setUpdatingDelId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<number | null>(null);

  // Per-subscription new delivery form
  const [newDeliveryLabel, setNewDeliveryLabel] = useState<Record<number, string>>({});
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({});

  async function fetchSubs() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/subscriptions`, {
        headers: { "x-admin-token": token ?? "" },
      });
      if (res.ok) setSubs(await res.json());
    } finally { setLoading(false); }
  }
  useEffect(() => { if (token) fetchSubs(); }, [token]);

  async function deleteSub(id: number) {
    setDeletingSubId(id);
    try {
      await fetch(`${API}/api/admin/subscriptions/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token ?? "" },
      });
      toast({ title: "تم حذف الاشتراك بنجاح" });
      setSubs(prev => prev.filter(s => s.id !== id));
      setDeleteConfirmId(null);
    } finally { setDeletingSubId(null); }
  }

  async function updateSubStatus(id: number, status: string) {
    setUpdatingSubId(id);
    try {
      await fetch(`${API}/api/admin/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token ?? "" },
        body: JSON.stringify({ status }),
      });
      toast({ title: "تم تحديث الاشتراك" });
      setSubs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } finally { setUpdatingSubId(null); }
  }

  async function createDelivery(subId: number) {
    const label = newDeliveryLabel[subId] ?? getCurrentMonthLabel();
    const res = await fetch(`${API}/api/admin/subscriptions/${subId}/deliveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token ?? "" },
      body: JSON.stringify({ monthLabel: label }),
    });
    if (res.ok) {
      toast({ title: `تم إنشاء توصيل ${label}` });
      fetchSubs();
    }
  }

  async function updateDelivery(delId: number, patch: { status?: string; trackingNumber?: string }) {
    setUpdatingDelId(delId);
    try {
      await fetch(`${API}/api/admin/deliveries/${delId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token ?? "" },
        body: JSON.stringify(patch),
      });
      toast({ title: "تم تحديث التوصيل" });
      fetchSubs();
    } finally { setUpdatingDelId(null); }
  }

  const filtered = statusFilter === "all" ? subs : subs.filter(s => s.status === statusFilter);
  const stats = {
    active: subs.filter(s => s.status === "active").length,
    pending: subs.filter(s => s.status === "pending_payment").length,
    paused: subs.filter(s => s.status === "paused").length,
    revenue: subs.filter(s => s.status === "active").reduce((n, s) => n + s.price_at_subscription, 0),
  };

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            الاشتراكات الشهرية
          </h1>
          <button onClick={fetchSubs} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" />تحديث
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "نشطة", value: stats.active, color: "text-green-600" },
            { label: "في انتظار الدفع", value: stats.pending, color: "text-blue-600" },
            { label: "موقوفة", value: stats.paused, color: "text-yellow-600" },
            { label: "إيراد شهري", value: `${stats.revenue.toLocaleString("ar-DZ")} د.ج`, color: "text-primary" },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["all", "active", "pending_payment", "paused", "cancelled"].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {f === "all" ? "الكل" : SUB_STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا توجد اشتراكات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(sub => {
              const isExpanded = expandedId === sub.id;
              return (
                <div key={sub.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* Summary row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{sub.customer_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUB_STATUS_COLORS[sub.status] ?? ""}`}>
                          {SUB_STATUS_LABELS[sub.status] ?? sub.status}
                        </span>
                        {sub.payment_method === "online" && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sub.payment_status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>
                            {sub.payment_status === "paid" ? "✓ مدفوع" : "⏳ دفع إلكتروني"}
                          </span>
                        )}
                        {sub.payment_method === "cod" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">💵 دفع عند الاستلام</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{sub.plan_name}</span>·
                        <span>{sub.price_at_subscription.toLocaleString("ar-DZ")} د.ج/شهر</span>·
                        <span>{sub.delivery_city}</span>·
                        <span>{(sub.deliveries ?? []).length} توصيل</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground hidden md:block">
                      {format(new Date(sub.created_at), "d MMM yyyy", { locale: ar })}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border p-5 bg-muted/10 space-y-5">
                      {/* Customer info */}
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4 shrink-0" />{sub.customer_phone}</div>
                        <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4 shrink-0" />{sub.delivery_city} — {sub.delivery_address}</div>
                        {sub.crop_type && <div className="flex items-center gap-2 text-muted-foreground"><Leaf className="w-4 h-4 shrink-0" />المحصول: {sub.crop_type}</div>}
                        <div className="text-muted-foreground">الكمية: {sub.fertilizer_kg} كغ/شهر</div>
                        <div className="text-muted-foreground">التجديد القادم: {format(new Date(sub.next_renewal_date), "d MMM yyyy", { locale: ar })}</div>
                      </div>
                      {sub.notes && <p className="text-sm bg-muted rounded-xl px-3 py-2 text-muted-foreground">{sub.notes}</p>}

                      {/* Subscription status actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {sub.status !== "active" && sub.status !== "cancelled" && (
                          <button disabled={updatingSubId === sub.id} onClick={() => updateSubStatus(sub.id, "active")} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 disabled:opacity-50">تفعيل</button>
                        )}
                        {sub.status === "active" && (
                          <button disabled={updatingSubId === sub.id} onClick={() => updateSubStatus(sub.id, "paused")} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 disabled:opacity-50">إيقاف مؤقت</button>
                        )}
                        {sub.status !== "cancelled" && (
                          <button disabled={updatingSubId === sub.id} onClick={() => updateSubStatus(sub.id, "cancelled")} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50">إلغاء</button>
                        )}

                        {/* Delete with inline confirmation */}
                        {deleteConfirmId === sub.id ? (
                          <div className="flex items-center gap-2 mr-auto border border-red-300 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-1.5">
                            <span className="text-xs text-red-700 dark:text-red-400 font-medium">هل أنت متأكد من الحذف؟</span>
                            <button
                              disabled={deletingSubId === sub.id}
                              onClick={() => deleteSub(sub.id)}
                              className="px-2 py-0.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {deletingSubId === sub.id ? "جاري الحذف..." : "حذف"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(sub.id)}
                            className="mr-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />حذف الاشتراك
                          </button>
                        )}
                      </div>

                      {/* ── Deliveries section ─────────────────────────────── */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm flex items-center gap-1.5"><Truck className="w-4 h-4 text-primary" />التوصيلات الشهرية</h4>
                          {sub.status === "active" && (
                            <div className="flex items-center gap-2">
                              <input
                                value={newDeliveryLabel[sub.id] ?? ""}
                                onChange={e => setNewDeliveryLabel(p => ({ ...p, [sub.id]: e.target.value }))}
                                placeholder={getCurrentMonthLabel()}
                                className="border border-border rounded-lg px-2 py-1 text-xs bg-background w-32"
                              />
                              <button
                                onClick={() => createDelivery(sub.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                              >
                                <Plus className="w-3 h-3" />إضافة
                              </button>
                            </div>
                          )}
                        </div>

                        {(sub.deliveries ?? []).length === 0 ? (
                          <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-xl">لا توجد توصيلات بعد</p>
                        ) : (
                          <div className="space-y-2">
                            {(sub.deliveries ?? []).map(d => {
                              const Icon = DEL_STATUS_ICONS[d.status] ?? Clock;
                              return (
                                <div key={d.id} className="bg-card border border-border rounded-xl p-3">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                      <span className="font-medium text-sm">{d.month_label}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${DEL_STATUS_COLORS[d.status] ?? ""}`}>
                                        {DEL_STATUS_LABELS[d.status] ?? d.status}
                                      </span>
                                    </div>
                                    {d.tracking_number && (
                                      <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded" dir="ltr">{d.tracking_number}</code>
                                    )}
                                  </div>

                                  {/* Delivery actions */}
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {d.status === "preparing" && (
                                      <div className="flex items-center gap-1.5 flex-1">
                                        <input
                                          value={trackingInputs[d.id] ?? ""}
                                          onChange={e => setTrackingInputs(p => ({ ...p, [d.id]: e.target.value }))}
                                          placeholder="رقم التتبع (اختياري)"
                                          className="border border-border rounded-lg px-2 py-1 text-xs bg-background flex-1 min-w-0"
                                          dir="ltr"
                                        />
                                        <button
                                          disabled={updatingDelId === d.id}
                                          onClick={() => updateDelivery(d.id, { status: "shipped", trackingNumber: trackingInputs[d.id] || undefined })}
                                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
                                        >
                                          <Truck className="w-3 h-3" />تم الإرسال
                                        </button>
                                      </div>
                                    )}
                                    {d.status === "shipped" && (
                                      <button
                                        disabled={updatingDelId === d.id}
                                        onClick={() => updateDelivery(d.id, { status: "delivered" })}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />تم التسليم
                                      </button>
                                    )}
                                    {d.status === "delivered" && d.delivered_at && (
                                      <span className="text-xs text-muted-foreground">
                                        سُلِّم في {format(new Date(d.delivered_at), "d MMM yyyy", { locale: ar })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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
