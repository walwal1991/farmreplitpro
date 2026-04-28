import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateConsultation } from "@workspace/api-client-react";
import {
  CheckCircle2, Sprout, MessageCircle, Send, RefreshCw, User,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { ConsultationInputSoilType } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Session helpers ─────────────────────────────────────────────────────────
function getLoggedInCustomer(): { id: number; name: string } | null {
  try {
    return JSON.parse(localStorage.getItem("customerUser") ?? "null");
  } catch { return null; }
}

function getOrCreateSession(): { sessionId: string; customerName: string | null } {
  const customer = getLoggedInCustomer();

  // Use a per-account key so different accounts never share the same session
  const sessionKey = customer ? `chatSessionId_account_${customer.id}` : "chatSessionId_guest";
  const nameKey    = customer ? null : "chatCustomerName_guest";

  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(sessionKey, sessionId);
  }

  // Logged-in customers always use their account name
  const customerName = customer ? customer.name : (nameKey ? localStorage.getItem(nameKey) : null);
  return { sessionId, customerName };
}

interface ChatMsg {
  id: number;
  customerName: string;
  message: string;
  adminReply: string | null;
  createdAt: string;
}

// ── Consultation form schema ────────────────────────────────────────────────
const consultationSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  soilType: z.nativeEnum(ConsultationInputSoilType, { required_error: "نوع التربة مطلوب" }),
  crop: z.string().min(2, "نوع المحصول مطلوب"),
  problem: z.string().min(10, "يرجى وصف المشكلة بتفصيل أكثر (10 أحرف على الأقل)"),
});
type ConsultationForm = z.infer<typeof consultationSchema>;

