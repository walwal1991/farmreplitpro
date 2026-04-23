import AdminSidebar from "@/components/AdminSidebar";
import { useListConsultations, useUpdateConsultationStatus, getListConsultationsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ConsultationStatusUpdateStatus } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default function AdminConsultations() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const { data: consultations, isLoading } = useListConsultations(
    { request: { headers: { "x-admin-token": token || "" } } },
    { query: { enabled: !!token } }
  );

  const updateStatus = useUpdateConsultationStatus({ request: { headers: { "x-admin-token": token || "" } } });

  const handleStatusChange = (id: number, newStatus: ConsultationStatusUpdateStatus) => {
    updateStatus.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
        toast({ title: "تم التحديث", description: "تم تحديث حالة الاستشارة بنجاح" });
      },
      onError: () => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء التحديث", variant: "destructive" });
      }
    });
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'new': return 'جديدة';
      case 'in_progress': return 'قيد المعالجة';
      case 'answered': return 'تم الرد';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'new': return 'bg-blue-500/10 text-blue-600';
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-600';
      case 'answered': return 'bg-green-500/10 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSoilTypeLabel = (type: string) => {
    switch(type) {
      case 'sandy': return 'رملية';
      case 'clay': return 'طينية';
      case 'silt': return 'غرينية';
      case 'loam': return 'مزيجية';
      case 'rocky': return 'صخرية';
      case 'other': return 'أخرى';
      default: return type;
    }
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">الاستشارات الزراعية</h1>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">رقم</th>
                    <th className="px-6 py-4 font-medium">المزارع</th>
                    <th className="px-6 py-4 font-medium">المحصول والتربة</th>
                    <th className="px-6 py-4 font-medium">التاريخ</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                    <th className="px-6 py-4 font-medium text-left">التفاصيل والحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-8" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-40" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-8 w-32 ml-auto" /></td>
                      </tr>
                    ))
                  ) : consultations?.length ? (
                    consultations.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">#{item.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{item.customerName}</div>
                          <div className="text-xs text-muted-foreground mt-1" dir="ltr">{item.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-primary">{item.crop}</div>
                          <div className="text-xs text-muted-foreground mt-1">التربة: {getSoilTypeLabel(item.soilType)}</div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground" dir="ltr">
                          {format(new Date(item.createdAt), "dd MMM yyyy", { locale: ar })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="flex items-center justify-end gap-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rtl">
                                <DialogHeader>
                                  <DialogTitle>تفاصيل الاستشارة #{item.id}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">الاسم</p>
                                      <p className="font-bold">{item.customerName}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">الهاتف</p>
                                      <p className="font-bold" dir="ltr">{item.phone}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">المحصول</p>
                                      <p className="font-bold">{item.crop}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">نوع التربة</p>
                                      <p className="font-bold">{getSoilTypeLabel(item.soilType)}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">وصف المشكلة</p>
                                    <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed border border-border">
                                      {item.problem}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Select 
                              defaultValue={item.status} 
                              onValueChange={(val: ConsultationStatusUpdateStatus) => handleStatusChange(item.id, val)}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">جديدة</SelectItem>
                                <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                                <SelectItem value="answered">تم الرد</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        لا توجد استشارات
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
