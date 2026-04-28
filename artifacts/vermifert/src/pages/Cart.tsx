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
import { ShoppingBag, CheckCircle2, Trash2, Plus, Minus, Copy, LayoutDashboard, PenLine } from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const formSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف غير صالح"),
  address: z.string().min(5, "العنوان مطلوب"),
  city: z.string().min(2, "المدينة مطلوبة"),
  notes: z.string().optional(),
});
type FormVals = z.infer<typeof formSchema>;

interface OrderResult { id: number; trackingNumber?: string | null; }

export default function Cart() {
  const { items, total, setQty, remove, clear } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<OrderResult[] | null>(null);
  const [requiresSignature, setRequiresSignature] = useState(false);

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
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast({ title: "تعذّر إرسال الطلب", description: json.error ?? "حاول مرة أخرى", variant: "destructive" });
          return;
        }
        ordered.push({ id: json.id, trackingNumber: json.trackingNumber });
      }
      setResults(ordered);
      clear();
    } finally {
      setSubmitting(false);
    }
  };

  function copyTracking(tn: string) {
    navigator.clipboard.writeText(tn).then(() => toast({ title: "تم نسخ رقم التتبع" }));
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
            <h1 className="text-2xl font-bold mb-3">تمّ تأكيد طلبك بنجاح!</h1>
            <p className="text-muted-foreground mb-6">
              شكراً لثقتك بنا. الدفع نقداً عند الاستلام.
            </p>

            {results.some(r => r.trackingNumber) && (
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-muted-foreground">أرقام التتبع</p>
                {results.filter(r => r.trackingNumber).map(r => (
                  <div key={r.id} className="flex items-center justify-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    <code className="text-sm font-mono font-bold text-primary tracking-widest" dir="ltr">
                      {r.trackingNumber}
                    </code>
                    <button
                      onClick={() => copyTracking(r.trackingNumber!)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
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
                    عرض طلباتي
                  </Link>
                </Button>
              )}
              {results.length === 1 && results[0].trackingNumber && (
                <Button asChild variant={customerUser ? "outline" : "default"}>
                  <Link href={`/track/${results[0].trackingNumber}`}>
                    تتبع الطلب
                  </Link>
                </Button>
              )}
              <Button variant={customerUser ? "ghost" : "outline"} onClick={() => setLocation("/products")}>
                مواصلة التسوق
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
            <h1 className="text-2xl font-bold mb-3">سلتك فارغة</h1>
            <p className="text-muted-foreground mb-8">
              أضف بعض المنتجات لإكمال طلبك.
            </p>
            <Button asChild>
              <Link href="/products">تصفّح المنتجات</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>

        {customerUser && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            مرحباً {customerUser.name} — سيُربط هذا الطلب بحسابك تلقائياً
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Form */}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bg-card border border-border/60 rounded-2xl p-6 space-y-5"
          >
            <h2 className="font-bold text-lg">معلومات التوصيل</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>الاسم الكامل</Label>
                <Input {...form.register("customerName")} />
                {form.formState.errors.customerName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.customerName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>رقم الهاتف</Label>
                <Input dir="ltr" {...form.register("phone")} />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>العنوان</Label>
                <Input {...form.register("address")} />
                {form.formState.errors.address && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>المدينة / الولاية</Label>
                <Input {...form.register("city")} />
                {form.formState.errors.city && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.city.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>ملاحظات (اختياري)</Label>
              <Textarea rows={3} {...form.register("notes")} />
            </div>
            {/* Signature toggle */}
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors cursor-pointer select-none ${
                requiresSignature
                  ? "bg-amber-50 border-amber-300"
                  : "bg-muted/40 border-border hover:border-primary/40"
              }`}
              onClick={() => setRequiresSignature((v) => !v)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${requiresSignature ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                  <PenLine className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">أريد التوقيع عند استلام الطلب</div>
                  <div className="text-xs text-muted-foreground">سيطلب السائق منك التوقيع كإثبات للاستلام</div>
                </div>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${requiresSignature ? "bg-amber-500" : "bg-muted-foreground/30"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${requiresSignature ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12"
              disabled={submitting}
            >
              {submitting
                ? "جاري إرسال الطلب..."
                : `تأكيد الطلب (${total} د.ج)`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              الدفع نقداً عند الاستلام
            </p>
          </form>

          {/* Summary */}
          <aside className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 lg:sticky lg:top-24">
            <h2 className="font-bold">ملخص الطلب</h2>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img
                      src={it.imageUrl || vermicompostBag}
                      alt={it.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {it.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center border border-border rounded-md">
                        <button
                          type="button"
                          onClick={() => setQty(it.id, it.quantity - 1)}
                          className="px-2 py-0.5 hover:bg-muted"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-sm tabular-nums">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(it.id, it.quantity + 1)}
                          className="px-2 py-0.5 hover:bg-muted"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {it.price * it.quantity} د.ج
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    className="text-destructive/70 hover:text-destructive p-1 self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-border/60 pt-3 flex items-center justify-between">
              <span className="text-muted-foreground">الإجمالي</span>
              <span className="text-xl font-extrabold text-primary tabular-nums">
                {total} د.ج
              </span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