// ── Chat bubble ────────────────────────────────────────────────────────────
function ChatBubble({ msg }: { msg: ChatMsg }) {
  const time = (ts: string) => format(new Date(ts), "HH:mm", { locale: ar });
  return (
    <div className="space-y-2">
      {/* Customer message — right aligned */}
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
          <span className="text-[10px] opacity-70 block mt-1 text-left">{time(msg.createdAt)}</span>
        </div>
      </div>
      {/* Admin reply — left aligned */}
      {msg.adminReply && (
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Sprout className="w-2.5 h-2.5 text-primary" />
              </div>
              <span className="text-[10px] text-primary font-bold">فريق الدعم</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.adminReply}</p>
            <span className="text-[10px] text-muted-foreground block mt-1 text-right">{time(msg.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chat component ─────────────────────────────────────────────────────────
function ChatView() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<"intro" | "chat">("intro");
  const loggedInCustomer = getLoggedInCustomer();
  const session = getOrCreateSession();
  const [nameInput, setNameInput] = useState(session.customerName ?? "");
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => session.sessionId);
  const [customerName, setCustomerName] = useState(() => session.customerName ?? "");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const customerToken = localStorage.getItem("customerToken") ?? "";

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customerToken) headers["x-customer-token"] = customerToken;
      const res = await fetch(`${API}/api/contact/session`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        const data: ChatMsg[] = await res.json();
        setMessages(data);
        if (data.length > 0) setPhase("chat");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId, customerToken]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll every 15 seconds when chat is open
  useEffect(() => {
    if (phase === "chat") {
      pollingRef.current = setInterval(() => fetchMessages(true), 15_000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [phase, fetchMessages]);

  const sendMessage = async (text: string, name: string) => {
    if (!text.trim() || !name.trim()) return;
    setSending(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customerToken) headers["x-customer-token"] = customerToken;
      const res = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers,
        body: JSON.stringify({ customerName: name.trim(), message: text.trim(), sessionId }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "خطأ", description: d.error, variant: "destructive" });
        return;
      }
      const created: ChatMsg = await res.json();
      setMessages(prev => [...prev, created]);
      setMsgInput("");
      setPhase("chat");
    } catch {
      toast({ title: "خطأ في الإرسال", description: "يرجى المحاولة لاحقاً", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = loggedInCustomer ? loggedInCustomer.name : nameInput.trim();
    if (!name || !msgInput.trim()) return;
    if (!loggedInCustomer) {
      localStorage.setItem("chatCustomerName_guest", name);
    }
    setCustomerName(name);
    await sendMessage(msgInput, name);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(msgInput, customerName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (phase === "chat") handleSend(e as unknown as React.FormEvent);
    }
  };

  // ── Intro screen (first visit, no messages yet) ──
  if (phase === "intro" && !loading) {
    return (
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">فريق دعم متجر سماد الديدان</p>
            <p className="text-white/70 text-xs">نردّ عادةً خلال ساعات قليلة</p>
          </div>
        </div>

        {/* Welcome bubble */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex justify-end mb-4">
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <p className="text-sm leading-relaxed">
                مرحباً بك 👋 اكتب اسمك وسؤالك وسيردّ عليك فريقنا في أقرب وقت.
              </p>
            </div>
          </div>
        </div>

        {/* Intro form */}
        <form onSubmit={handleStartChat} className="px-6 pb-6 space-y-3">
          {/* Show name field only for guests */}
          {!loggedInCustomer ? (
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2.5">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="اسمك الكامل..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                required
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
              <User className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-primary">{loggedInCustomer.name}</span>
              <span className="text-xs text-muted-foreground mr-auto">مسجّل دخولك</span>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا..."
              rows={3}
              className="flex-1 resize-none bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              required
            />
            <button
              type="submit"
              disabled={sending || (!loggedInCustomer && !nameInput.trim()) || !msgInput.trim()}
              className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Chat screen ──
  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: "520px" }}>
      {/* Header */}
      <div className="bg-primary px-5 py-3.5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <Sprout className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">فريق دعم متجر سماد الديدان</p>
          <p className="text-white/70 text-xs">نردّ عادةً خلال ساعات قليلة</p>
        </div>
        <button
          onClick={() => fetchMessages(true)}
          title="تحديث"
          className="text-white/70 hover:text-white transition-colors p-1"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ background: "hsl(var(--muted)/0.3)", direction: "rtl" }}
      >
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Welcome bubble from admin */}
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Sprout className="w-2.5 h-2.5 text-primary" />
              </div>
              <span className="text-[10px] text-primary font-bold">فريق الدعم</span>
            </div>
            <p className="text-sm leading-relaxed">مرحباً 👋 كيف يمكننا مساعدتك اليوم؟</p>
          </div>
        </div>

        {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}

        {/* "Waiting for reply" hint after last unanswered message */}
        {messages.length > 0 && !messages[messages.length - 1].adminReply && (
          <div className="flex justify-end">
            <p className="text-xs text-muted-foreground italic">بانتظار الردّ...</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="border-t border-border px-4 py-3 flex gap-2 items-end shrink-0 bg-background">
        <textarea
          value={msgInput}
          onChange={e => setMsgInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالتك... (Enter للإرسال)"
          rows={1}
          className="flex-1 resize-none bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground max-h-28 overflow-y-auto"
          style={{ lineHeight: "1.5" }}
        />
        <button
          type="submit"
          disabled={sending || !msgInput.trim()}
          className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send className="w-4 h-4 rotate-180" />
          }
        </button>
      </form>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Consultation() {
  const [consultSuccess, setConsultSuccess] = useState(false);
  const createConsultation = useCreateConsultation();

  const consultForm = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: { customerName: "", phone: "", crop: "", problem: "" }
  });

  const onSubmitConsult = (data: ConsultationForm) => {
    createConsultation.mutate({ data }, { onSuccess: () => setConsultSuccess(true) });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground flex items-center justify-center gap-3">
            <Sprout className="w-8 h-8 text-primary" />
            الاستشارة والتواصل
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            هل لديك سؤال أو مشكلة زراعية؟ راسلنا مباشرة أو احصل على استشارة مفصّلة.
          </p>
        </div>

        <Tabs defaultValue="chat" dir="rtl" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
            <TabsTrigger value="chat" className="gap-2 text-sm font-medium">
              <MessageCircle className="w-4 h-4" />
              محادثة مباشرة
            </TabsTrigger>
            <TabsTrigger value="consultation" className="gap-2 text-sm font-medium">
              <Sprout className="w-4 h-4" />
              استشارة زراعية مفصّلة
            </TabsTrigger>
          </TabsList>

          {/* ── Chat Tab ── */}
          <TabsContent value="chat">
            <ChatView />
          </TabsContent>

          {/* ── Consultation Tab ── */}
          <TabsContent value="consultation">
            {consultSuccess ? (
              <div className="py-8 flex justify-center">
                <div className="max-w-md w-full bg-card p-8 rounded-3xl text-center space-y-6 border border-border shadow-lg">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold">تم إرسال طلبك بنجاح</h2>
                  <p className="text-muted-foreground">
                    سيقوم فريقنا الزراعي بدراسة مشكلتك والتواصل معك قريباً عبر الهاتف أو الواتساب.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild className="flex-1"><a href="/">الرئيسية</a></Button>
                    <Button variant="outline" className="flex-1" onClick={() => setConsultSuccess(false)}>إرسال آخر</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">استشارة زراعية مجانية</h2>
                    <p className="text-sm text-muted-foreground">أخبرنا بتفاصيل مشكلتك للحصول على توصية دقيقة</p>
                  </div>
                </div>

                <form onSubmit={consultForm.handleSubmit(onSubmitConsult)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input {...consultForm.register("customerName")} />
                      {consultForm.formState.errors.customerName && <p className="text-sm text-destructive">{consultForm.formState.errors.customerName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف (واتساب إن أمكن)</Label>
                      <Input type="tel" dir="ltr" className="text-right" {...consultForm.register("phone")} />
                      {consultForm.formState.errors.phone && <p className="text-sm text-destructive">{consultForm.formState.errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>المحصول الزراعي</Label>
                      <Input placeholder="مثال: طماطم، أشجار حمضيات، نباتات زينة..." {...consultForm.register("crop")} />
                      {consultForm.formState.errors.crop && <p className="text-sm text-destructive">{consultForm.formState.errors.crop.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>نوع التربة</Label>
                      <Controller
                        control={consultForm.control}
                        name="soilType"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="اختر نوع التربة" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandy">رملية</SelectItem>
                              <SelectItem value="clay">طينية</SelectItem>
                              <SelectItem value="silt">غرينية</SelectItem>
                              <SelectItem value="loam">مزيجية (Loam)</SelectItem>
                              <SelectItem value="rocky">صخرية</SelectItem>
                              <SelectItem value="other">أخرى / لا أعلم</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {consultForm.formState.errors.soilType && <p className="text-sm text-destructive">{consultForm.formState.errors.soilType.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>وصف المشكلة أو الاستفسار</Label>
                    <Textarea rows={5} placeholder="صف لنا حالة نباتاتك أو ما تود الاستفسار عنه بخصوص التسميد..." {...consultForm.register("problem")} />
                    {consultForm.formState.errors.problem && <p className="text-sm text-destructive">{consultForm.formState.errors.problem.message}</p>}
                  </div>

                  <Button type="submit" size="lg" className="px-12 h-14 text-lg" disabled={createConsultation.isPending}>
                    {createConsultation.isPending ? "جاري الإرسال..." : "إرسال الاستشارة"}
                  </Button>
                </form>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
