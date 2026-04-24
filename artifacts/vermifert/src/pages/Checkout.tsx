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
import { Truck, CheckCircle2, Copy, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const checkoutSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  address: z.string().min(5, "العنوان مطلوب"),
  city: z.string().min(2, "المدينة مطلوبة"),
  notes: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface OrderResult { id: number; trackingNumber?: string | null; }

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) }
  });

  // Pre-fill from customer account if logged in
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
  const totalPrice = product ? product.price * quantity : 0;

  const onSubmit = async (data: CheckoutForm) => {
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customerToken) headers["x-customer-token"] = customerToken;

      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...data, productId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "خطأ", description: json.error ?? "حدث خطأ", variant: "destructive" });
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
            <h2 className="text-2xl font-bold">تم تأكيد طلبك بنجاح!</h2>
            <p className="text-muted-foreground text-sm">
              شكراً لثقتك بنا. الدفع سيكون عند الاستلام.
            </p>

            {orderResult.trackingNumber && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">رقم التتبع الخاص بك</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono font-bold text-primary tracking-widest" dir="ltr">
                    {orderResult.trackingNumber}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(orderResult.trackingNumber!);
                      toast({ title: "تم نسخ رقم التتبع" });
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">احتفظ بهذا الرقم لتتبع طلبك</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {orderResult.trackingNumber && (
                <Button asChild variant="default">
                  <Link href={`/track/${orderResult.trackingNumber}`}>
                    تتبع طلبك
                  </Link>
                </Button>
              )}
              {customerUser && (
                <Button asChild variant="outline">
                  <Link href="/customer/dashboard">
                    <LayoutDashboard className="w-4 h-4 me-2" />
                    طلباتي
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost">
                <a href="/">العودة للرئيسية</a>
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
        <h1 className="text-3xl font-bold mb-8">إتمام الطلب</h1>

        {customerUser && (
          <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            مرحباً {customerUser.name} — سيُربط هذا الطلب بحسابك تلقائياً
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              معلومات التوصيل
            </h2>

            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName">الاسم الكامل</Label>
                  <Input id="customerName" {...form.register("customerName")} />
                  {form.formState.errors.customerName && <p className="text-sm text-destructive">{form.formState.errors.customerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" type="tel" dir="ltr" className="text-right" {...form.register("phone")} />
                  {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة / الولاية</Label>
                  <Input id="city" {...form.register("city")} />
                  {form.formState.errors.city && <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">العنوان بالتفصيل</Label>
                  <Input id="address" {...form.register("address")} />
                  {form.formState.errors.address && <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
                <Textarea id="notes" rows={3} {...form.register("notes")} />
              </div>
            </form>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6">ملخص الطلب</h2>

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
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={product.stock}
                      {...form.register("quantity")}
                    />
                    {form.formState.errors.quantity && <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>}
                  </div>

                  <div className="flex justify-between items-center py-4 border-t border-border">
                    <span className="font-bold">المجموع الكلي:</span>
                    <span className="text-xl font-bold text-primary">{totalPrice} د.ج</span>
                  </div>

                  <div className="bg-primary/5 text-primary p-4 rounded-lg text-sm font-medium text-center">
                    الدفع عند الاستلام 💵
                  </div>

                  <Button
                    type="submit"
                    form="checkout-form"
                    className="w-full h-12 text-lg"
                    disabled={submitting}
                  >
                    {submitting ? "جاري التأكيد..." : "تأكيد الطلب"}
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
