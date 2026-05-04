import AdminSidebar from "@/components/AdminSidebar";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@workspace/api-client-react";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  description: z.string().min(5, "الوصف مطلوب"),
  price: z.coerce.number().min(0, "السعر غير صالح"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  weightKg: z.coerce.number().min(0, "الوزن غير صالح"),
  imageUrl: z
    .string()
    .refine(
      (v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
      "أدخل رابطاً مطلقاً (http) أو مساراً يبدأ بـ /",
    ),
  stock: z.coerce.number().min(0, "المخزون غير صالح"),
  active: z.boolean().default(true),
  category: z.enum(["solid", "liquid", "worms", "kit", "substrate", "equipment"]).default("solid"),
});

const CATEGORY_OPTIONS = [
  { value: "solid", label: "سماد صلب" },
  { value: "liquid", label: "سماد سائل" },
  { value: "worms", label: "ديدان حية" },
  { value: "kit", label: "أطقم ومعدات" },
  { value: "substrate", label: "مواد الزراعة" },
  { value: "equipment", label: "معدات أخرى" },
] as const;

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProducts() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-token": token || "" },
        body: formData,
      });
      if (!res.ok) throw new Error("فشل الرفع");
      const { url } = await res.json();
      form.setValue("imageUrl", url);
      toast({ title: "تم الرفع", description: "تم رفع الصورة بنجاح" });
    } catch {
      toast({ title: "خطأ", description: "تعذّر رفع الصورة", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const { data: products, isLoading } = useListProducts();

  const createProduct = useCreateProduct({ request: { headers: { "x-admin-token": token || "" } } });
  const updateProduct = useUpdateProduct({ request: { headers: { "x-admin-token": token || "" } } });
  const deleteProduct = useDeleteProduct({ request: { headers: { "x-admin-token": token || "" } } });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      unit: "كغ",
      weightKg: 1,
      imageUrl: "",
      stock: 100,
      active: true,
      category: "solid",
    }
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      weightKg: product.weightKg,
      imageUrl: product.imageUrl,
      stock: product.stock,
      active: product.active,
      category: (product.category ?? "solid") as ProductForm["category"],
    });
  };

  const onSubmit = (data: ProductForm) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setEditingProduct(null);
          toast({ title: "تم التحديث", description: "تم تحديث المنتج بنجاح" });
        },
        onError: () => {
          toast({ title: "خطأ", description: "حدث خطأ أثناء التحديث", variant: "destructive" });
        }
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setIsCreateOpen(false);
          form.reset();
          toast({ title: "تمت الإضافة", description: "تم إضافة المنتج بنجاح" });
        },
        onError: () => {
          toast({ title: "خطأ", description: "حدث خطأ أثناء الإضافة", variant: "destructive" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "تم الحذف", description: "تم حذف المنتج بنجاح" });
      }
    });
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">المنتجات</h1>
            
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (open) form.reset({ name: "", description: "", price: 0, unit: "كغ", weightKg: 1, imageUrl: "", stock: 100, active: true, category: "solid" });
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة منتج
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[660px] rtl">
                <DialogHeader>
                  <DialogTitle>إضافة منتج جديد</DialogTitle>
                </DialogHeader>
                <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">الاسم</Label>
                      <Input className="h-8 text-sm" {...form.register("name")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">السعر (د.ج)</Label>
                      <Input className="h-8 text-sm" type="number" {...form.register("price")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الوزن</Label>
                      <Input className="h-8 text-sm" type="number" step="0.1" {...form.register("weightKg")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الوحدة (كغ، لتر...)</Label>
                      <Input className="h-8 text-sm" {...form.register("unit")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">المخزون</Label>
                      <Input className="h-8 text-sm" type="number" {...form.register("stock")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">النوع</Label>
                      <select
                        {...form.register("category")}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">الصورة</Label>
                      <div className="flex gap-2">
                        <Input dir="ltr" {...form.register("imageUrl")} placeholder="https://..." className="flex-1 h-8 text-sm" />
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={uploading} onClick={() => fileInputRef.current?.click()} title="رفع صورة">
                          <Upload className="w-3.5 h-3.5" />
                        </Button>
                        {form.watch("imageUrl") && (
                          <img src={form.watch("imageUrl")} alt="preview" className="h-8 w-8 rounded object-cover border border-border shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الوصف</Label>
                    <Textarea rows={2} className="text-sm resize-none" {...form.register("description")} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">نشط (يظهر في المتجر)</Label>
                    <Switch checked={form.watch("active")} onCheckedChange={(val) => form.setValue("active", val)} />
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit" form="product-form" disabled={createProduct.isPending}>
                    {createProduct.isPending ? "جاري الحفظ..." : "حفظ المنتج"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">المنتج</th>
                    <th className="px-6 py-4 font-medium">نوع المنتج</th>
                    <th className="px-6 py-4 font-medium">السعر</th>
                    <th className="px-6 py-4 font-medium">الوزن</th>
                    <th className="px-6 py-4 font-medium">المخزون</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                    <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-8 w-20" /></td>
                      </tr>
                    ))
                  ) : products?.length ? (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded overflow-hidden flex items-center justify-center">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium text-foreground">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-secondary/60 text-secondary-foreground">
                            {CATEGORY_OPTIONS.find(c => c.value === (product.category ?? "solid"))?.label ?? "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{product.price} د.ج</td>
                        <td className="px-6 py-4 text-muted-foreground">{product.weightKg} {product.unit}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${product.stock > 10 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${product.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {product.active ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                              <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="w-4 h-4 text-destructive/70 hover:text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        لا توجد منتجات
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="sm:max-w-[660px] rtl">
            <DialogHeader>
              <DialogTitle>تعديل المنتج</DialogTitle>
            </DialogHeader>
            <form id="edit-product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">الاسم</Label>
                  <Input className="h-8 text-sm" {...form.register("name")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">السعر (د.ج)</Label>
                  <Input className="h-8 text-sm" type="number" {...form.register("price")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">الوزن</Label>
                  <Input className="h-8 text-sm" type="number" step="0.1" {...form.register("weightKg")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">الوحدة (كغ، لتر...)</Label>
                  <Input className="h-8 text-sm" {...form.register("unit")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">المخزون</Label>
                  <Input className="h-8 text-sm" type="number" {...form.register("stock")} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">النوع</Label>
                  <select
                    {...form.register("category")}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">الصورة</Label>
                  <div className="flex gap-2">
                    <Input dir="ltr" {...form.register("imageUrl")} placeholder="https://..." className="flex-1 h-8 text-sm" />
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={uploading} onClick={() => fileInputRef.current?.click()} title="رفع صورة">
                      <Upload className="w-3.5 h-3.5" />
                    </Button>
                    {form.watch("imageUrl") && (
                      <img src={form.watch("imageUrl")} alt="preview" className="h-8 w-8 rounded object-cover border border-border shrink-0" />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الوصف</Label>
                <Textarea rows={2} className="text-sm resize-none" {...form.register("description")} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">نشط (يظهر في المتجر)</Label>
                <Switch checked={form.watch("active")} onCheckedChange={(val) => form.setValue("active", val)} />
              </div>
            </form>
            <DialogFooter>
              <Button type="submit" form="edit-product-form" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
