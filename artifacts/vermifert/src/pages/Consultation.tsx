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
  CheckCircle2, Sprout, MessageCircle, Send, RefreshCw, User, Recycle, ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { ConsultationInputSoilType } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import { useLang } from "@/lib/i18n";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

function getLoggedInCustomer(): { id: number; name: string } | null {
  try {
    return JSON.parse(localStorage.getItem("customerUser") ?? "null");
  } catch { return null; }
}

function getOrCreateSession(): { sessionId: string; customerName: string | null } {
  const customer = getLoggedInCustomer();
  const sessionKey = customer ? `chatSessionId_account_${customer.id}` : "chatSessionId_guest";
  const nameKey    = customer ? null : "chatCustomerName_guest";
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(sessionKey, sessionId);
  }
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

function ChatBubble({ msg, lang }: { msg: ChatMsg; lang: string }) {
  const locale = lang === "fr" ? fr : lang === "en" ? enUS : ar;
  const time = (ts: string) => format(new Date(ts), "HH:mm", { locale });
  return (
    <div className="space-y-2">
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
          <span className="text-[10px] opacity-70 block mt-1 text-left">{time(msg.createdAt)}</span>
        </div>
      </div>
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

function ChatView() {
  const { toast } = useToast();
  const { lang, t } = useLang();
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

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem("customerToken") ?? "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["x-customer-token"] = token;
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
  }, [sessionId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
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
      const token = localStorage.getItem("customerToken") ?? "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["x-customer-token"] = token;
      const res = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers,
        body: JSON.stringify({ customerName: name.trim(), message: text.trim(), sessionId }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: t("consult_error"), description: d.error, variant: "destructive" });
        return;
      }
      const created: ChatMsg = await res.json();
      setMessages(prev => [...prev, created]);
      setMsgInput("");
      setPhase("chat");
    } catch {
      toast({ title: t("consult_send_error"), description: t("consult_send_error_desc"), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = loggedInCustomer ? loggedInCustomer.name : nameInput.trim();
    if (!name || !msgInput.trim()) return;
    if (!loggedInCustomer) localStorage.setItem("chatCustomerName_guest", name);
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

  if (phase === "intro" && !loading) {
    return (
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">{t("consult_support_name")}</p>
            <p className="text-white/70 text-xs">{t("consult_reply_time")}</p>
          </div>
        </div>

        <div className="px-6 pt-6 pb-2">
          <div className="flex justify-end mb-4">
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <p className="text-sm leading-relaxed">{t("consult_welcome_msg")}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleStartChat} className="px-6 pb-6 space-y-3">
          {!loggedInCustomer ? (
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2.5">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder={t("consult_name_full_ph")}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                required
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
              <User className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-primary">{loggedInCustomer.name}</span>
              <span className="text-xs text-muted-foreground mr-auto">{t("consult_logged_in")}</span>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("consult_msg_question_ph")}
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

  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: "520px" }}>
      <div className="bg-primary px-5 py-3.5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <Sprout className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{t("consult_support_name")}</p>
          <p className="text-white/70 text-xs">{t("consult_reply_time")}</p>
        </div>
        <button
          onClick={() => fetchMessages(true)}
          title={t("consult_refresh")}
          className="text-white/70 hover:text-white transition-colors p-1"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ background: "hsl(var(--muted)/0.3)", direction: "rtl" }}
      >
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="flex justify-end">
          <div className="max-w-[80%] bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Sprout className="w-2.5 h-2.5 text-primary" />
              </div>
              <span className="text-[10px] text-primary font-bold">{t("consult_support_team")}</span>
            </div>
            <p className="text-sm leading-relaxed">{t("consult_chat_welcome")}</p>
          </div>
        </div>

        {messages.map(msg => <ChatBubble key={msg.id} msg={msg} lang={lang} />)}

        {messages.length > 0 && !messages[messages.length - 1].adminReply && (
          <div className="flex justify-end">
            <p className="text-xs text-muted-foreground italic">{t("consult_waiting_reply")}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-border px-4 py-3 flex gap-2 items-end shrink-0 bg-background">
        <textarea
          value={msgInput}
          onChange={e => setMsgInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("consult_input_ph")}
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

type ConsultationForm = {
  customerName: string;
  phone: string;
  soilType: ConsultationInputSoilType;
  crop: string;
  problem: string;
};

export default function Consultation() {
  const { t, dir } = useLang();
  const [consultSuccess, setConsultSuccess] = useState(false);
  const createConsultation = useCreateConsultation();

  const consultationSchema = z.object({
    customerName: z.string().min(2, t("consult_err_name")),
    phone: z.string().min(8, t("consult_err_phone")),
    soilType: z.nativeEnum(ConsultationInputSoilType, { required_error: t("consult_err_soil") }),
    crop: z.string().min(2, t("consult_err_crop")),
    problem: z.string().min(10, t("consult_err_problem")),
  });

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
            {t("consult_page_title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t("consult_page_sub")}
          </p>
        </div>

        <Tabs defaultValue="chat" dir={dir} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
            <TabsTrigger value="chat" className="gap-2 text-sm font-medium">
              <MessageCircle className="w-4 h-4" />
              {t("consult_chat_tab")}
            </TabsTrigger>
            <TabsTrigger value="consultation" className="gap-2 text-sm font-medium">
              <Sprout className="w-4 h-4" />
              {t("consult_form_tab")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ChatView />
          </TabsContent>

          <TabsContent value="consultation">
            {consultSuccess ? (
              <div className="py-8 flex justify-center">
                <div className="max-w-md w-full bg-card p-8 rounded-3xl text-center space-y-6 border border-border shadow-lg">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold">{t("consult_success_title2")}</h2>
                  <p className="text-muted-foreground">{t("consult_success_desc")}</p>
                  <div className="flex gap-3">
                    <Button asChild className="flex-1"><a href="/">{t("consult_home")}</a></Button>
                    <Button variant="outline" className="flex-1" onClick={() => setConsultSuccess(false)}>
                      {t("consult_send_another")}
                    </Button>
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
                    <h2 className="font-bold text-lg">{t("consult_free_title")}</h2>
                    <p className="text-sm text-muted-foreground">{t("consult_free_desc")}</p>
                  </div>
                </div>

                <form onSubmit={consultForm.handleSubmit(onSubmitConsult)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>{t("consult_full_name")}</Label>
                      <Input {...consultForm.register("customerName")} />
                      {consultForm.formState.errors.customerName && (
                        <p className="text-sm text-destructive">{consultForm.formState.errors.customerName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>{t("consult_phone")}</Label>
                      <Input type="tel" dir="ltr" className="text-right" {...consultForm.register("phone")} />
                      {consultForm.formState.errors.phone && (
                        <p className="text-sm text-destructive">{consultForm.formState.errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>{t("consult_crop")}</Label>
                      <Input placeholder={t("consult_crop_ph")} {...consultForm.register("crop")} />
                      {consultForm.formState.errors.crop && (
                        <p className="text-sm text-destructive">{consultForm.formState.errors.crop.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>{t("consult_soil_type")}</Label>
                      <Controller
                        control={consultForm.control}
                        name="soilType"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder={t("consult_soil_placeholder")} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandy">{t("consult_soil_sandy")}</SelectItem>
                              <SelectItem value="clay">{t("consult_soil_clay")}</SelectItem>
                              <SelectItem value="silt">{t("consult_soil_silt")}</SelectItem>
                              <SelectItem value="loam">{t("consult_soil_loam")}</SelectItem>
                              <SelectItem value="rocky">{t("consult_soil_rocky")}</SelectItem>
                              <SelectItem value="other">{t("consult_soil_other")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {consultForm.formState.errors.soilType && (
                        <p className="text-sm text-destructive">{consultForm.formState.errors.soilType.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("consult_problem")}</Label>
                    <Textarea rows={5} placeholder={t("consult_problem_ph")} {...consultForm.register("problem")} />
                    {consultForm.formState.errors.problem && (
                      <p className="text-sm text-destructive">{consultForm.formState.errors.problem.message}</p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="px-12 h-14 text-lg" disabled={createConsultation.isPending}>
                    {createConsultation.isPending ? t("consult_sending") : t("consult_send_btn")}
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
