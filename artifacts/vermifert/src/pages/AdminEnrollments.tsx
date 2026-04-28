import AdminSidebar from "@/components/AdminSidebar";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Phone, Calendar, CheckCircle2, Clock, Link2, Send, Save } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Enrollment {
  id: number;
  customerName: string;
  phone: string;
  courseId: string;
  status: string;
  trainingLink: string | null;
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
  const { toast } = useToast();

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkInputs, setLinkInputs] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/admin/enrollments`, {
      headers: { "x-admin-token": token },
    })
      .then((r) => r.json())
      .then((data: Enrollment[]) => {
        setEnrollments(data);
        const inputs: Record<number, string> = {};
        data.forEach((e) => { inputs[e.id] = e.trainingLink ?? ""; });
        setLinkInputs(inputs);
        setLoading(false);
      })
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
      setEnrollments((prev) => prev.map((e) => (e.id === id ? { ...e, status: next } : e)));
    }
  };

  const saveLink = async (id: number) => {
    setSavingId(id);
    const res = await fetch(`${API}/api/admin/enrollments/${id}/link`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token ?? "" },
      body: JSON.stringify({ trainingLink: linkInputs[id] || null }),
    });
    if (res.ok) {
      const updated: Enrollment = await res.json();
      setEnrollments((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast({ title: "تم حفظ الرابط", description: "يمكنك الآن إرساله للمتدرّب عبر واتساب" });
    }
    setSavingId(null);
  };

  const sendViaWhatsApp = (phone: string, link: string, name: string) => {
    const clean = phone.replace(/\D/g, "");
    const international = clean.startsWith("0") ? "213" + clean.slice(1) : clean;
    const msg = `مرحباً ${name}،\nيسعدنا إخبارك بأن رابط الدورة التكوينية الخاصة بك جاهز:\n${link}\nفريق Vermifert`;
    window.open(`https://wa.me/${international}?text=${encodeURIComponent(msg)}`, "_blank");
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
            ادفع رابط الدورة لكل متدرّب وأرسله مباشرة عبر واتساب
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">لا توجد تسجيلات بعد</p>
          </div>
        ) : (
          <div className="space-y-5">
            {enrollments.map((enroll) => (
              <div
                key={enroll.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm"
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>

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
                      <span className="flex items-center gap-1.5 truncate max-w-xs">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                        {COURSE_LABELS[enroll.courseId] ?? enroll.courseId}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(enroll.createdAt), "d MMMM yyyy، HH:mm", { locale: ar })}
                      </span>
                    </div>
                  </div>

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

                {/* Training link row */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-primary" />
                    رابط الدورة
                  </p>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://meet.google.com/xxx  أو أي رابط للدورة..."
                      value={linkInputs[enroll.id] ?? ""}
                      onChange={(e) => setLinkInputs((prev) => ({ ...prev, [enroll.id]: e.target.value }))}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                    />
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => saveLink(enroll.id)}
                        disabled={savingId === enroll.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {savingId === enroll.id ? "جاري..." : "حفظ"}
                      </button>
                      {enroll.trainingLink && (
                        <button
                          onClick={() => sendViaWhatsApp(enroll.phone, enroll.trainingLink!, enroll.customerName)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          واتساب
                        </button>
                      )}
                    </div>
                  </div>
                  {enroll.trainingLink && (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      الرابط محفوظ — سيظهر للمتدرّب في لوحة حسابه
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
