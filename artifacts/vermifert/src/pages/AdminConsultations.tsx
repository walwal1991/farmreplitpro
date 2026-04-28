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
import { Eye, Sprout, MessageCircle, Trash2, Send, RefreshCw } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ContactMessage {
  id: number;
  customerName: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  adminReply: string | null;
  sessionId: string | null;
  createdAt: string;
}

// Group messages by session
interface Session {
  sessionId: string;
  customerName: string;
  phone: string | null;
  messages: ContactMessage[];
  hasUnread: boolean;
  lastActivity: string;
}

function groupBySessions(msgs: ContactMessage[]): Session[] {
  const map = new Map<string, Session>();
  for (const m of msgs) {
    const key = m.sessionId ?? `solo_${m.id}`;
    if (!map.has(key)) {
      map.set(key, {
        sessionId: key,
        customerName: m.customerName,
        phone: m.phone,
        messages: [],
        hasUnread: false,
        lastActivity: m.createdAt,
      });
    }
    const s = map.get(key)!;
    s.messages.push(m);
    if (!m.isRead) s.hasUnread = true;
    if (m.createdAt > s.lastActivity) s.lastActivity = m.createdAt;
  }
  return Array.from(map.values()).sort((a, b) =>
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );
}

function ChatThread({
  session, token, onRefresh,
}: { session: Session; token: string; onRefresh: () => void }) {
  const { toast } = useToast();
  const [reply, setReply] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const saveReply = async (msgId: number) => {
    const text = (reply[msgId] ?? "").trim();
    if (!text) return;
    setSaving(msgId);
    try {
      const res = await fetch(`${API}/api/admin/contact-messages/${msgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ isRead: true, adminReply: text }),
      });
      if (res.ok) {
        toast({ title: "تم حفظ الردّ" });
        setReply(prev => ({ ...prev, [msgId]: "" }));
        onRefresh();
      }
    } finally { setSaving(null); }
  };

  const deleteMsg = async (msgId: number) => {
    await fetch(`${API}/api/admin/contact-messages/${msgId}`, {
      method: "DELETE", headers: { "x-admin-token": token },
    });
    onRefresh();
  };

  const markRead = async (msgId: number) => {
    await fetch(`${API}/api/admin/contact-messages/${msgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ isRead: true }),
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {session.messages.map(msg => (
        <div key={msg.id} className={`rounded-xl border p-4 transition-colors ${msg.isRead ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {!msg.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                <span className="font-bold text-sm">{msg.customerName}</span>
                {msg.phone && <span className="text-xs text-muted-foreground" dir="ltr">{msg.phone}</span>}
                <span className="text-xs text-muted-foreground mr-auto">
                  {format(new Date(msg.createdAt), "d MMM yyyy · HH:mm", { locale: ar })}
                </span>
              </div>
              {/* Customer message bubble */}
              <div className="mt-2 bg-primary text-primary-foreground rounded-xl rounded-tr-sm px-3 py-2 text-sm inline-block max-w-full whitespace-pre-wrap">
                {msg.message}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              {!msg.isRead && (
                <button onClick={() => markRead(msg.id)} title="وضع علامة مقروء"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs">✓</button>
              )}
              <button onClick={() => deleteMsg(msg.id)} title="حذف"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Existing reply */}
          {msg.adminReply && (
            <div className="mb-3 flex justify-end">
              <div className="border-l-2 border-primary pl-3 max-w-[90%]">
                <p className="text-xs text-primary font-bold mb-0.5">ردّك:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.adminReply}</p>
              </div>
            </div>
          )}

          {/* Reply input */}
          <div className="flex gap-2 items-end mt-2">
            <Textarea
              rows={2}
              placeholder="اردّ على هذه الرسالة..."
              value={reply[msg.id] ?? ""}
              onChange={e => setReply(prev => ({ ...prev, [msg.id]: e.target.value }))}
              className="text-sm resize-none flex-1"
            />
            <Button
              size="sm"
              className="gap-1.5 shrink-0 h-auto py-2"
              onClick={() => saveReply(msg.id)}
              disabled={saving === msg.id || !(reply[msg.id] ?? "").trim()}
            >
              {saving === msg.id
                ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <><Send className="w-3.5 h-3.5" />ردّ</>
              }
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
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

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    setMsgLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/contact-messages`, {
        headers: { "x-admin-token": token },
      });
      if (res.ok) {
        const data: ContactMessage[] = await res.json();
        setMessages(data);
        if (!activeSession && data.length > 0) {
          const sessions = groupBySessions(data);
          if (sessions.length > 0) setActiveSession(sessions[0].sessionId);
        }
      }
    } finally { setMsgLoading(false); }
  }, [token, activeSession]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const sessions = groupBySessions(messages);
  const unreadCount = sessions.filter(s => s.hasUnread).length;
  const currentSession = sessions.find(s => s.sessionId === activeSession);

  const handleStatusChange = (id: number, newStatus: ConsultationStatusUpdateStatus) => {
    updateStatus.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
        toast({ title: "تم التحديث" });
      },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  const getStatusLabel = (s: string) => ({ new: "جديدة", in_progress: "قيد المعالجة", answered: "تم الرد" }[s] ?? s);
  const getStatusColor = (s: string) => ({ new: "bg-blue-500/10 text-blue-600", in_progress: "bg-yellow-500/10 text-yellow-600", answered: "bg-green-500/10 text-green-600" }[s] ?? "bg-muted text-muted-foreground");
  const getSoilLabel = (t: string) => ({ sandy: "رملية", clay: "طينية", silt: "غرينية", loam: "مزيجية", rocky: "صخرية", other: "أخرى" }[t] ?? t);

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
                  <span className="mr-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="consultations" className="gap-2">
                <Sprout className="w-4 h-4" />
                الاستشارات الزراعية
              </TabsTrigger>
            </TabsList>

            {/* ── Messages Tab ── */}
            <TabsContent value="messages">
              {msgLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-20" />)}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">لا توجد رسائل بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-[280px_1fr] gap-4 items-start">
                  {/* Sessions sidebar */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <span className="text-sm font-bold">المحادثات ({sessions.length})</span>
                      <button onClick={() => fetchMessages()} title="تحديث" className="text-muted-foreground hover:text-foreground transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                      {sessions.map(s => (
                        <button
                          key={s.sessionId}
                          onClick={() => setActiveSession(s.sessionId)}
                          className={`w-full text-right px-4 py-3 flex items-start gap-2 transition-colors ${activeSession === s.sessionId ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        >
                          {s.hasUnread && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{s.customerName}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {s.messages[s.messages.length - 1]?.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {format(new Date(s.lastActivity), "d MMM · HH:mm", { locale: ar })}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{s.messages.length}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thread panel */}
                  <div className="bg-card border border-border rounded-xl p-5">
                    {currentSession ? (
                      <>
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {currentSession.customerName[0]}
                          </div>
                          <div>
                            <p className="font-bold">{currentSession.customerName}</p>
                            {currentSession.phone && <p className="text-xs text-muted-foreground" dir="ltr">{currentSession.phone}</p>}
                          </div>
                          <span className="mr-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            {currentSession.messages.length} رسالة
                          </span>
                        </div>
                        <ChatThread session={currentSession} token={token} onRefresh={fetchMessages} />
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                        اختر محادثة من القائمة
                      </div>
                    )}
                  </div>
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
                                    <Button variant="ghost" size="icon"><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                                  </DialogTrigger>
                                  <DialogContent className="rtl">
                                    <DialogHeader><DialogTitle>تفاصيل الاستشارة #{item.id}</DialogTitle></DialogHeader>
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
                                  <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
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
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">لا توجد استشارات</td></tr>
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
