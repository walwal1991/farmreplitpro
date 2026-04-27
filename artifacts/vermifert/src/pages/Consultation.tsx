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
import { CheckCircle2, Sprout, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { ConsultationInputSoilType } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const consultationSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  soilType: z.nativeEnum(ConsultationInputSoilType, { required_error: "نوع التربة مطلوب" }),
  crop: z.string().min(2, "نوع المحصول مطلوب"),
  problem: z.string().min(10, "يرجى وصف المشكلة بتفصيل أكثر (10 أحرف على الأقل)"),
});

const contactSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().optional(),
  message: z.string().min(5, "يرجى كتابة سؤالك أو رسالتك"),
});

type ConsultationForm = z.infer<typeof consultationSchema>;
type ContactForm = z.infer<typeof contactSchema>;

function SuccessCard({ title, desc, onBack }: { title: string; desc: string; onBack: () => void }) {
  return (
    <div className="max-w-md w-full bg-card p-8 rounded-3xl text-center space-y-6 border border-border shadow-lg mx-auto">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground">{desc}</p>
      <div className="flex gap-3">
        <Button asChild className="flex-1">
          <a href="/">الرئيسية</a>
        </Button>
        <Button variant="outline" className="flex-1" onClick={onBack}>
          إرسال آخر
        </Button>
      </div>
    </div>
  );
}

export default function Consultation() {
  const [consultSuccess, setConsultSuccess] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const createConsultation = useCreateConsultation();
  const { toast } = useToast();

  const consultForm = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: { customerName: "", phone: "", crop: "", problem: "" }
  });

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { customerName: "", phone: "", message: "" }
  });

  const onSubmitConsult = (data: ConsultationForm) => {
    createConsultation.mutate({ data }, { onSuccess: () => setConsultSuccess(true) });
  };

  const onSubmitContact = async (data: ContactForm) => {
    setContactLoading(true);
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "خطأ", description: d.error, variant: "destructive" });
        return;
      }
      setContactSuccess(true);
      contactForm.reset();
    } catch {
      toast({ title: "خطأ في الإرسال", description: "يرجى المحاولة لاحقاً", variant: "destructive" });
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground flex items-center justify-center gap-3">
            <Sprout className="w-8 h-8 text-primary" />
            الاستشارة والتواصل
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            هل لديك سؤال أو مشكلة زراعية؟ نحن هنا للمساعدة — اختر ما يناسبك أدناه.
          </p>
        </div>

        <Tabs defaultValue="contact" dir="rtl" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
            <TabsTrigger value="contact" className="gap-2 text-sm font-medium">
              <MessageCircle className="w-4 h-4" />
              سؤال سريع
            </TabsTrigger>
            <TabsTrigger value="consultation" className="gap-2 text-sm font-medium">
              <Sprout className="w-4 h-4" />
              استشارة زراعية مفصّلة
            </TabsTrigger>
          </TabsList>

          {/* ── Quick Contact Tab ── */}
          <TabsContent value="contact">
            {contactSuccess ? (
              <div className="py-8 flex justify-center">
                <SuccessCard
                  title="وصلت رسالتك!"
                  desc="شكراً على تواصلك. سيرد فريقنا على سؤالك في أقرب وقت ممكن."
                  onBack={() => setContactSuccess(false)}
                />
              </div>
            ) : (
              <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">راسلنا مباشرة</h2>
                    <p className="text-sm text-muted-foreground">اكتب سؤالك أو استفسارك وسنرد عليك قريباً</p>
                  </div>
                </div>

                <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="c-name">اسمك الكامل</Label>
                      <Input id="c-name" placeholder="محمد أحمد" {...contactForm.register("customerName")} />
                      {contactForm.formState.errors.customerName && (
                        <p className="text-sm text-destructive">{contactForm.formState.errors.customerName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-phone">رقم الهاتف (اختياري)</Label>
                      <Input id="c-phone" type="tel" dir="ltr" className="text-right" placeholder="0699 000 000" {...contactForm.register("phone")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="c-msg">سؤالك أو رسالتك</Label>
                    <Textarea
                      id="c-msg"
                      rows={5}
                      placeholder="اكتب هنا سؤالك أو ما تودّ الاستفسار عنه..."
                      {...contactForm.register("message")}
                    />
                    {contactForm.formState.errors.message && (
                      <p className="text-sm text-destructive">{contactForm.formState.errors.message.message}</p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full md:w-auto px-10 h-12 gap-2" disabled={contactLoading}>
                    {contactLoading ? "جاري الإرسال..." : (
                      <>
                        <Send className="w-4 h-4" />
                        إرسال الرسالة
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </TabsContent>

          {/* ── Detailed Consultation Tab ── */}
          <TabsContent value="consultation">
            {consultSuccess ? (
              <div className="py-8 flex justify-center">
                <SuccessCard
                  title="تم إرسال طلبك بنجاح"
                  desc="لقد استلمنا طلب الاستشارة الخاص بك. سيقوم فريقنا الزراعي بدراسة مشكلتك والتواصل معك قريباً عبر الهاتف أو الواتساب."
                  onBack={() => setConsultSuccess(false)}
                />
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
                      <Label htmlFor="customerName">الاسم الكامل</Label>
                      <Input id="customerName" {...consultForm.register("customerName")} />
                      {consultForm.formState.errors.customerName && <p className="text-sm text-destructive">{consultForm.formState.errors.customerName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف (واتساب إن أمكن)</Label>
                      <Input id="phone" type="tel" dir="ltr" className="text-right" {...consultForm.register("phone")} />
                      {consultForm.formState.errors.phone && <p className="text-sm text-destructive">{consultForm.formState.errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="crop">المحصول الزراعي</Label>
                      <Input id="crop" placeholder="مثال: طماطم، أشجار حمضيات، نباتات زينة..." {...consultForm.register("crop")} />
                      {consultForm.formState.errors.crop && <p className="text-sm text-destructive">{consultForm.formState.errors.crop.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="soilType">نوع التربة</Label>
                      <Controller
                        control={consultForm.control}
                        name="soilType"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع التربة" />
                            </SelectTrigger>
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
                    <Label htmlFor="problem">وصف المشكلة أو الاستفسار</Label>
                    <Textarea
                      id="problem"
                      rows={5}
                      placeholder="صف لنا حالة نباتاتك أو ما تود الاستفسار عنه بخصوص التسميد..."
                      {...consultForm.register("problem")}
                    />
                    {consultForm.formState.errors.problem && <p className="text-sm text-destructive">{consultForm.formState.errors.problem.message}</p>}
                  </div>

                  <div className="pt-2">
                    <Button type="submit" size="lg" className="w-full md:w-auto px-12 h-14 text-lg" disabled={createConsultation.isPending}>
                      {createConsultation.isPending ? "جاري الإرسال..." : "إرسال الاستشارة"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
