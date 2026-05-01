import Navbar from "@/components/Navbar";
import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";
import { ShoppingBag, CheckCircle2, Trash2, Plus, Minus, Copy, LayoutDashboard, PenLine, CreditCard, Banknote, Clock, ExternalLink, Tag, X, BadgePercent } from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const formSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(5),
  city: z.string().min(2),
  notes: z.string().optional(),
});
type FormVals = z.infer<typeof formSchema>;

interface OrderResult { id: number; trackingNumber?: string | null; }

export default function Cart() {
  const { items, total, setQty, remove, clear } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<OrderResult[] | null>(null);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [onlineOrderPending, setOnlineOrderPending] = useState<{ orders: OrderResult[]; checkoutUrls: string[] } | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  const customerToken = localStorage.getItem("customerToken") ?? "";
  const customerUser = (() => {
    try { return JSON.parse(localStorage.getItem("customerUser") ?? "null"); } catch { return null; }
  })();

  const form = useForm<FormVals>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: customerUser?.name ?? "",
      phone: customerUser?.phone ?? "",
      address: "",
      city: "",
      notes: "",
    },
  });

  const onSubmit = async (vals: FormVals) => {
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customerToken) headers["x-customer-token"] = customerToken;

      const ordered: OrderResult[] = [];
      const checkoutUrls: string[] = [];

      for (const it of items) {
        const res = await fetch(`${API}/api/orders`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            customerName: vals.customerName,
            phone: vals.phone,
            address: vals.address,
            city: vals.city,
            notes: vals.notes ?? "",
            productId: it.id,
            quantity: it.quantity,
            requiresSignature,
            paymentMethod,
            discountCode: appliedDiscount?.code ?? null,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast({ title: t("checkout_error"), description: json.error ?? "", variant: "destructive" });
          return;
        }
        ordered.push({ id: json.id, trackingNumber: json.trackingNumber });
        if (json.checkoutUrl) checkoutUrls.push(json.checkoutUrl);
      }

      clear();

      if (paymentMethod === "online" && checkoutUrls.length > 0) {
        setOnlineOrderPending({ orders: ordered, checkoutUrls });
        checkoutUrls.forEach(url => window.open(url, "_blank"));
        return;
      }

      setResults(ordered);
    } finally {
      setSubmitting(false);
    }
  };

  const discountAmount = appliedDiscount ? Math.round(total * appliedDiscount.percent / 100) : 0;
  const discountedTotal = total - discountAmount;

  const applyDiscount = async () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    setDiscountLoading(true);
    try {
      const res = await fetch(`${API}/api/discount/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error, variant: "destructive" }); return; }
      setAppliedDiscount({ code: data.code, percent: data.discountPercent });
      toast({ title: `✅ تم تطبيق كود الخصم — ${data.discountPercent}% خصم!` });
    } finally { setDiscountLoading(false); }
  };

  function copyTracking(tn: string) {
    navigator.clipboard.writeText(tn).then(() => toast({ title: t("checkout_tracking_copied") }));
  }

  if (results) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20">
          <div className="max-w-lg mx-auto text-center bg-card border border-border/60 rounded-2xl p-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-bold mb-3">{t("checkout_success_title")}</h1>
            <p className="text-muted-foreground mb-6">{t("checkout_success_cod")}</p>

            {results.some(r => r.trackingNumber) && (
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-muted-foreground">{t("checkout_tracking_label")}</p>
                {results.filter(r => r.trackingNumber).map(r => (
                  <div key={r.id} className="flex items-center justify-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    <code className="text-sm font-mono font-bold text-primary tracking-widest" dir="ltr">{r.trackingNumber}</code>
                    <button onClick={() => copyTracking(r.trackingNumber!)} className="text-muted-foreground hover:text-primary transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {customerUser && (
                <Button asChild>
                  <Link href="/customer/dashboard">
                    <LayoutDashboard className="w-4 h-4 me-2" />
                    {t("checkout_my_orders")}
                  </Link>
                </Button>
              )}
              {results.length === 1 && results[0].trackingNumber && (
                <Button asChild variant={customerUser ? "outline" : "default"}>
                  <Link href={`/track/${results[0].trackingNumber}`}>{t("checkout_track_order")}</Link>
                </Button>
              )}
              <Button variant={customerUser ? "ghost" : "outline"} onClick={() => setLocation("/products")}>
                {t("cart_continue")}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (onlineOrderPending) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20">
          <div className="max-w-lg mx-auto text-center bg-card border border-border/60 rounded-2xl p-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mb-6">
              <Clock className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-bold mb-3">طلبك في انتظار الدفع</h1>
            <p className="text-muted-foreground mb-6">
              تم إنشاء طلبك بنجاح. أكمل الدفع في الصفحة التي فُتحت. إذا لم تفتح تلقائياً، اضغط الأزرار أدناه.
            </p>
            {onlineOrderPending.orders.some(r => r.trackingNumber) && (
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-muted-foreground">{t("checkout_tracking_label")}</p>
                {onlineOrderPending.orders.filter(r => r.trackingNumber).map(r => (
                  <div key={r.id} className="flex items-center justify-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    <code className="text-sm font-mono font-bold text-primary tracking-widest" dir="ltr">{r.trackingNumber}</code>
                    <button onClick={() => copyTracking(r.trackingNumber!)} className="text-muted-foreground hover:text-primary transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {onlineOrderPending.checkoutUrls.map((url, i) => (
                <Button key={i} onClick={() => window.open(url, "_blank")} className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {onlineOrderPending.checkoutUrls.length > 1 ? `فتح صفحة الدفع ${i + 1}` : "فتح صفحة الدفع"}
                </Button>
              ))}
              {customerUser && (
                <Button asChild variant="outline">
                  <Link href="/customer/dashboard">
                    <LayoutDashboard className="w-4 h-4 me-2" />
                    {t("checkout_my_orders")}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" onClick={() => setLocation("/products")}>
                {t("cart_continue")}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20">
          <div className="max-w-lg mx-auto text-center bg-card border border-border/60 rounded-2xl p-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-6">
              <ShoppingBag className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-bold mb-3">{t("cart_empty_title")}</h1>
            <p className="text-muted-foreground mb-8">{t("cart_empty_sub")}</p>
            <Button asChild><Link href="/products">{t("drawer_browse")}</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{t("checkout_title")}</h1>

        {customerUser && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {t("checkout_linked")} {customerUser.name}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          <form onSubmit={form.handleSubmit(onSubmit)} className="bg-card border border-border/60 rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-lg">{t("checkout_delivery_info")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("checkout_name")}</Label>
                <Input {...form.register("customerName")} />
              </div>
              <div className="space-y-1">
                <Label>{t("checkout_phone")}</Label>
                <Input dir="ltr" {...form.register("phone")} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>{t("checkout_address")}</Label>
                <Input {...form.register("address")} />
              </div>
              <div className="space-y-1">
                <Label>{t("checkout_city")}</Label>
                <Input {...form.register("city")} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("checkout_notes")}</Label>
              <Textarea rows={3} {...form.register("notes")} />
            </div>

            <div
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors cursor-pointer select-none ${
                requiresSignature ? "bg-amber-50 border-amber-300" : "bg-muted/40 border-border hover:border-primary/40"
              }`}
              onClick={() => setRequiresSignature((v) => !v)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${requiresSignature ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                  <PenLine className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">{t("checkout_signature_label")}</div>
                  <div className="text-xs text-muted-foreground">{t("checkout_signature_hint")}</div>
                </div>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${requiresSignature ? "bg-amber-500" : "bg-muted-foreground/30"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${requiresSignature ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>

            {/* Discount Code */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Tag className="w-4 h-4 text-primary" /> كود الخصم (اختياري)
              </label>
              {appliedDiscount ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <BadgePercent className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm font-bold text-green-700 font-mono">{appliedDiscount.code}</span>
                  <span className="text-sm text-green-600 mr-auto">— {appliedDiscount.percent}% خصم</span>
                  <button type="button" onClick={() => setAppliedDiscount(null)} className="text-green-600 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={discountInput}
                    onChange={e => setDiscountInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), applyDiscount())}
                    placeholder="WELCOME-XXXXXXXX أو REV-XXXXXXXX"
                    dir="ltr"
                    className="flex-1 font-mono uppercase"
                  />
                  <Button type="button" variant="outline" onClick={applyDiscount} disabled={discountLoading || !discountInput.trim()}>
                    تطبيق
                  </Button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <CreditCard className="w-4 h-4 text-primary" /> طريقة الدفع
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-primary/40"}`}
                >
                  <Banknote className={`w-6 h-6 ${paymentMethod === "cod" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${paymentMethod === "cod" ? "text-primary" : "text-foreground"}`}>الدفع عند الاستلام</div>
                    <div className="text-xs text-muted-foreground mt-0.5">ادفع نقداً عند التسليم</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === "online" ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-primary/40"}`}
                >
                  <CreditCard className={`w-6 h-6 ${paymentMethod === "online" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${paymentMethod === "online" ? "text-primary" : "text-foreground"}`}>دفع إلكتروني</div>
                    <div className="text-xs text-muted-foreground mt-0.5">EDAHABIA · CIB</div>
                  </div>
                </button>
              </div>
              {paymentMethod === "online" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-base">🔒</span>
                  <span>ستُحوَّل إلى صفحة دفع آمنة عبر Chargily Pay (EDAHABIA / CIB)</span>
                </div>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full h-12" disabled={submitting}>
              {submitting
                ? (paymentMethod === "online" ? "جارٍ الإعداد..." : t("checkout_submitting"))
                : (paymentMethod === "online" ? `الدفع إلكترونياً (${discountedTotal} د.ج) →` : `${t("checkout_confirm")} (${discountedTotal} د.ج)`)}
            </Button>
            {paymentMethod === "cod" && (
              <p className="text-xs text-center text-muted-foreground">{t("checkout_cod_badge")}</p>
            )}
          </form>

          <aside className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 lg:sticky lg:top-24">
            <h2 className="font-bold">{t("checkout_summary")}</h2>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={it.imageUrl || vermicompostBag} alt={it.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{it.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center border border-border rounded-md">
                        <button type="button" onClick={() => setQty(it.id, it.quantity - 1)} className="px-2 py-0.5 hover:bg-muted"><Minus className="w-3 h-3" /></button>
                        <span className="px-2 text-sm tabular-nums">{it.quantity}</span>
                        <button type="button" onClick={() => setQty(it.id, it.quantity + 1)} className="px-2 py-0.5 hover:bg-muted"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-sm font-bold text-primary tabular-nums">{it.price * it.quantity} د.ج</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(it.id)} className="text-destructive/70 hover:text-destructive p-1 self-start">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-border/60 pt-3 space-y-1.5">
              {appliedDiscount && (
                <>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t("checkout_total")}</span>
                    <span className="line-through tabular-nums">{total} د.ج</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-green-600 font-medium">
                    <span>خصم {appliedDiscount.percent}%</span>
                    <span className="tabular-nums">- {discountAmount} د.ج</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("drawer_total")}</span>
                <span className="text-xl font-extrabold text-primary tabular-nums">{discountedTotal} د.ج</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
