import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateConsultation } from "@workspace/api-client-react";
import { CheckCircle2, Sprout } from "lucide-react";
import { useState } from "react";
import { ConsultationInputSoilType } from "@workspace/api-client-react";

const consultationSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  soilType: z.nativeEnum(ConsultationInputSoilType, { required_error: "نوع التربة مطلوب" }),
  crop: z.string().min(2, "نوع المحصول مطلوب"),
  problem: z.string().min(10, "يرجى وصف المشكلة بتفصيل أكثر (10 أحرف على الأقل)"),
});

type ConsultationForm = z.infer<typeof consultationSchema>;

export default function Consultation() {
  const [success, setSuccess] = useState(false);
  const createConsultation = useCreateConsultation();

  const form = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      crop: "",
      problem: "",
    }
  });

  const onSubmit = (data: ConsultationForm) => {
    createConsultation.mutate({ data }, {
      onSuccess: () => setSuccess(true)
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="max-w-md w-full bg-card p-8 rounded-3xl text-center space-y-6 border border-border shadow-lg">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold">تم إرسال طلبك بنجاح</h2>
            <p className="text-muted-foreground">
              لقد استلمنا طلب الاستشارة الخاص بك. سيقوم فريقنا الزراعي بدراسة مشكلتك والتواصل معك قريباً عبر الهاتف أو الواتساب.
            </p>
            <Button asChild className="w-full">
              <a href="/">العودة للرئيسية</a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground flex items-center justify-center gap-3">
            <Sprout className="w-8 h-8 text-primary" />
            استشارة زراعية مجانية
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            خبراؤنا هنا لمساعدتك في الحصول على أفضل النتائج. املأ النموذج أدناه وسنقدم لك التوجيه المناسب لمحاصيلك.
          </p>
        </div>

        <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-sm">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customerName">الاسم الكامل</Label>
                <Input id="customerName" {...form.register("customerName")} />
                {form.formState.errors.customerName && <p className="text-sm text-destructive">{form.formState.errors.customerName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف (واتساب إن أمكن)</Label>
                <Input id="phone" type="tel" dir="ltr" className="text-right" {...form.register("phone")} />
                {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="crop">المحصول الزراعي</Label>
                <Input id="crop" placeholder="مثال: طماطم، أشجار حمضيات، نباتات زينة..." {...form.register("crop")} />
                {form.formState.errors.crop && <p className="text-sm text-destructive">{form.formState.errors.crop.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="soilType">نوع التربة</Label>
                <Controller
                  control={form.control}
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
                {form.formState.errors.soilType && <p className="text-sm text-destructive">{form.formState.errors.soilType.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem">وصف المشكلة أو الاستفسار</Label>
              <Textarea 
                id="problem" 
                rows={5} 
                placeholder="صف لنا حالة نباتاتك أو ما تود الاستفسار عنه بخصوص التسميد..." 
                {...form.register("problem")} 
              />
              {form.formState.errors.problem && <p className="text-sm text-destructive">{form.formState.errors.problem.message}</p>}
            </div>

            <div className="pt-4">
              <Button type="submit" size="lg" className="w-full md:w-auto px-12 h-14 text-lg" disabled={createConsultation.isPending}>
                {createConsultation.isPending ? "جاري الإرسال..." : "إرسال الاستشارة"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
