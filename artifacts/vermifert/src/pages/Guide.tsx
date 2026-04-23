import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sprout,
  Droplets,
  Sun,
  Leaf,
  Trees,
  FlowerIcon,
  ShieldCheck,
  Scale,
  CalendarDays,
} from "lucide-react";

const STEPS = [
  {
    n: "1",
    icon: Scale,
    title: "حدّد الكمية المناسبة",
    body: "للنباتات المنزلية: ملعقتان كبيرتان لكل أصيص. للخضروات: حفنة (≈ 100 غ) لكل شتلة. للأشجار المثمرة: 2–3 كلغ حول قاعدة الشجرة.",
  },
  {
    n: "2",
    icon: Sprout,
    title: "اخلطه مع التربة",
    body: "اخلط السماد مع التربة السطحية (5–10 سم الأولى) قبل الزراعة، أو ضعه حول النبات بعد الزراعة دون أن يلامس الجذور مباشرة.",
  },
  {
    n: "3",
    icon: Droplets,
    title: "اسقِ بانتظام",
    body: "بعد التطبيق، اسقِ النبات جيداً لتنشيط الميكروبات النافعة. حافظ على رطوبة معتدلة طوال الموسم.",
  },
  {
    n: "4",
    icon: CalendarDays,
    title: "كرّر كل 30–45 يوماً",
    body: "سماد الديدان بطيء الإطلاق وآمن، يمكن إعادة تطبيقه كل شهر إلى شهر ونصف خلال موسم النمو دون خطر الإفراط.",
  },
];

const TEA_STEPS = [
  "خفّف 50 مل من شاي الديدان في 1 لتر ماء.",
  "اسقِ التربة عند الجذور أو رشّ الأوراق في الصباح الباكر أو المساء.",
  "كرّر كل 10–14 يوماً للنباتات الضعيفة أو الشتلات.",
];

const CROPS = [
  { icon: Trees, name: "الأشجار المثمرة", dose: "2–3 كلغ حول الجذع" },
  { icon: FlowerIcon, name: "النباتات الزينة", dose: "ملعقتان لكل أصيص" },
  { icon: Leaf, name: "الخضروات الورقية", dose: "100 غ لكل متر مربع" },
  { icon: Sun, name: "محاصيل حقلية", dose: "500 كلغ لكل هكتار" },
];

export default function Guide() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-card border-b border-border/50">
        <div className="container mx-auto px-4 py-16 lg:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sprout className="w-4 h-4" />
            <span>دليل عملي للفلاح</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">
            كيف تستعمل سماد الديدان؟
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            خطوات بسيطة وعملية للاستفادة القصوى من سماد الديدان وشاي الديدان في
            مزرعتك أو حديقتك المنزلية.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-bold mb-10 text-center">
            أربع خطوات للنجاح
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.n}
                  className="bg-card border border-border/60 rounded-2xl p-6 flex gap-4"
                >
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 text-primary flex flex-col items-center justify-center">
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-bold mt-0.5">{s.n}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Per-crop dosage */}
      <section className="py-16 lg:py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-bold mb-3 text-center">
            الجرعة حسب نوع الزراعة
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-10">
            استرشد بهذا الجدول كنقطة بداية، وعدّل الجرعة حسب جودة تربتك.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CROPS.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.name}
                  className="bg-background border border-border/60 rounded-2xl p-6 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold mb-1">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.dose}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Worm tea */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold">
              استعمال شاي الديدان السائل
            </h2>
          </div>
          <ol className="space-y-3">
            {TEA_STEPS.map((s, i) => (
              <li
                key={i}
                className="flex gap-3 bg-card border border-border/60 rounded-xl p-4"
              >
                <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-foreground/90 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Safety tips */}
      <section className="py-16 lg:py-20 bg-card">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-start gap-4 bg-background border border-border/60 rounded-2xl p-6 lg:p-8">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">نصائح للسلامة والتخزين</h3>
              <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc ps-5">
                <li>خزّن السماد في مكان جاف وبارد بعيداً عن أشعة الشمس المباشرة.</li>
                <li>أغلق الكيس جيداً بعد الاستعمال للحفاظ على الرطوبة.</li>
                <li>السماد آمن تماماً لليدين، لكن يفضّل غسلهما بعد الاستعمال.</li>
                <li>لا يحتاج إلى فترة انتظار قبل الحصاد، يمكن تطبيقه حتى أيام قبل القطف.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            تحتاج إرشاداً مخصصاً لمحصولك؟
          </h2>
          <p className="text-muted-foreground mb-8">
            مهندسونا الزراعيون مستعدون لمساعدتك مجاناً عبر منصة الاستشارة.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/consultation">اطلب استشارة مجانية</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link href="/products">تصفح المنتجات</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
