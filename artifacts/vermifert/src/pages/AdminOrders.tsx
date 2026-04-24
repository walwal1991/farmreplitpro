import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Printer, Truck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
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
                                <SelectTrigger className={`w-[160px] h-8 text-xs ${order.assignedDriverId ? "border-blue-300 bg-blue-50 dark:bg-blue-950/30" : ""}`}>
                                  <SelectValue>
                                    {order.assignedDriverId ? (
                                      <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                                        <Truck className="w-3 h-3" />
                                        {order.assignedDriverName}
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <UserX className="w-3 h-3" />
                                        بدون سائق
                                      </span>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                      <UserX className="w-3.5 h-3.5" />
                                      بدون سائق
                                    </span>
                                  </SelectItem>
                                  {drivers.length === 0 ? (
                                    <SelectItem value="__empty__" disabled>
                                      لا يوجد سائقون متاحون
                                    </SelectItem>
                                  ) : (
                                    drivers.map(d => (
                                      <SelectItem key={d.id} value={d.id.toString()}>
                                        <span className="flex items-center gap-2">
                                          {d.role === "driver" ? <Truck className="w-3.5 h-3.5 text-amber-600" /> : <Truck className="w-3.5 h-3.5 text-blue-600" />}
                                          {d.name}
                                        </span>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
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

                          {/* Print sticker */}
                          <td className="px-4 py-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="طباعة الملصق"
                              onClick={() => setStickerOrder(order)}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
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

      <StickerPrint
        order={stickerOrder}
        open={!!stickerOrder}
        onClose={() => setStickerOrder(null)}
      />
    </div>
  );
}
