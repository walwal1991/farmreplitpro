import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sprout, Droplets, Sun, Leaf, Trees, FlowerIcon, ShieldCheck, Scale, CalendarDays } from "lucide-react";
import { useLang } from "@/lib/i18n";

const SAFETY_TIPS: Record<string, string[]> = {
  ar: [
    "خزّن السماد في مكان جاف وبارد بعيداً عن أشعة الشمس المباشرة.",
    "أغلق الكيس جيداً بعد الاستعمال للحفاظ على الرطوبة.",
    "السماد آمن تماماً لليدين، لكن يفضّل غسلهما بعد الاستعمال.",
    "لا يحتاج إلى فترة انتظار قبل الحصاد، يمكن تطبيقه حتى أيام قبل القطف.",
  ],
  en: [
    "Store fertilizer in a cool, dry place away from direct sunlight.",
    "Seal the bag tightly after use to preserve moisture.",
    "The fertilizer is completely safe for hands, but wash them after use.",
    "No waiting period before harvest — it can be applied even days before picking.",
  ],
  fr: [
    "Conservez l'engrais dans un endroit frais et sec, à l'abri de la lumière directe du soleil.",
    "Fermez hermétiquement le sac après utilisation pour préserver l'humidité.",
    "L'engrais est totalement sans danger pour les mains, mais lavez-les après utilisation.",
    "Aucun délai d'attente avant la récolte — il peut être appliqué même quelques jours avant la cueillette.",
  ],
};

const SAFETY_TITLE: Record<string, string> = {
  ar: "نصائح للسلامة والتخزين",
  en: "Safety & Storage Tips",
  fr: "Conseils de sécurité et de stockage",
};

const CTA_TITLE: Record<string, string> = {
  ar: "تحتاج إرشاداً مخصصاً لمحصولك؟",
  en: "Need personalized guidance for your crop?",
  fr: "Besoin de conseils personnalisés pour votre culture ?",
};

const CTA_SUB: Record<string, string> = {
  ar: "مهندسونا الزراعيون مستعدون لمساعدتك مجاناً عبر منصة الاستشارة.",
  en: "Our agricultural engineers are ready to help you for free via the consultation platform.",
  fr: "Nos ingénieurs agronomes sont prêts à vous aider gratuitement via la plateforme de consultation.",
};

export default function Guide() {
  const { t, lang } = useLang();

  const STEPS = [
    { n: "1", icon: Scale,        title: t("guide_step1_title"), body: t("guide_step1_body") },
    { n: "2", icon: Sprout,       title: t("guide_step2_title"), body: t("guide_step2_body") },
    { n: "3", icon: Droplets,     title: t("guide_step3_title"), body: t("guide_step3_body") },
    { n: "4", icon: CalendarDays, title: t("guide_step4_title"), body: t("guide_step4_body") },
  ];

  const TEA_STEPS = [t("guide_tea_step1"), t("guide_tea_step2"), t("guide_tea_step3")];

  const CROPS = [
    { icon: Trees,       name: t("guide_crop_fruit"),       dose: t("guide_dose_fruit") },
    { icon: FlowerIcon,  name: t("guide_crop_ornamental"),  dose: t("guide_dose_ornamental") },
    { icon: Leaf,        name: t("guide_crop_leafy"),       dose: t("guide_dose_leafy") },
    { icon: Sun,         name: t("guide_crop_field"),       dose: t("guide_dose_field") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-card border-b border-border/50">
        <div className="container mx-auto px-4 py-16 lg:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sprout className="w-4 h-4" />
            <span>{t("guide_sub")}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">{t("guide_title")}</h1>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="bg-card border border-border/60 rounded-2xl p-6 flex gap-4">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 text-primary flex flex-col items-center justify-center">
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-bold mt-0.5">{s.n}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{s.body}</p>
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
          <h2 className="text-2xl lg:text-3xl font-bold mb-10 text-center">{t("guide_dosage_title")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CROPS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.name} className="bg-background border border-border/60 rounded-2xl p-6 text-center">
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
            <h2 className="text-2xl lg:text-3xl font-bold">{t("guide_tea_title")}</h2>
          </div>
          <ol className="space-y-3">
            {TEA_STEPS.map((s, i) => (
              <li key={i} className="flex gap-3 bg-card border border-border/60 rounded-xl p-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">{i + 1}</span>
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
              <h3 className="text-xl font-bold mb-3">{SAFETY_TITLE[lang]}</h3>
              <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc ps-5">
                {SAFETY_TIPS[lang].map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">{CTA_TITLE[lang]}</h2>
          <p className="text-muted-foreground mb-8">{CTA_SUB[lang]}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/consultation">{t("home_free_consult")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link href="/products">{t("nav_products")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
