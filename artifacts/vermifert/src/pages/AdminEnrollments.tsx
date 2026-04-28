import AdminSidebar from "@/components/AdminSidebar";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, Phone, Calendar, CheckCircle2, Clock,
  Link2, Save, Send, MessageSquare, ChevronDown, ChevronUp,
} from "lucide-react";
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
  const [msgInputs, setMsgInputs] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [msgOpenId, setMsgOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/admin/enrollments`, { headers: { "x-admin-token": token } })
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

  const saveLink = async (enroll: Enrollment) => {
    setSavingId(enroll.id);
    const res = await fetch(`${API}/api/admin/enrollments/${enroll.id}/link`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token ?? "" },
      body: JSON.stringify({ trainingLink: linkInputs[enroll.id] || null }),
    });
    if (res.ok) {
      const updated: Enrollment = await res.json();
      setEnrollments((prev) => prev.map((e) => (e.id === enroll.id ? updated : e)));
      toast({ title: "تم حفظ الرابط", description: "يمكنك الآن إرساله للمتدرّب عبر رسالة مباشرة" });
    }
    setSavingId(null);
  };

  const sendMessage = async (enroll: Enrollment) => {
    const msg = msgInputs[enroll.id]?.trim();
    if (!msg) return;
    setSendingId(enroll.id);
    const res = await fetch(`${API}/api/admin/contact-messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token ?? "" },
      body: JSON.stringify({ phone: enroll.phone, customerName: enroll.customerName, message: msg }),
    });
    if (res.ok) {
      setMsgInputs((prev) => ({ ...prev, [enroll.id]: "" }));
      setMsgOpenId(null);
      toast({ title: "تم إرسال الرسالة", description: `سيراها ${enroll.customerName} في لوحة حسابه` });
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: "تعذّر الإرسال", description: err.error ?? "تحقق من أن العميل لديه حساب في المتجر", variant: "destructive" });
    }
    setSendingId(null);
  };

  const prefillLinkMsg = (enroll: Enrollment) => {
    const link = linkInputs[enroll.id] || enroll.trainingLink || "";
    if (link) {
      setMsgInputs((prev) => ({
        ...prev,
        [enroll.id]: `مرحباً ${enroll.customerName}،\nيسعدنا إخبارك بأن رابط دورتك جاهز:\n${link}\nفريق Vermifert`,
      }));
    }
    setMsgOpenId(enroll.id);
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
            احفظ رابط الدورة وأرسل رسالة مباشرة تظهر في حساب العميل
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
            {enrollments.map((enroll) => {
              const msgOpen = msgOpenId === enroll.id;
              return (
                <div key={enroll.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">

                  {/* ── Top row ── */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <span className="font-bold text-foreground">{enroll.customerName}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${enroll.status === "confirmed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                          {enroll.status === "confirmed" ? "مؤكّد" : "جديد"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span dir="ltr">{enroll.phone}</span></span>
                        <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 shrink-0" />{COURSE_LABELS[enroll.courseId] ?? enroll.courseId}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{format(new Date(enroll.createdAt), "d MMMM yyyy، HH:mm", { locale: ar })}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStatus(enroll.id, enroll.status)}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${enroll.status === "confirmed" ? "border-muted bg-muted text-muted-foreground hover:bg-muted/80" : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"}`}
                    >
                      {enroll.status === "confirmed"
                        ? <><Clock className="w-4 h-4" /> إلغاء التأكيد</>
                        : <><CheckCircle2 className="w-4 h-4" /> تأكيد</>}
                    </button>
                  </div>

                  {/* ── Training link ── */}
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
                      <button
                        onClick={() => saveLink(enroll)}
                        disabled={savingId === enroll.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Save className="w-4 h-4" />
                        {savingId === enroll.id ? "جاري..." : "حفظ"}
                      </button>
                    </div>
                    {enroll.trainingLink && (
                      <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        الرابط محفوظ — يظهر للمتدرّب في لوحة حسابه
                      </p>
                    )}
                  </div>

                  {/* ── Send in-app message ── */}
                  <div className="mt-3">
                    <button
                      onClick={() => msgOpen ? setMsgOpenId(null) : prefillLinkMsg(enroll)}
                      className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      إرسال رسالة للعميل
                      {msgOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {msgOpen && (
                      <div className="mt-2 space-y-2">
                        <textarea
                          rows={3}
                          placeholder="اكتب رسالتك هنا..."
                          value={msgInputs[enroll.id] ?? ""}
                          onChange={(e) => setMsgInputs((prev) => ({ ...prev, [enroll.id]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => sendMessage(enroll)}
                            disabled={sendingId === enroll.id || !msgInputs[enroll.id]?.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                            {sendingId === enroll.id ? "جاري الإرسال..." : "إرسال"}
                          </button>
                          <p className="text-xs text-muted-foreground">ستظهر في لوحة حساب العميل مباشرة</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
