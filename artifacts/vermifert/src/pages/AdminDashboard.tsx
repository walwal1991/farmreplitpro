import AdminSidebar from "@/components/AdminSidebar";
import { useGetAdminStats, useGetRecentActivity } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, MessageSquare, DollarSign, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const { data: stats, isLoading: isLoadingStats, isError: statsError } = useGetAdminStats(
    { request: { headers: { "x-admin-token": token || "" } } },
    { query: { enabled: !!token, retry: false } }
  );

  const { data: recent, isLoading: isLoadingRecent } = useGetRecentActivity(
    { request: { headers: { "x-admin-token": token || "" } } },
    { query: { enabled: !!token, retry: false } }
  );

  useEffect(() => {
    if (statsError) {
      localStorage.removeItem("adminToken");
      setLocation("/admin/login");
    }
  }, [statsError, setLocation]);

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">لوحة التحكم</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">الطلبات المعلقة</CardTitle>
                <ShoppingBag className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{stats?.pendingOrders || 0}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">الإيرادات (طلبات موصلة)</CardTitle>
                <DollarSign className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-3xl font-bold">{stats?.totalRevenue || 0} د.ج</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">استشارات جديدة</CardTitle>
                <MessageSquare className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{stats?.newConsultations || 0}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">المنتجات</CardTitle>
                <Package className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{stats?.totalProducts || 0}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>النشاط الأخير</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRecent ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : recent?.length ? (
                  <div className="space-y-4">
                    {recent.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                        <div className={`p-2 rounded-full ${item.kind === 'order' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'}`}>
                          {item.kind === 'order' ? <ShoppingBag className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                        </div>
                        <div className="text-xs text-muted-foreground" dir="ltr">
                          {format(new Date(item.createdAt), "dd MMM HH:mm", { locale: ar })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">لا يوجد نشاط أخير</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>حالة الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : stats?.ordersByStatus?.length ? (
                  <div className="space-y-4">
                    {stats.ordersByStatus.map(status => (
                      <div key={status.status} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <span className="font-medium">
                          {status.status === 'pending' ? 'قيد الانتظار' :
                           status.status === 'confirmed' ? 'مؤكد' :
                           status.status === 'shipped' ? 'مشحون' :
                           status.status === 'delivered' ? 'تم التوصيل' : 'ملغى'}
                        </span>
                        <span className="bg-muted px-3 py-1 rounded-full text-sm font-bold">{status.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">لا توجد إحصائيات</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
