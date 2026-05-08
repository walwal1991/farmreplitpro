import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2, MessageCircleQuestion, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const API = import.meta.env.BASE_URL + "api";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "ما هو سماد الديدان وما فوائده؟",
  "كيف أستخدم السماد الصلب؟",
  "كم مرة أُسمّد نباتاتي في الشهر؟",
  "هل السماد آمن للخضروات؟",
  "كيف أطلب وما طرق الدفع؟",
  "كم مدة التوصيل؟",
  "ما هو نظام الاشتراك الشهري؟",
  "كيف أستفيد من التشخيص الذكي؟",
];

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

export default function FAQ() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function ensureConversation(): Promise<number> {
    if (conversationId) return conversationId;
    const res = await fetch(`${API}/openai/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "جلسة الأسئلة الشائعة" }),
    });
    const conv = await res.json();
    setConversationId(conv.id);
    return conv.id;
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;
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

      if (!res.ok || !res.body) throw new Error("فشل الاتصال بالمساعد");

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
            if (parsed.content) {
              full += parsed.content;
              setStreamingContent(full);
            }
          } catch {}
        }
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: full },
      ]);
      setStreamingContent("");
    } catch (err) {
      toast({ title: "خطأ", description: "تعذّر الاتصال بالمساعد. حاول مجدداً.", variant: "destructive" });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function clearChat() {
    if (conversationId) {
      try {
        await fetch(`${API}/openai/conversations/${conversationId}`, { method: "DELETE" });
      } catch {}
    }
    setMessages([]);
    setConversationId(null);
    setStreamingContent("");
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <MessageCircleQuestion className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">مساعد Vermifert الذكي</h1>
          <p className="text-muted-foreground">اسألنا أي شيء عن منتجاتنا والزراعة العضوية</p>
        </div>

        {/* Chat area */}
        <Card className="border-border/60 mb-4 h-[480px] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {messages.length === 0 && !streaming && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
                <Bot className="w-12 h-12 text-primary/40" />
                <div>
                  <p className="font-medium text-muted-foreground mb-1">مرحباً! كيف يمكنني مساعدتك؟</p>
                  <p className="text-sm text-muted-foreground/70">اختر سؤالاً من الأسفل أو اكتب سؤالك الخاص</p>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground/40 animate-bounce" />
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm ${
                    msg.role === "user" ? "bg-primary" : "bg-emerald-600"
                  }`}
                >
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {streaming && (
              <div className="flex gap-3 flex-row">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-emerald-600 text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-none px-4 py-2.5 text-sm leading-relaxed bg-muted whitespace-pre-wrap">
                  {streamingContent || <TypingDots />}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </CardContent>
        </Card>

        {/* Suggested questions */}
        {messages.length === 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={streaming}
                className="text-right text-sm px-3 py-2 rounded-xl border border-border/60 bg-background hover:bg-muted hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="اكتب سؤالك هنا..."
            dir="rtl"
            disabled={streaming}
            className="flex-1 h-12"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="h-12 px-4"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
          {messages.length > 0 && (
            <Button
              variant="outline"
              onClick={clearChat}
              disabled={streaming}
              className="h-12 px-4"
              title="مسح المحادثة"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
