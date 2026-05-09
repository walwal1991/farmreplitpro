import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2, Loader2, X, MessageCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.BASE_URL + "api";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "ما هو سماد الديدان؟",
  "كيف أستخدم السماد الصلب؟",
  "هل السماد آمن للخضروات؟",
  "كم مدة التوصيل؟",
];

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  async function ensureConversation(): Promise<number> {
    if (conversationId) return conversationId;
    const res = await fetch(`${API}/openai/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "محادثة الدعم" }),
    });
    const conv = await res.json();
    setConversationId(conv.id);
    return conv.id;
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;
    setShowSuggestions(false);
    const userMsg: Message = { id: Date.now(), role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamingContent("");

    try {
      const convId = await ensureConversation();
      const res = await fetch(`${API}/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });

      if (!res.ok || !res.body) throw new Error("فشل الاتصال");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.done) break;
            if (parsed.content) { full += parsed.content; setStreamingContent(full); }
          } catch {}
        }
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: full }]);
      setStreamingContent("");
    } catch {
      toast({ title: "خطأ", description: "تعذّر الاتصال. حاول مجدداً.", variant: "destructive" });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function clearChat() {
    if (conversationId) {
      try { await fetch(`${API}/openai/conversations/${conversationId}`, { method: "DELETE" }); } catch {}
    }
    setMessages([]);
    setConversationId(null);
    setStreamingContent("");
    setShowSuggestions(true);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3" dir="rtl">
      {/* Chat window */}
      {open && (
        <div className="w-[340px] sm:w-[380px] bg-background border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "480px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">مساعد Vermifert</p>
                <p className="text-[11px] opacity-75 mt-0.5">متاح دائماً للمساعدة</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  disabled={streaming}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="مسح المحادثة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">كيف يمكنني مساعدتك؟</p>
                  <p className="text-xs text-muted-foreground mt-1">اختر سؤالاً أو اكتب استفسارك</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground/50 animate-bounce" />
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white mt-0.5 ${
                  msg.role === "user" ? "bg-primary" : "bg-emerald-600"
                }`}>
                  {msg.role === "user"
                    ? <User className="w-3 h-3" />
                    : <Bot className="w-3 h-3" />}
                </div>
                <div className={`max-w-[78%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted rounded-tl-none"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {streaming && (
              <div className="flex gap-2 flex-row">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-emerald-600 text-white mt-0.5">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="max-w-[78%] rounded-xl rounded-tl-none px-3 py-2 text-xs leading-relaxed bg-muted whitespace-pre-wrap">
                  {streamingContent || <TypingDots />}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {showSuggestions && messages.length === 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={streaming}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-border/60 bg-background hover:bg-muted hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 flex gap-2 border-t border-border/40">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="اكتب سؤالك..."
              dir="rtl"
              disabled={streaming}
              className="flex-1 h-9 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              {streaming
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
        aria-label="فتح المساعد الذكي"
      >
        {open
          ? <X className="w-6 h-6" />
          : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
