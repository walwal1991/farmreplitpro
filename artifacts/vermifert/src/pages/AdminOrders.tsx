import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Printer, Truck, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StickerPrint from "@/components/StickerPrint";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Order {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  assignedDriverId: number | null;
  assignedDriverName: string | null;
  createdAt: string;
}

interface Driver {
  id: number;
  name: string;
  role: string;
  available: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "مشحون",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  confirmed: "bg-blue-500/10 text-blue-600",
  shipped: "bg-purple-500/10 text-purple-600",
  delivered: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-600",
};

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [stickerOrder, setStickerOrder] = useState<Order | null>(null);

  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({ customerName: "", phone: "", address: "", city: "", notes: "", quantity: "1" });
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { if (!token) setLocation("/admin/login"); }, [token, setLocation]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/orders`, { headers: { "x-admin-token": token } });
      if (res.status === 401) { setLocation("/admin/login"); return; }
      setOrders(await res.json());
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل الطلبات", variant: "destructive" });
    } finally { setLoading(false); }
  }, [token, setLocation, toast]);

  const fetchDrivers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/delivery-users`, { headers: { "x-admin-token": token } });
      const all: Driver[] = await res.json();
      setDrivers(all.filter(d => d.available));
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, [fetchOrders, fetchDrivers]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`${API}/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify({ status }),
      });
      toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب بنجاح" });
      fetchOrders();
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء التحديث", variant: "destructive" });
    }
  };

  const openEdit = (order: Order) => {
    setEditOrder(order);
    setEditForm({
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      city: order.city,
      notes: order.notes || "",
      quantity: order.quantity.toString(),
    });
  };

  const handleEdit = async () => {
    if (!editOrder) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/orders/${editOrder.id}/details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify({
          customerName: editForm.customerName,
          phone: editForm.phone,
          address: editForm.address,
          city: editForm.city,
          notes: editForm.notes,
          quantity: editForm.quantity,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "خطأ", description: d.error, variant: "destructive" });
        return;
      }
      toast({ title: "تم التعديل", description: `تم تحديث بيانات الطلب #${editOrder.id}` });
      setEditOrder(null);
      fetchOrders();
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء التعديل", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/orders/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token! },
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "خطأ", description: d.error, variant: "destructive" });
        return;
      }
      toast({ title: "تم الحذف", description: `تم حذف الطلب #${deleteTarget.id}` });
      setDeleteTarget(null);
      fetchOrders();
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحذف", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAssignDriver = async (orderId: number, driverIdStr: string) => {
    setAssigningId(orderId);
    try {
      const driverId = driverIdStr === "none" ? null : parseInt(driverIdStr, 10);
      const res = await fetch(`${API}/api/admin/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify({ driverId }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "خطأ", description: data.error, variant: "destructive" }); return; }

      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, assignedDriverId: data.assignedDriverId, assignedDriverName: data.assignedDriverName }
          : o
      ));
      toast({
        title: driverId ? "تم تكليف السائق" : "تم إلغاء التكليف",
        description: driverId
          ? `تم تكليف السائق بالطلب #${orderId}`
          : `تم إلغاء تكليف السائق من الطلب #${orderId}`,
      });
    } catch {
      toast({ title: "خطأ", variant: "destructive" });
    } finally { setAssigningId(null); }
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">الطلبات</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {drivers.length > 0
                  ? `${drivers.length} سائق متاح للتكليف`
                  : "لا يوجد سائقون متاحون حالياً"}
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-4 font-medium">رقم الطلب</th>
                    <th className="px-4 py-4 font-medium">العميل</th>
                    <th className="px-4 py-4 font-medium">المنتج</th>
                    <th className="px-4 py-4 font-medium">المبلغ</th>
                    <th className="px-4 py-4 font-medium">التاريخ</th>
                    <th className="px-4 py-4 font-medium">الحالة</th>
                    <th className="px-4 py-4 font-medium">السائق المكلّف</th>
                    <th className="px-4 py-4 font-medium">تحديث الحالة</th>
                    <th className="px-4 py-4 font-medium">ملصق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-4"><Skeleton className="h-6 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : orders.length ? (
                    orders.map((order) => {
                      const isDeliverable = ["pending", "confirmed", "shipped"].includes(order.status);
                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-muted/30 transition-colors ${order.assignedDriverId ? "bg-blue-50/30 dark:bg-blue-950/10" : ""}`}
                        >
                          {/* Order number */}
                          <td className="px-4 py-4 font-medium text-foreground">#{order.id}</td>

                          {/* Customer */}
                          <td className="px-4 py-4">
                            <div className="font-bold text-foreground">{order.customerName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">{order.phone}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{order.city} - {order.address}</div>
                          </td>

                          {/* Product */}
                          <td className="px-4 py-4">
                            <div className="font-medium">{order.productName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">الكمية: {order.quantity}</div>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-4 font-bold text-primary whitespace-nowrap">
                            {order.totalPrice} د.ج
                          </td>

                          {/* Date */}
                          <td className="px-4 py-4 text-muted-foreground whitespace-nowrap" dir="ltr">
                            {format(new Date(order.createdAt), "dd MMM yyyy", { locale: ar })}
                          </td>

                          {/* Status badge */}
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </td>

                          {/* Driver assignment */}
                          <td className="px-4 py-4">
                            {isDeliverable ? (
                              <Select
                                value={order.assignedDriverId?.toString() ?? "none"}
                                onValueChange={(val) => handleAssignDriver(order.id, val)}
                                disabled={assigningId === order.id}
                              >
                                <SelectTrigger className={`w-[160px] h-8 text-xs ${order.assignedDriverId ? "border-blue-300 bg-blue-50 dark:bg-blue-950/30 text-blue-700" : ""}`}>
                                  <SelectValue placeholder="بدون سائق" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">بدون سائق</SelectItem>
                                  {/* Always show currently assigned driver even if unavailable */}
                                  {order.assignedDriverId && !drivers.find(d => d.id === order.assignedDriverId) && (
                                    <SelectItem value={order.assignedDriverId.toString()}>
                                      {order.assignedDriverName} (مشغول)
                                    </SelectItem>
                                  )}
                                  {drivers.length === 0 && !order.assignedDriverId ? (
                                    <SelectItem value="__empty__" disabled>
                                      لا يوجد سائقون متاحون
                                    </SelectItem>
                                  ) : (
                                    drivers.map(d => (
                                      <SelectItem key={d.id} value={d.id.toString()}>
                                        {d.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            ) : (
                              order.assignedDriverName ? (
                                <span className="text-xs flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                                  <Truck className="w-3 h-3" />
                                  {order.assignedDriverName}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )
                            )}
                          </td>

                          {/* Status update */}
                          <td className="px-4 py-4">
                            <Select
                              defaultValue={order.status}
                              onValueChange={(val) => handleStatusChange(order.id, val)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">قيد الانتظار</SelectItem>
                                <SelectItem value="confirmed">مؤكد</SelectItem>
                                <SelectItem value="shipped">مشحون</SelectItem>
                                <SelectItem value="delivered">تم التوصيل</SelectItem>
                                <SelectItem value="cancelled">ملغى</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Print sticker + Edit */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                title="طباعة الملصق"
                                onClick={() => setStickerOrder(order)}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                title="تعديل الطلب"
                                onClick={() => openEdit(order)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                title="حذف الطلب"
                                onClick={() => setDeleteTarget(order)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                        لا توجد طلبات
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الطلب <strong>#{deleteTarget?.id}</strong> للعميل <strong>{deleteTarget?.customerName}</strong> نهائياً ولا يمكن استعادته.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? "جارٍ الحذف..." : "حذف نهائياً"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              تعديل الطلب #{editOrder?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>اسم العميل</Label>
                <Input value={editForm.customerName} onChange={(e) => setEditForm(f => ({ ...f, customerName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف</Label>
                <Input dir="ltr" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>المدينة</Label>
                <Input value={editForm.city} onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>الكمية</Label>
                <Input type="number" min="1" dir="ltr" value={editForm.quantity} onChange={(e) => setEditForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>العنوان</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Input value={editForm.notes} onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="لا توجد ملاحظات" />
            </div>
            {editOrder && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <div>المنتج: <span className="font-medium">{editOrder.productName}</span></div>
                <div>سعر الوحدة: <span className="font-medium">{editOrder.unitPrice} د.ج</span></div>
                <div>الإجمالي بعد التعديل: <span className="font-bold text-primary">{(editOrder.unitPrice * parseInt(editForm.quantity || "1")).toLocaleString()} د.ج</span></div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOrder(null)}>إلغاء</Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StickerPrint
        order={stickerOrder}
        open={!!stickerOrder}
        onClose={() => setStickerOrder(null)}
      />
    </div>
  );
}
