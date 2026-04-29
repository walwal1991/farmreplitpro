import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Recycle, Leaf, TreePine, Sprout, Star, Gift,
  LogOut, Clock, CalendarCheck, Truck, FlaskConical,
  CheckCircle2, ClipboardList, Copy, Check, ChevronDown,
  ChevronUp, AlertCircle,
} from "lucide-react";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const TOKEN = () => localStorage.getItem("donorToken") ?? "";

type Donor = {
  id: number; name: string; phone: string;
  greenPoints: number; totalKgDonated: string;
  badge: string; createdAt: string;
};
type WC = {
  id: number; requestCode: string; sourceType: string;
  wasteType: string; estimatedWeightKg: string | null;
  status: string; scheduledDate: string | null;
  collectedDate: string | null; processingStartDate: string | null;
  completedDate: string | null; notes: string | null; createdAt: string;
};
type DC = {
  id: number; code: string; discountPercent: number;
  pointsUsed: number; used: boolean; usedAt: string | null; createdAt: string;
};

const BADGES: Record<string, { icon: typeof Leaf; label: string; color: string; next: string | null; nextKg: number | null }> = {
  seedling: { icon: Sprout, label: "بذرة", color: "text-green-500 bg-green-100", next: "plant", nextKg: 30 },
  plant:    { icon: Leaf,    label: "نبتة",  color: "text-emerald-600 bg-emerald-100", next: "tree", nextKg: 100 },
  tree:     { icon: TreePine, label: "شجرة", color: "text-green-800 bg-green-200", next: null, nextKg: null },
};

const STATUS_STEPS = [
  { key: "pending",    label: "استلام الطلب",    icon: ClipboardList,  color: "bg-yellow-500" },
  { key: "scheduled",  label: "تحديد موعد الجمع", icon: CalendarCheck,  color: "bg-blue-500" },
  { key: "collected",  label: "جمع النفايات",     icon: Truck,          color: "bg-indigo-500" },
  { key: "processing", label: "التحويل بالديدان", icon: FlaskConical,   color: "bg-purple-500" },
  { key: "completed",  label: "سماد جاهز ✓",     icon: CheckCircle2,   color: "bg-green-600" },
];
const STATUS_ORDER = STATUS_STEPS.map(s => s.key);

const REDEMPTION_TIERS = [
  { points: 200, discount: 20 },
  { points: 100, discount: 10 },
  { points: 50,  discount: 5  },
];

function statusIdx(s: string) { return STATUS_ORDER.indexOf(s); }

function CollectionCard({ wc }: { wc: WC }) {
  const [open, setOpen] = useState(false);
  const idx = statusIdx(wc.status);
  const step = STATUS_STEPS[idx];
  const StepIcon = step?.icon ?? ClipboardList;
  const kg = wc.estimatedWeightKg ? parseFloat(wc.estimatedWeightKg) : null;
  const pts = wc.status === "completed" ? (kg ? Math.round(kg * 10) : 50) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${step?.color ?? "bg-gray-300"}`}>
          <StepIcon size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-green-700 text-sm">{wc.requestCode}</span>
            {pts && (
              <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded-full font-bold">
                +{pts} نقطة
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{step?.label ?? wc.status} · {new Date(wc.createdAt).toLocaleDateString("ar-MA")}</p>
        </div>
        <button onClick={() => setOpen(o => !o)} className="text-gray-400 hover:text-gray-600">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3">
          {/* Mini progress bar */}
          <div className="flex gap-1 mb-3">
            {STATUS_STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-1.5 flex-1 rounded-full transition-all ${i <= idx ? s.color : "bg-gray-100"}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            {kg && <span>الكمية: <b>{kg} كغ</b></span>}
            {wc.scheduledDate && <span>موعد الجمع: <b>{wc.scheduledDate}</b></span>}
            {wc.completedDate && <span>تاريخ الاكتمال: <b>{wc.completedDate}</b></span>}
          </div>
          {wc.notes && (
            <p className="mt-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">{wc.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

function CouponCard({ dc }: { dc: DC }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(dc.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className={`rounded-2xl border-2 p-4 flex items-center gap-4
      ${dc.used ? "border-gray-200 bg-gray-50 opacity-60" : "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
        ${dc.used ? "bg-gray-200" : "bg-green-600"}`}>
        <Gift size={20} className={dc.used ? "text-gray-400" : "text-white"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-mono font-bold text-lg tracking-wider ${dc.used ? "text-gray-400 line-through" : "text-green-700"}`}>
          {dc.code}
        </p>
        <p className="text-xs text-gray-500">{dc.discountPercent}% خصم · {dc.used ? "مُستخدم" : "صالح للاستخدام"}</p>
      </div>
      {!dc.used && (
        <button
          onClick={copy}
          className="shrink-0 bg-green-700 hover:bg-green-800 text-white p-2 rounded-lg transition"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      )}
    </div>
  );
}

