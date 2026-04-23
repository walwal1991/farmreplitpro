import AdminSidebar from "@/components/AdminSidebar";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { OrderStatusUpdateStatus } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const { data: orders, isLoading } = useListOrders(
    { request: { headers: { "x-admin-token": token || "" } } },
    { query: { enabled: !!token } }
  );

  const updateStatus = useUpdateOrderStatus({ request: { headers: { "x-admin-token": token || "" } } });

  const handleStatusChange = (id: number, newStatus: OrderStatusUpdateStatus) => {
    updateStatus.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب بنجاح" });
      },
      onError: () => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء التحديث", variant: "destructive" });
      }
    });
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'shipped': return 'مشحون';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600';
      case 'confirmed': return 'bg-blue-500/10 text-blue-600';
      case 'shipped': return 'bg-purple-500/10 text-purple-600';
      case 'delivered': return 'bg-green-500/10 text-green-600';
      case 'cancelled': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">الطلبات</h1>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">رقم الطلب</th>
                    <th className="px-6 py-4 font-medium">العميل</th>
                    <th className="px-6 py-4 font-medium">المنتج</th>
                    <th className="px-6 py-4 font-medium">المبلغ الإجمالي</th>
                    <th className="px-6 py-4 font-medium">التاريخ</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                    <th className="px-6 py-4 font-medium text-left">تحديث الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-12" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-40" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-8 w-32 ml-auto" /></td>
                      </tr>
                    ))
                  ) : orders?.length ? (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">#{order.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground mt-1" dir="ltr">{order.phone}</div>
                          <div className="text-xs text-muted-foreground mt-1">{order.city} - {order.address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{order.productName}</div>
                          <div className="text-xs text-muted-foreground mt-1">الكمية: {order.quantity}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-primary">{order.totalPrice} د.ج</td>
                        <td className="px-6 py-4 text-muted-foreground" dir="ltr">
                          {format(new Date(order.createdAt), "dd MMM yyyy", { locale: ar })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <Select 
                            defaultValue={order.status} 
                            onValueChange={(val: OrderStatusUpdateStatus) => handleStatusChange(order.id, val)}
                          >
                            <SelectTrigger className="w-[140px] ml-auto h-8 text-xs">
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
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
    </div>
  );
}
