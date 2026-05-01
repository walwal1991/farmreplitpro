import Navbar from "@/components/Navbar";
import { useLocation, useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, CheckCircle2, Copy, LayoutDashboard, PenLine, Tag, X, BadgePercent, CreditCard, Banknote } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(5),
  city: z.string().min(2),
  notes: z.string().optional(),
  quantity: z.coerce.number().min(1),
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

interface OrderResult { id: number; trackingNumber?: string | null; }

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLang();
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) }
  });

  const customerToken = localStorage.getItem("customerToken") ?? "";
  const customerUser = (() => {
    try { return JSON.parse(localStorage.getItem("customerUser") ?? "null"); } catch { return null; }
  })();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: customerUser?.name ?? "",
      phone: customerUser?.phone ?? "",
      address: "",
      city: "",
      notes: "",
      quantity: 1,
    }
  });

  const quantity = form.watch("quantity") || 1;
  const basePrice = product ? product.price * quantity : 0;
  const discountAmount = appliedDiscount ? Math.round(basePrice * appliedDiscount.percent / 100) : 0;
  const totalPrice = basePrice - discountAmount;

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

  const onSubmit = async (data: CheckoutForm) => {
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customerToken) headers["x-customer-token"] = customerToken;

      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...data, productId, requiresSignature,
          discountCode: appliedDiscount?.code ?? null,
          paymentMethod,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: t("checkout_error"), description: json.error ?? t("checkout_error"), variant: "destructive" });
        return;
      }
      // Online payment: redirect to Chargily checkout page
      if (paymentMethod === "online" && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      setOrderResult({ id: json.id, trackingNumber: json.trackingNumber });
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="max-w-md w-full bg-card p-8 rounded-3xl text-center space-y-5 border border-border shadow-lg">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold">{t("checkout_success_title")}</h2>
            <p className="text-muted-foreground text-sm">{t("checkout_success_cod")}</p>

            {orderResult.trackingNumber && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">{t("checkout_tracking_label")}</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono font-bold text-primary tracking-widest" dir="ltr">
                    {orderResult.trackingNumber}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(orderResult.trackingNumber!);
                      toast({ title: t("checkout_tracking_copied") });
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("checkout_tracking_hint")}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {orderResult.trackingNumber && (
                <Button asChild variant="default">
                  <Link href={`/track/${orderResult.trackingNumber}`}>{t("checkout_track_order")}</Link>
                </Button>
              )}
              {customerUser && (
                <Button asChild variant="outline">
                  <Link href="/customer/dashboard">
                    <LayoutDashboard className="w-4 h-4 me-2" />
                    {t("checkout_my_orders")}
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost">
                <a href="/">{t("checkout_go_home")}</a>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{t("checkout_title")}</h1>

        {customerUser && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {t("checkout_linked")} {customerUser.name}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              {t("checkout_delivery_info")}
            </h2>

            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName">{t("checkout_name")}</Label>
                  <Input id="customerName" {...form.register("customerName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("checkout_phone")}</Label>
                  <Input id="phone" type="tel" dir="ltr" className="text-right" {...form.register("phone")} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("checkout_city")}</Label>
                  <Input id="city" {...form.register("city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("checkout_address")}</Label>
                  <Input id="address" {...form.register("address")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t("checkout_notes")}</Label>
                <Textarea id="notes" rows={3} {...form.register("notes")} />
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

              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-primary" /> طريقة الدفع</Label>
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

              {/* Discount Code */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-primary" /> كود الخصم (اختياري)</Label>
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
                      placeholder="REV-XXXXXXXX"
                      dir="ltr"
                      className="flex-1 font-mono uppercase"
                    />
                    <Button type="button" variant="outline" onClick={applyDiscount} disabled={discountLoading || !discountInput.trim()}>
                      تطبيق
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6">{t("checkout_summary")}</h2>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : product ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{product.name}</h3>
                    <p className="text-primary font-bold">{product.price} د.ج</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">{t("checkout_qty")}</Label>
                    <Input id="quantity" type="number" min="1" max={product.stock} {...form.register("quantity")} />
                  </div>

                  <div className="py-4 border-t border-border space-y-1">
                    {appliedDiscount && (
                      <>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>{t("checkout_total")}</span>
                          <span className="line-through">{basePrice} د.ج</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                          <span>خصم {appliedDiscount.percent}%</span>
                          <span>- {discountAmount} د.ج</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{t("checkout_total")}</span>
                      <span className="text-xl font-bold text-primary">{totalPrice} د.ج</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg text-sm font-medium text-center ${paymentMethod === "online" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-primary/5 text-primary"}`}>
                    {paymentMethod === "online"
                      ? "🔒 ستُحوَّل إلى صفحة دفع Chargily Pay الآمنة"
                      : t("checkout_cod_badge")}
                  </div>

                  <Button type="submit" form="checkout-form" className="w-full h-12 text-lg" disabled={submitting}>
                    {submitting
                      ? (paymentMethod === "online" ? "جارٍ الإعداد..." : t("checkout_submitting"))
                      : (paymentMethod === "online" ? "الدفع إلكترونياً →" : t("checkout_confirm"))}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