export default function DonorDashboard() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<{ donor: Donor; collections: WC[]; discountCodes: DC[]; tiers: typeof REDEMPTION_TIERS } | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [redeemError, setRedeemError] = useState("");

  async function load() {
    const res = await fetch(`${API}/api/donors/me`, {
      headers: { "x-donor-token": TOKEN() },
    });
    if (res.status === 401) { setLocation("/donor/login"); return; }
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function redeem(points: number) {
    setRedeemError("");
    setRedeeming(points);
    try {
      const res = await fetch(`${API}/api/donors/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-donor-token": TOKEN() },
        body: JSON.stringify({ points }),
      });
      const d = await res.json();
      if (!res.ok) { setRedeemError(d.error ?? "حدث خطأ"); return; }
      load();
    } finally {
      setRedeeming(null);
    }
  }

  async function logout() {
    await fetch(`${API}/api/donors/logout`, {
      method: "POST",
      headers: { "x-donor-token": TOKEN() },
    }).catch(() => {});
    localStorage.removeItem("donorToken");
    setLocation("/waste-collection");
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-green-700 animate-pulse">جارٍ التحميل...</div>
      </div>
    );
  }
  if (!data) return null;

  const { donor, collections, discountCodes } = data;
  const badge = BADGES[donor.badge] ?? BADGES.seedling;
  const BadgeIcon = badge.icon;
  const totalKg = parseFloat(donor.totalKgDonated ?? "0");
  const completedCount = collections.filter(c => c.status === "completed").length;

  const availableTiers = REDEMPTION_TIERS.filter(t => donor.greenPoints >= t.points);
  const unusedCodes = discountCodes.filter(d => !d.used);
  const usedCodes = discountCodes.filter(d => d.used);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Recycle size={26} />
              <h1 className="text-xl font-bold">لوحتي الخضراء</h1>
            </div>
            <button onClick={logout} className="flex items-center gap-1 text-green-200 hover:text-white text-sm transition">
              <LogOut size={16} /> خروج
            </button>
          </div>

          {/* Donor profile row */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${badge.color}`}>
              <BadgeIcon size={28} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{donor.name}</p>
              <p className="text-green-200 text-sm">{donor.phone}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold">{donor.greenPoints}</p>
              <p className="text-green-200 text-xs">نقطة خضراء</p>
            </div>
          </div>

          {/* Badge + progress */}
          <div className="mt-4 bg-white/15 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <BadgeIcon size={16} /> شارة: <b>{badge.label}</b>
              </span>
              <span>{totalKg.toFixed(1)} كغ متبرَّع بها</span>
            </div>
            {badge.next && badge.nextKg && (
              <>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${Math.min(100, (totalKg / badge.nextKg) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-green-200 text-center">
                  {Math.max(0, badge.nextKg - totalKg).toFixed(1)} كغ للوصول إلى شارة {BADGES[badge.next]?.label}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-green-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-700">{collections.length}</p>
            <p className="text-xs text-gray-500 mt-1">طلبات تبرع</p>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-1">مكتملة</p>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-yellow-600">{unusedCodes.length}</p>
            <p className="text-xs text-gray-500 mt-1">كوبونات نشطة</p>
          </div>
        </div>

        {/* ── Redeem points ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
          <h2 className="font-bold text-green-900 mb-1 flex items-center gap-2">
            <Gift size={18} className="text-green-600" /> استبدال النقاط بكوبون خصم
          </h2>
          <p className="text-xs text-gray-500 mb-4">لديك <b>{donor.greenPoints}</b> نقطة. استبدلها بكوبون خصم مباشر في المتجر.</p>

          {redeemError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm mb-3">
              <AlertCircle size={15} /> {redeemError}
            </div>
          )}

          <div className="space-y-2">
            {REDEMPTION_TIERS.map(tier => {
              const canRedeem = donor.greenPoints >= tier.points;
              return (
                <div
                  key={tier.points}
                  className={`flex items-center justify-between rounded-xl border p-3 transition
                    ${canRedeem ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50 opacity-60"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                      ${canRedeem ? "bg-green-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                      {tier.discount}%
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{tier.discount}% خصم على طلبك</p>
                      <p className="text-xs text-gray-500">{tier.points} نقطة</p>
                    </div>
                  </div>
                  <button
                    disabled={!canRedeem || redeeming !== null}
                    onClick={() => redeem(tier.points)}
                    className={`text-sm font-bold px-4 py-2 rounded-lg transition
                      ${canRedeem ? "bg-green-700 hover:bg-green-800 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                  >
                    {redeeming === tier.points ? "..." : "استبدال"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            10 نقاط لكل كيلوغرام متبرَّع به · 50 نقطة لكل طلب بدون وزن
          </p>
        </div>

        {/* ── Active coupons ────────────────────────────────────────────────────── */}
        {unusedCodes.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-green-900 flex items-center gap-2">
              <Star size={18} className="text-yellow-500" /> كوبوناتي النشطة
            </h2>
            {unusedCodes.map(dc => <CouponCard key={dc.id} dc={dc} />)}
          </div>
        )}

        {/* ── Donation history ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="font-bold text-green-900 flex items-center gap-2">
            <Recycle size={18} className="text-green-600" /> سجل تبرعاتي
          </h2>
          {collections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-green-200 p-8 text-center text-gray-400">
              <Recycle size={36} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد تبرعات بعد</p>
              <Link href="/waste-collection">
                <button className="mt-4 text-green-700 text-sm font-bold hover:underline">
                  سجّل أول تبرع ←
                </button>
              </Link>
            </div>
          ) : (
            collections.map(wc => <CollectionCard key={wc.id} wc={wc} />)
          )}
        </div>

        {/* ── Used coupons ─────────────────────────────────────────────────────── */}
        {usedCodes.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-400 text-sm flex items-center gap-2">كوبونات مُستخدمة</h2>
            {usedCodes.map(dc => <CouponCard key={dc.id} dc={dc} />)}
          </div>
        )}

        {/* New donation CTA */}
        <Link href="/waste-collection">
          <button className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-2xl text-base transition flex items-center justify-center gap-2">
            <Recycle size={20} /> سجّل طلب تبرع جديد
          </button>
        </Link>
      </div>
    </div>
  );
}
