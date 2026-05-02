import { useEffect, useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import Navbar from "@/components/Navbar";
import OrderTracker from "@/components/OrderTracker";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";
import { Package, LogOut, Search, Copy, ChevronDown, ChevronUp, ShoppingBag, GraduationCap, ExternalLink, MessageSquare, Shield, Gift, BadgePercent, Share2, Users, CalendarCheck, Leaf, MapPin } from "lucide-react";
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
  subscriptionId?: number | null;
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
  const [coupons, setCoupons] = useState<{ code: string; discountPercent: number; source: string; used: boolean; expiresAt: string | null; createdAt: string }[]>([]);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [referralCode, setReferralCode] = useState<string>("");
  const [subscriptions, setSubscriptions] = useState<{
    id: number; plan_name: string; price_at_subscription: number; fertilizer_kg: number;
    crop_type: string | null; delivery_city: string; status: string;
    next_renewal_date: string; created_at: string;
  }[]>([]);
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
      const [ordersRes, enrollmentsRes, messagesRes, referralRes, subsRes] = await Promise.all([
        fetch(`${API}/api/customer/orders`, { headers: { "x-customer-token": token } }),
        fetch(`${API}/api/customer/enrollments`, { headers: { "x-customer-token": token } }),
        fetch(`${API}/api/contact/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-customer-token": token },
          body: JSON.stringify({ sessionId: null }),
        }),
        fetch(`${API}/api/customer/referral`, { headers: { "x-customer-token": token } }),
        fetch(`${API}/api/customer/subscriptions`, { headers: { "x-customer-token": token } }),
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
      if (referralRes.ok) {
        const refData = await referralRes.json();
        setReferralCode(refData.referralCode ?? "");
        setCoupons(refData.coupons ?? []);
        setTotalReferrals(refData.totalReferrals ?? 0);
      }
      if (subsRes.ok) {
        setSubscriptions(await subsRes.json());
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

  function copyReferralLink() {
    if (!referralCode) return;
    const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
    const link = `${base}/customer/login?ref=${referralCode}`;
    navigator.clipboard.writeText(link).then(() => toast({ title: "تم نسخ رابط الدعوة!", description: link }));
  }

  const SOURCE_LABELS: Record<string, string> = {
    review_reward: "مكافأة مراجعة 🌟",
    referral_referrer: "مكافأة دعوة صديق 🤝",
    referral_joinee: "خصم ترحيب بالعضو الجديد 🎉",
    donor_points: "نقاط المتبرع 💚",
  };

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

        {/* ── Rewards & Referral ─────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            {lang === "ar" ? "المكافآت والدعوة" : lang === "fr" ? "Récompenses & Parrainage" : "Rewards & Referral"}
          </h2>

          {/* Referral Card */}
          {referralCode && (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {lang === "ar" ? "ادعُ أصدقاءك واكسب!" : lang === "fr" ? "Parrainez et gagnez!" : "Refer friends & earn!"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lang === "ar"
                      ? "15% خصم لك عند شراء صديقك، و 10% لصديقك على أول طلب"
                      : lang === "fr"
                      ? "15% pour vous, 10% pour votre ami sur sa première commande"
                      : "You get 15% off, your friend gets 10% on their first order"}
                  </div>
                </div>
                {totalReferrals > 0 && (
                  <div className="mr-auto text-center">
                    <div className="text-xl font-bold text-primary">{totalReferrals}</div>
                    <div className="text-xs text-muted-foreground">{lang === "ar" ? "مدعوّ" : "invited"}</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
                <Share2 className="w-4 h-4 text-primary shrink-0" />
                <code className="text-xs flex-1 text-muted-foreground truncate" dir="ltr">
                  {`${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/customer/login?ref=${referralCode}`}
                </code>
                <button onClick={copyReferralLink} className="text-primary hover:text-primary/80 shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Coupons List */}
          {coupons.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 mb-3">
                <BadgePercent className="w-4 h-4" />
                {lang === "ar" ? "كوبوناتي" : lang === "fr" ? "Mes coupons" : "My Coupons"} ({coupons.length})
              </h3>
              {coupons.map(c => (
                <div
                  key={c.code}
                  className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${c.used ? "bg-muted/30 border-border opacity-60" : "bg-card border-border"}`}
                >
                  <BadgePercent className={`w-5 h-5 shrink-0 ${c.used ? "text-muted-foreground" : "text-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className={`text-sm font-mono font-bold tracking-wider ${c.used ? "text-muted-foreground line-through" : "text-primary"}`}>{c.code}</code>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${c.used ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                        {c.discountPercent}%
                      </span>
                      {c.used && (
                        <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium border border-red-100">
                          {lang === "ar" ? "مستخدم" : "Used"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {SOURCE_LABELS[c.source] ?? c.source}
                      {c.expiresAt && !c.used && (
                        <> · {lang === "ar" ? "ينتهي" : "Expires"}: {format(new Date(c.expiresAt), "d MMM yyyy", { locale: dateLocale })}</>
                      )}
                    </div>
                  </div>
                  {!c.used && (
                    <button
                      onClick={() => navigator.clipboard.writeText(c.code).then(() => toast({ title: "تم نسخ الكود!" }))}
                      className="text-muted-foreground hover:text-primary shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-2xl">
              <BadgePercent className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {lang === "ar" ? "لا توجد كوبونات بعد — اكتب مراجعة أو ادعُ صديقاً!" : "No coupons yet — write a review or invite a friend!"}
              </p>
            </div>
          )}
        </section>

        {/* ── My Subscriptions ─────────────────────────────────────────────── */}
        {subscriptions.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" />
                {lang === "ar" ? "اشتراكاتي الشهرية" : lang === "fr" ? "Mes abonnements" : "My Subscriptions"}
                <span className="text-sm font-normal text-muted-foreground">({subscriptions.length})</span>
              </h2>
              <a href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/subscriptions`} className="text-xs text-primary hover:underline">
                + {lang === "ar" ? "اشتراك جديد" : "New subscription"}
              </a>
            </div>
            <div className="space-y-3">
              {subscriptions.map(sub => {
                const subStatusColors: Record<string, string> = {
                  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                };
                const subStatusLabels: Record<string, string> = {
                  active: lang === "ar" ? "نشط" : "Active",
                  paused: lang === "ar" ? "موقوف" : "Paused",
                  cancelled: lang === "ar" ? "ملغى" : "Cancelled",
                };
                const deliveries: Array<{
                  id: number; month_label: string; status: string;
                  tracking_number: string | null; shipped_at: string | null; delivered_at: string | null;
                }> = (sub as any).deliveries ?? [];
                const latestDelivery = deliveries[0] ?? null;
                const delStatusLabel: Record<string, string> = {
                  preparing: lang === "ar" ? "🟡 قيد الإعداد" : "🟡 Preparing",
                  shipped: lang === "ar" ? "🔵 في الطريق" : "🔵 Shipped",
                  delivered: lang === "ar" ? "✅ تم التسليم" : "✅ Delivered",
                };
                return (
                  <div key={sub.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    {/* Main row */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                        <CalendarCheck className="w-5 h-5 text-green-700 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{sub.plan_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subStatusColors[sub.status] ?? ""}`}>
                            {subStatusLabels[sub.status] ?? sub.status}
                          </span>
                          {(sub as any).payment_method === "online" && (sub as any).payment_status !== "paid" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              ⏳ {lang === "ar" ? "في انتظار الدفع" : "Awaiting payment"}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span className="flex items-center gap-1"><Leaf className="w-3 h-3" />{sub.fertilizer_kg} كغ/شهر</span>
                          {sub.crop_type && <span>{sub.crop_type}</span>}
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{sub.delivery_city}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-primary">{sub.price_at_subscription.toLocaleString("ar-DZ")} د.ج</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {lang === "ar" ? "التجديد" : "Renews"}: {format(new Date(sub.next_renewal_date), "d MMM", { locale: dateLocale })}
                        </div>
                      </div>
                    </div>
                    {/* Latest delivery status */}
                    {latestDelivery && (
                      <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">{latestDelivery.month_label}:</span>
                          <span className="text-xs font-medium">{delStatusLabel[latestDelivery.status] ?? latestDelivery.status}</span>
                        </div>
                        {latestDelivery.tracking_number && (
                          <code className="text-xs font-mono bg-background border border-border px-2 py-0.5 rounded" dir="ltr">
                            {latestDelivery.tracking_number}
                          </code>
                        )}
                        {latestDelivery.shipped_at && latestDelivery.status === "shipped" && (
                          <span className="text-xs text-muted-foreground">
                            أُرسل: {format(new Date(latestDelivery.shipped_at), "d MMM", { locale: dateLocale })}
                          </span>
                        )}
                        {deliveries.length > 1 && (
                          <span className="text-xs text-muted-foreground">{deliveries.length} توصيلات</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
                        {order.subscriptionId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            📦 اشتراك شهري
                          </span>
                        )}
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
