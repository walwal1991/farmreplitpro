import { useEffect, useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import Navbar from "@/components/Navbar";
import OrderTracker from "@/components/OrderTracker";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";
import { Package, LogOut, Search, Copy, ChevronDown, ChevronUp, ShoppingBag, GraduationCap, ExternalLink, MessageSquare, Shield } from "lucide-react";
import { format } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Order {
  id: number;
  trackingNumber: string | null;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  city: string;
  address: string;
  createdAt: string;
  assignedDriverName?: string | null;
}

interface Enrollment {
  id: number;
  customerName: string;
  phone: string;
  courseId: string;
  status: string;
  trainingLink: string | null;
  createdAt: string;
}

interface ContactMessage {
  id: number;
  customerName: string;
  message: string;
  adminReply: string | null;
  isAdminInitiated: boolean;
  createdAt: string;
}

const COURSE_LABELS: Record<string, { ar: string; en: string; fr: string }> = {
  beginner:     { ar: "دورة المبتدئين", en: "Beginner Course", fr: "Cours débutant" },
  intermediate: { ar: "دورة الإنتاج المتكامل", en: "Intermediate Course", fr: "Cours intermédiaire" },
  workshop:     { ar: "ورشة عملية ميدانية", en: "Field Workshop", fr: "Atelier pratique" },
  professional: { ar: "برنامج التكوين المهني", en: "Professional Program", fr: "Programme professionnel" },
};

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, lang } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const token = localStorage.getItem("customerToken");
  const userStr = localStorage.getItem("customerUser");
  const user = userStr ? JSON.parse(userStr) : null;

  const dateLocale = lang === "ar" ? ar : lang === "fr" ? fr : enUS;

  const STATUS_LABELS: Record<string, string> = {
    pending: t("status_pending"),
    confirmed: t("status_confirmed"),
    shipped: t("status_shipped"),
    delivered: t("status_delivered"),
    cancelled: t("status_cancelled"),
  };

  const STATUS_COLORS: Record<string, string> = {
    pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    shipped:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ordersRes, enrollmentsRes, messagesRes] = await Promise.all([
        fetch(`${API}/api/customer/orders`, { headers: { "x-customer-token": token } }),
        fetch(`${API}/api/customer/enrollments`, { headers: { "x-customer-token": token } }),
        fetch(`${API}/api/contact/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-customer-token": token },
          body: JSON.stringify({ sessionId: null }),
        }),
      ]);
      if (ordersRes.status === 401) { setLocation("/customer/login"); return; }
      const ordersData = await ordersRes.json();
      setOrders(ordersData);
      if (enrollmentsRes.ok) {
        setEnrollments(await enrollmentsRes.json());
      }
      if (messagesRes.ok) {
        setMessages(await messagesRes.json());
      }
    } finally { setLoading(false); }
  }, [token, setLocation]);

  useEffect(() => {
    if (!token) { setLocation("/customer/login"); return; }
    fetchOrders();
  }, [token, setLocation, fetchOrders]);

  async function handleLogout() {
    if (token) {
      await fetch(`${API}/api/customer/logout`, { method: "POST", headers: { "x-customer-token": token } });
    }
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");
    setLocation("/");
  }

  function copyTracking(tn: string) {
    navigator.clipboard.writeText(tn).then(() => toast({ title: t("dash_copy_tracking"), description: tn }));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t("nav_welcome")}, {user?.name ?? ""}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/track">
                <Search className="w-4 h-4 me-1.5" />
                {t("nav_track_order")}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="w-4 h-4 me-1.5" />
              {t("dash_logout")}
            </Button>
          </div>
        </div>

        {/* ── My Courses ───────────────────────────────────────────────────── */}
        {enrollments.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              {lang === "ar" ? "دوراتي التكوينية" : lang === "fr" ? "Mes formations" : "My Courses"}
              <span className="text-sm font-normal text-muted-foreground">({enrollments.length})</span>
            </h2>
            <div className="space-y-3">
              {enrollments.map((enroll) => {
                const label = COURSE_LABELS[enroll.courseId]?.[lang] ?? enroll.courseId;
                const isConfirmed = enroll.status === "confirmed";
                return (
                  <div key={enroll.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm">{label}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isConfirmed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                          {isConfirmed
                            ? (lang === "ar" ? "مؤكّدة" : lang === "fr" ? "Confirmée" : "Confirmed")
                            : (lang === "ar" ? "قيد المعالجة" : lang === "fr" ? "En attente" : "Pending")}
                        </span>
                      </div>
                      {enroll.trainingLink ? (
                        <a
                          href={enroll.trainingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {lang === "ar" ? "الدخول إلى الدورة" : lang === "fr" ? "Accéder à la formation" : "Access course"}
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {lang === "ar" ? "سيتوفر رابط الدورة قريباً — سنتواصل معك" : lang === "fr" ? "Le lien sera disponible bientôt" : "Course link coming soon — we'll contact you"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Messages ─────────────────────────────────────────────────── */}
        {messages.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {lang === "ar" ? "رسائلي" : lang === "fr" ? "Mes messages" : "My Messages"}
              <span className="text-sm font-normal text-muted-foreground">({messages.length})</span>
            </h2>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  {/* Admin-initiated message */}
                  {msg.isAdminInitiated && (
                    <div className="bg-primary/5 border-b border-primary/10 px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-primary">
                          {lang === "ar" ? "رسالة من الإدارة" : lang === "fr" ? "Message de l'administration" : "Message from Admin"}
                        </span>
                        <span className="text-xs text-muted-foreground ms-auto">
                          {format(new Date(msg.createdAt), "d MMM yyyy", { locale: lang === "ar" ? ar : lang === "fr" ? fr : enUS })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{msg.message}</p>
                    </div>
                  )}

                  {/* Customer message (non-admin initiated) */}
                  {!msg.isAdminInitiated && (
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {lang === "ar" ? "رسالتك" : lang === "fr" ? "Votre message" : "Your message"}
                        </span>
                        <span className="text-xs text-muted-foreground ms-auto">
                          {format(new Date(msg.createdAt), "d MMM yyyy", { locale: lang === "ar" ? ar : lang === "fr" ? fr : enUS })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{msg.message}</p>
                    </div>
                  )}

                  {/* Admin reply (for customer-initiated messages) */}
                  {!msg.isAdminInitiated && msg.adminReply && (
                    <div className="bg-primary/5 border-t border-primary/10 px-5 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-primary">
                          {lang === "ar" ? "رد الإدارة" : lang === "fr" ? "Réponse" : "Admin Reply"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{msg.adminReply}</p>
                    </div>
                  )}

                  {/* Pending reply */}
                  {!msg.isAdminInitiated && !msg.adminReply && (
                    <div className="bg-muted/40 border-t border-border px-5 py-2.5">
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "في انتظار رد الإدارة..." : lang === "fr" ? "En attente de réponse..." : "Awaiting admin reply..."}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          {t("dash_orders")} ({orders.length})
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t("dash_no_orders")}</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/products">{t("dash_start_shopping")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const expanded = expandedId === order.id;
              return (
                <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <button
                    className="w-full text-right px-5 py-4 flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base">{order.productName}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? ""}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                        <span>{t("dash_qty")} {order.quantity}</span>
                        <span>{order.totalPrice.toLocaleString()} د.ج</span>
                        <span>{format(new Date(order.createdAt), "d MMMM yyyy", { locale: dateLocale })}</span>
                      </div>
                      {order.trackingNumber && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-xs text-muted-foreground">{t("dash_tracking")}</span>
                          <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded" dir="ltr">{order.trackingNumber}</code>
                          <button onClick={e => { e.stopPropagation(); copyTracking(order.trackingNumber!); }} className="text-muted-foreground hover:text-foreground transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-muted-foreground shrink-0 mt-0.5">
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-border px-5 pb-5 pt-4">
                      <OrderTracker status={order.status} assignedDriverName={order.assignedDriverName} />
                      <div className="mt-4 text-sm text-muted-foreground border-t border-border pt-3">
                        <p><span className="font-medium text-foreground">{t("dash_address")}</span> {order.address}، {order.city}</p>
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
