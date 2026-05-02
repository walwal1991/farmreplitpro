import AdminSidebar from "@/components/AdminSidebar";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Package, MapPin, Phone, Leaf, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Subscription {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  plan_name: string;
  price_at_subscription: number;
  fertilizer_kg: number;
  crop_type: string | null;
  delivery_address: string;
  delivery_city: string;
  status: string;
  start_date: string;
  next_renewal_date: string;
  notes: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  paused: "موقوف",
  cancelled: "ملغى",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminSubscriptions() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const { toast } = useToast();

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function fetchSubs() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/subscriptions`, {
        headers: { "x-admin-token": token ?? "" },
      });
      if (res.ok) setSubs(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchSubs();
  }, [token]);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    try {
      await fetch(`${API}/api/admin/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token ?? "" },
        body: JSON.stringify({ status }),
      });
      toast({ title: "تم تحديث الحالة" });
      setSubs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = statusFilter === "all" ? subs : subs.filter(s => s.status === statusFilter);

  const stats = {
    active: subs.filter(s => s.status === "active").length,
    paused: subs.filter(s => s.status === "paused").length,
    cancelled: subs.filter(s => s.status === "cancelled").length,
    revenue: subs.filter(s => s.status === "active").reduce((sum, s) => sum + s.price_at_subscription, 0),
  };

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            الاشتراكات الشهرية
          </h1>
          <button
            onClick={fetchSubs}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "نشطة", value: stats.active, color: "text-green-600" },
            { label: "موقوفة", value: stats.paused, color: "text-yellow-600" },
            { label: "ملغاة", value: stats.cancelled, color: "text-red-500" },
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
          {["all", "active", "paused", "cancelled"].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f === "all" ? "الكل" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[sub.status] ?? ""}`}>
                          {STATUS_LABELS[sub.status] ?? sub.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{sub.plan_name}</span>
                        <span>·</span>
                        <span>{sub.price_at_subscription.toLocaleString("ar-DZ")} د.ج/شهر</span>
                        <span>·</span>
                        <span>{sub.delivery_city}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground hidden md:block">
                      {format(new Date(sub.created_at), "d MMM yyyy", { locale: ar })}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/20 space-y-4">
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 shrink-0" />
                          <span>{sub.customer_phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>{sub.delivery_city} — {sub.delivery_address}</span>
                        </div>
                        {sub.crop_type && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Leaf className="w-4 h-4 shrink-0" />
                            <span>المحصول: {sub.crop_type}</span>
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          التجديد القادم: {format(new Date(sub.next_renewal_date), "d MMM yyyy", { locale: ar })}
                        </div>
                        <div className="text-muted-foreground">
                          الكمية: {sub.fertilizer_kg} كغ / شهر
                        </div>
                      </div>

                      {sub.notes && (
                        <p className="text-sm text-muted-foreground bg-muted rounded-xl px-3 py-2">{sub.notes}</p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {sub.status !== "active" && (
                          <button
                            disabled={updatingId === sub.id}
                            onClick={() => updateStatus(sub.id, "active")}
                            className="px-4 py-2 rounded-xl text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 transition-colors disabled:opacity-50"
                          >
                            تفعيل
                          </button>
                        )}
                        {sub.status === "active" && (
                          <button
                            disabled={updatingId === sub.id}
                            onClick={() => updateStatus(sub.id, "paused")}
                            className="px-4 py-2 rounded-xl text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 transition-colors disabled:opacity-50"
                          >
                            إيقاف مؤقت
                          </button>
                        )}
                        {sub.status !== "cancelled" && (
                          <button
                            disabled={updatingId === sub.id}
                            onClick={() => updateStatus(sub.id, "cancelled")}
                            className="px-4 py-2 rounded-xl text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors disabled:opacity-50"
                          >
                            إلغاء الاشتراك
                          </button>
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
