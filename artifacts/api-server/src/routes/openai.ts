import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const FAQ_SYSTEM_PROMPT = `أنت مساعد ذكي لمتجر Vermifert لسماد الديدان (الدبال). مهمتك الإجابة على الأسئلة الشائعة بشكل واضح ومفيد باللغة العربية.

معلومات عن المتجر:
- نبيع سماد الديدان (الدبال) بشكلين: سائل وصلب
- نقدم خدمة الاشتراك الشهري للسماد
- لدينا خدمة التشخيص الذكي للتربة وتوصية بالمنتجات المناسبة
- نقبل المخلفات العضوية من العملاء لتحويلها إلى سماد
- لدينا نظام تتبع الطلبات
- نقدم استشارات زراعية مجانية

الأسئلة الشائعة التي يجب أن تعرف إجابتها:
- ما هو سماد الديدان؟ وما فوائده؟
- كيف أستخدم السماد الصلب مقابل السائل؟
- كم مرة أُسمّد نباتاتي؟
- هل السماد آمن للخضروات والفواكه؟
- كيف أطلب؟ وما طرق الدفع المتاحة؟
- كم مدة التوصيل؟
- ما هو نظام الاشتراك؟
- كيف أستفيد من خدمة التشخيص الذكي؟
- هل يمكنني إعطاء مخلفاتي العضوية للمتجر؟
- ما الفرق بين السماد العضوي والكيميائي؟

قواعد:
- أجب دائماً بالعربية
- كن مختصراً وعملياً
- إذا سُئلت عن شيء خارج نطاق المتجر، وجّه المستخدم بلطف للاستفسار عن منتجاتنا
- استخدم الإيموجي المناسبة لجعل الإجابة أكثر وضوحاً`;

router.get("/openai/conversations", async (_req, res) => {
  const rows = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(rows);
});

router.post("/openai/conversations", async (req, res) => {
  const { title } = req.body as { title: string };
  const [conv] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) return res.status(404).json({ error: "Not found" });
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) return res.status(404).json({ error: "Not found" });
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  const { content } = req.body as { content: string };

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) return res.status(404).json({ error: "Not found" });

  await db.insert(messages).values({ conversationId: id, role: "user", content });

  const history = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);

  const chatMessages = [
    { role: "system" as const, content: FAQ_SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  const stream = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 8192,
    messages: chatMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullResponse += delta;
      res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
    }
  }

  await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
