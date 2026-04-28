import AdminSidebar from "@/components/AdminSidebar";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Phone, User, Calendar, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Enrollment {
  id: number;
  customerName: string;
  phone: string;
  courseId: string;
  status: string;
  createdAt: string;
}

const COURSE_LABELS: Record<string, string> = {
  beginner: "دورة المبتدئين — أساسيات الزراعة بالديدان",
  intermediate: "دورة الإنتاج المتكامل",
  workshop: "ورشة عملية ميدانية",
  professional: "برنامج التكوين المهني",
};

export default function AdminEnrollments() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/admin/enrollments`, {
      headers: { "x-admin-token": token },
    })
      .then((r) => r.json())
      .then((data) => { setEnrollments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const toggleStatus = async (id: number, currentStatus: string) => {
    const next = currentStatus === "new" ? "confirmed" : "new";
    const res = await fetch(`${API}/api/admin/enrollments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token ?? "" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: next } : e))
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            تسجيلات الدورات التكوينية
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            عرض جميع الطلبات الواردة من المهتمين بالدورات
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">لا توجد تسجيلات بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enroll) => (
              <div
                key={enroll.id}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm"
              >
                {/* Left badge */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1.5">
                    <span className="font-bold text-foreground">{enroll.customerName}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${enroll.status === "confirmed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}
                    >
                      {enroll.status === "confirmed" ? "مؤكّد" : "جديد"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span dir="ltr">{enroll.phone}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {COURSE_LABELS[enroll.courseId] ?? enroll.courseId}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(enroll.createdAt), "d MMMM yyyy، HH:mm", { locale: ar })}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => toggleStatus(enroll.id, enroll.status)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${enroll.status === "confirmed" ? "border-muted bg-muted text-muted-foreground hover:bg-muted/80" : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"}`}
                >
                  {enroll.status === "confirmed"
                    ? <><Clock className="w-4 h-4" /> إلغاء التأكيد</>
                    : <><CheckCircle2 className="w-4 h-4" /> تأكيد</>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
