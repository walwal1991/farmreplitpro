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
import { useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, CheckCircle2, Trash2, Plus, Minus } from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";

const formSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف غير صالح"),
  address: z.string().min(5, "العنوان مطلوب"),
  city: z.string().min(2, "المدينة مطلوبة"),
  notes: z.string().optional(),
});
type FormVals = z.infer<typeof formSchema>;

export default function Cart() {
  const { items, total, setQty, remove, clear } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormVals>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      city: "",
      notes: "",
    },
  });

  const createOrder = useCreateOrder();

  const onSubmit = async (vals: FormVals) => {
    try {
      // Submit one order per cart line (backend supports a single product per order).
      for (const it of items) {
        await createOrder.mutateAsync({
          data: {
            customerName: vals.customerName,
            phone: vals.phone,
            address: vals.address,
            city: vals.city,
            notes: vals.notes ?? "",
            productId: it.id,
            quantity: it.quantity,
          },
        });
      }
      setSubmitted(true);
      clear();
    } catch {
      toast({
        title: "تعذّر إرسال الطلب",
        description: "حاول مرة أخرى أو راجع البيانات.",
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20">
          <div className="max-w-lg mx-auto text-center bg-card border border-border/60 rounded-2xl p-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-bold mb-3">تمّ تأكيد طلبك بنجاح</h1>
            <p className="text-muted-foreground mb-8">
              سنتواصل معك قريباً لتأكيد تفاصيل التوصيل. الدفع نقداً عند الاستلام.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setLocation("/products")}>
                مواصلة التسوق
              </Button>
              <Button variant="outline" onClick={() => setLocation("/")}>
                العودة للرئيسية
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
            <Button
              type="submit"
              size="lg"
              className="w-full h-12"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending
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
