import AdminSidebar from "@/components/AdminSidebar";
import { useListConsultations, useUpdateConsultationStatus, getListConsultationsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ConsultationStatusUpdateStatus } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Sprout, MessageCircle, Trash2, Check, MailOpen } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ContactMessage {
  id: number;
  customerName: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  adminReply: string | null;
  createdAt: string;
}

export default function AdminConsultations() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const { data: consultations, isLoading: consultLoading } = useListConsultations(
    { request: { headers: { "x-admin-token": token || "" } } },
    { query: { enabled: !!token } }
  );
  const updateStatus = useUpdateConsultationStatus({ request: { headers: { "x-admin-token": token || "" } } });

  // ── Contact Messages ──────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<number, string>>({});

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    setMsgLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/contact-messages`, {
        headers: { "x-admin-token": token },
      });
      if (res.ok) setMessages(await res.json());
    } finally { setMsgLoading(false); }
  }, [token]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markRead = async (id: number) => {
    await fetch(`${API}/api/admin/contact-messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token! },
      body: JSON.stringify({ isRead: true }),
    });
    fetchMessages();
  };

  const sendReply = async (id: number) => {
    const reply = (replyText[id] ?? "").trim();
    if (!reply) return;
    const res = await fetch(`${API}/api/admin/contact-messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token! },
      body: JSON.stringify({ isRead: true, adminReply: reply }),
    });
    if (res.ok) {
      toast({ title: "تم حفظ الردّ" });
      setReplyText(prev => ({ ...prev, [id]: "" }));
      fetchMessages();
    }
  };

  const deleteMessage = async (id: number) => {
    await fetch(`${API}/api/admin/contact-messages/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token! },
    });
    fetchMessages();
  };

  // ── Consultations helpers ─────────────────────────────────────────────────
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

  const getStatusLabel = (s: string) => ({ new: "جديدة", in_progress: "قيد المعالجة", answered: "تم الرد" }[s] ?? s);
  const getStatusColor = (s: string) => ({ new: "bg-blue-500/10 text-blue-600", in_progress: "bg-yellow-500/10 text-yellow-600", answered: "bg-green-500/10 text-green-600" }[s] ?? "bg-muted text-muted-foreground");
  const getSoilLabel = (t: string) => ({ sandy: "رملية", clay: "طينية", silt: "غرينية", loam: "مزيجية", rocky: "صخرية", other: "أخرى" }[t] ?? t);

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">الاستشارات والتواصل</h1>

          <Tabs defaultValue="messages" dir="rtl">
            <TabsList className="mb-6 h-11">
              <TabsTrigger value="messages" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                رسائل التواصل
                {unreadCount > 0 && (
                  <span className="ml-1.5 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="consultations" className="gap-2">
                <Sprout className="w-4 h-4" />
                الاستشارات الزراعية
              </TabsTrigger>
            </TabsList>

            {/* ── Contact Messages Tab ── */}
            <TabsContent value="messages">
              {msgLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">لا توجد رسائل بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`bg-card border rounded-xl p-5 transition-colors ${msg.isRead ? "border-border" : "border-primary/40 ring-1 ring-primary/20"}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {!msg.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                            <span className="font-bold text-sm">{msg.customerName}</span>
                            {msg.phone && (
                              <span className="text-xs text-muted-foreground" dir="ltr">{msg.phone}</span>
                            )}
                            <span className="text-xs text-muted-foreground mr-auto">
                              {format(new Date(msg.createdAt), "d MMMM yyyy · HH:mm", { locale: ar })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed bg-muted/40 rounded-lg px-3 py-2 border border-border mt-2">
                            {msg.message}
                          </p>
                          {msg.adminReply && (
                            <div className="mt-3 border-r-2 border-primary pr-3">
                              <p className="text-xs text-primary font-bold mb-1">ردّ الإدارة:</p>
                              <p className="text-sm text-muted-foreground">{msg.adminReply}</p>
                            </div>
                          )}

                          {/* Reply textarea */}
                          <div className="mt-3 flex gap-2">
                            <Textarea
                              rows={2}
                              placeholder="اكتب ردّاً (يُحفظ فقط — لا يُرسل تلقائياً)..."
                              value={replyText[msg.id] ?? ""}
                              onChange={e => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                              className="text-sm resize-none"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 h-auto"
                              onClick={() => sendReply(msg.id)}
                              disabled={!(replyText[msg.id] ?? "").trim()}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {!msg.isRead && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="وضع علامة مقروء" onClick={() => markRead(msg.id)}>
                              <MailOpen className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMessage(msg.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Consultations Tab ── */}
            <TabsContent value="consultations">
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
                        <th className="px-6 py-4 font-medium text-left">التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {consultLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            {[...Array(6)].map((__, j) => (
                              <td key={j} className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                            ))}
                          </tr>
                        ))
                      ) : consultations?.length ? (
                        consultations.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-medium">#{item.id}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold">{item.customerName}</div>
                              <div className="text-xs text-muted-foreground mt-1" dir="ltr">{item.phone}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-primary">{item.crop}</div>
                              <div className="text-xs text-muted-foreground mt-1">التربة: {getSoilLabel(item.soilType)}</div>
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
                              <div className="flex items-center justify-end gap-3">
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
                                        <div><p className="text-sm text-muted-foreground mb-1">الاسم</p><p className="font-bold">{item.customerName}</p></div>
                                        <div><p className="text-sm text-muted-foreground mb-1">الهاتف</p><p className="font-bold" dir="ltr">{item.phone}</p></div>
                                        <div><p className="text-sm text-muted-foreground mb-1">المحصول</p><p className="font-bold">{item.crop}</p></div>
                                        <div><p className="text-sm text-muted-foreground mb-1">نوع التربة</p><p className="font-bold">{getSoilLabel(item.soilType)}</p></div>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-2">وصف المشكلة</p>
                                        <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed border border-border">{item.problem}</div>
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
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">لا توجد استشارات</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
