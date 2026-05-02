import { useEffect, useState } from "react";
import { useSearch, Link } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Copy, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface OrderStatus {
  kind: "order";
  paymentStatus: "pending" | "awaiting" | "paid" | "failed";
  orderStatus: string;
  trackingNumber: string;
}
interface SubscriptionStatus {
  kind: "subscription";
  paymentStatus: "awaiting" | "paid" | "failed" | "cod";
  subscriptionStatus: string;
  planName: string;
}
type StatusData = OrderStatus | SubscriptionStatus;

export default function PaymentResult({ type }: { type: "success" | "failed" }) {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("order");
  const subscriptionId = params.get("subscription");
  const { toast } = useToast();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [polls, setPolls] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!orderId && !subscriptionId) {
      // No ID in URL — likely returning from subscription redirect; just show success
      setStatus({ kind: "subscription", paymentStatus: "paid", subscriptionStatus: "active", planName: "" });
      return;
    }

    const check = async () => {
      try {
        if (subscriptionId) {
          const res = await fetch(`${API}/api/payments/subscription/status/${subscriptionId}`);
          if (res.ok) {
            const data = await res.json();
            setStatus({ kind: "subscription", ...data });
            if (data.paymentStatus === "paid" || data.paymentStatus === "failed") return;
          }
        } else if (orderId) {
          const res = await fetch(`${API}/api/payments/status/${orderId}`);
          if (res.ok) {
            const data = await res.json();
            setStatus({ kind: "order", ...data });
            if (data.paymentStatus === "paid" || data.paymentStatus === "failed") return;
          }
        }
      } catch { /* ignore */ }
      setPolls(p => p + 1);
    };

    check();
  }, [orderId, subscriptionId, polls]);

  useEffect(() => {
    if (!status) return;
    if (status.paymentStatus === "paid" || status.paymentStatus === "failed") return;
    if (polls > 12) { setTimedOut(true); return; }
    const t = setTimeout(() => setPolls(p => p + 1), 2500);
    return () => clearTimeout(t);
  }, [polls, status]);

  const isPaid = status?.paymentStatus === "paid";
  const isFailed = type === "failed" || status?.paymentStatus === "failed";
  const isLoading = !timedOut && !isPaid && !isFailed && type === "success";

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center shadow-lg space-y-5">

          {isFailed ? (
            <>
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold">فشلت عملية الدفع</h2>
              <p className="text-muted-foreground text-sm">لم يتم إتمام الدفع. لم يتم خصم أي مبلغ من حسابك.</p>
              {status?.kind === "order" && status.trackingNumber && (
                <p className="text-sm text-muted-foreground">رقم التتبع: <code className="font-mono font-bold text-foreground" dir="ltr">{status.trackingNumber}</code></p>
              )}
              <div className="flex flex-col gap-2 pt-2">
                <Button asChild variant="default"><Link href="/products">العودة للتسوق</Link></Button>
                <Button asChild variant="outline"><Link href="/customer/dashboard">لوحة التحكم</Link></Button>
              </div>
            </>

          ) : isLoading ? (
            <>
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl font-bold">جارٍ التحقق من الدفع…</h2>
              <p className="text-muted-foreground text-sm">يرجى الانتظار، نتحقق من حالة معاملتك.</p>
              <p className="text-xs text-muted-foreground">({polls}/12)</p>
            </>

          ) : (
            /* Paid or timed-out showing success */
            <>
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">
                {subscriptionId ? "تم تفعيل اشتراكك! 🎉" : "تم الدفع بنجاح! 🎉"}
              </h2>

              {subscriptionId ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    {timedOut
                      ? "قد يستغرق تأكيد الدفع بضع دقائق. سيتم تفعيل اشتراكك تلقائياً بعد التحقق."
                      : "تم استلام دفعتك وتفعيل اشتراكك الشهري. سيتم إعداد صندوقك الأول وإرساله قريباً."}
                  </p>
                  {status?.kind === "subscription" && status.planName && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                      <p className="text-sm font-semibold text-primary">{status.planName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">اشتراك نشط</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">تم استلام دفعتك وسيتم تأكيد طلبك قريباً.</p>
                  {status?.kind === "order" && status.trackingNumber && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-2">رقم تتبع الطلب</p>
                      <div className="flex items-center justify-center gap-2">
                        <code className="text-lg font-mono font-bold text-primary tracking-widest" dir="ltr">
                          {status.trackingNumber}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText((status as OrderStatus).trackingNumber);
                            toast({ title: "تم نسخ رقم التتبع!" });
                          }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col gap-2 pt-2">
                {status?.kind === "order" && (status as OrderStatus).trackingNumber && (
                  <Button asChild variant="default">
                    <Link href={`/track/${(status as OrderStatus).trackingNumber}`}>تتبع الطلب</Link>
                  </Button>
                )}
                <Button asChild variant={subscriptionId ? "default" : "outline"}>
                  <Link href="/customer/dashboard">
                    <LayoutDashboard className="w-4 h-4 me-2" />
                    لوحة التحكم
                  </Link>
                </Button>
                {subscriptionId && (
                  <Button asChild variant="outline">
                    <Link href="/subscriptions">استعراض الخطط</Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
