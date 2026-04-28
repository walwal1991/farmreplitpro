import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import { useState } from "react";
import {
  MapPin, Box, Layers, Worm, Salad, HeartPulse, Package,
  Lightbulb, GraduationCap, Clock, Users, Monitor, MapPinned,
  CheckCircle, ArrowLeft, ArrowRight, MessageCircle, User, Phone,
  CheckCircle2,
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const STEP_ICONS = [MapPin, Box, Layers, Worm, Salad, HeartPulse, Package];

type EnrollState =
  | { phase: "idle" }
  | { phase: "form" }
  | { phase: "submitting" }
  | { phase: "success" }
  | { phase: "error"; msg: string };

type CourseCardData = {
  id: string;
  titleKey: string;
  levelKey: string;
  durationKey: string;
  modeKey: string;
  priceKey: string;
  descKey: string;
  isFree: boolean;
  isOnline: boolean;
  color: string;
};

export default function Learn() {
  const { t, dir } = useLang();

  const [enrollName, setEnrollName] = useState("");
  const [enrollPhone, setEnrollPhone] = useState("");
  const [enrollState, setEnrollState] = useState<EnrollState>({ phase: "idle" });
  const [activeEnrollCourse, setActiveEnrollCourse] = useState<string | null>(null);

  const steps = [1, 2, 3, 4, 5, 6, 7] as const;

  const courses: CourseCardData[] = [
    {
      id: "beginner",
      titleKey: "course1_title",
      levelKey: "course1_level",
      durationKey: "course1_duration",
      modeKey: "course1_mode",
      priceKey: "course1_price",
      descKey: "course1_desc",
      isFree: true,
      isOnline: true,
      color: "from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800",
    },
    {
      id: "intermediate",
      titleKey: "course2_title",
      levelKey: "course2_level",
      durationKey: "course2_duration",
      modeKey: "course2_mode",
      priceKey: "course2_price",
      descKey: "course2_desc",
      isFree: false,
      isOnline: false,
      color: "from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800",
    },
    {
      id: "workshop",
      titleKey: "course3_title",
      levelKey: "course3_level",
      durationKey: "course3_duration",
      modeKey: "course3_mode",
      priceKey: "course3_price",
      descKey: "course3_desc",
      isFree: false,
      isOnline: false,
      color: "from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800",
    },
    {
      id: "professional",
      titleKey: "course4_title",
      levelKey: "course4_level",
      durationKey: "course4_duration",
      modeKey: "course4_mode",
      priceKey: "course4_price",
      descKey: "course4_desc",
      isFree: false,
      isOnline: false,
      color: "from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800",
    },
  ];

  const handleOpenEnroll = (courseId: string) => {
    setActiveEnrollCourse(courseId);
    setEnrollName("");
    setEnrollPhone("");
    setEnrollState({ phase: "form" });
  };

  const handleCancelEnroll = () => {
    setActiveEnrollCourse(null);
    setEnrollState({ phase: "idle" });
  };

  const handleSubmitEnroll = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    if (!enrollName.trim() || !enrollPhone.trim()) return;
    setEnrollState({ phase: "submitting" });
    try {
      const res = await fetch(`${API}/api/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: enrollName.trim(),
          phone: enrollPhone.trim(),
          courseId,
        }),
      });
      if (!res.ok) throw new Error("server error");
      setEnrollState({ phase: "success" });
    } catch {
      setEnrollState({ phase: "error", msg: t("enroll_error") });
    }
  };

  const BackArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-emerald-50/30 dark:to-emerald-950/20 border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <GraduationCap className="w-4 h-4" />
            {t("nav_learn")}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight text-foreground">
            {t("learn_page_title")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("learn_page_sub")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <a
              href="#farm"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Worm className="w-4 h-4" />
              {t("farm_section_title")}
            </a>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              {t("course_section_title")}
            </a>
          </div>
        </div>
        <div className="absolute -top-20 -start-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -end-20 w-72 h-72 rounded-full bg-emerald-400/5 blur-3xl pointer-events-none" />
      </section>

      {/* ── Farm Steps ── */}
      <section id="farm" className="container mx-auto px-4 py-16 max-w-4xl scroll-mt-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
            {t("farm_section_title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("farm_section_sub")}
          </p>
        </div>

        <div className="relative">
          <div
            className={`absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent hidden md:block ${dir === "rtl" ? "right-[2.15rem]" : "left-[2.15rem]"}`}
          />
          <div className="space-y-8">
            {steps.map((n) => {
              const Icon = STEP_ICONS[n - 1];
              const numKey = `farm_step${n}_num` as Parameters<typeof t>[0];
              const titleKey = `farm_step${n}_title` as Parameters<typeof t>[0];
              const descKey = `farm_step${n}_desc` as Parameters<typeof t>[0];
              return (
                <div key={n} className="flex gap-5 md:gap-6 group">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-[4.3rem] h-[4.3rem] rounded-full bg-primary/10 border-2 border-primary/30 group-hover:bg-primary/20 group-hover:border-primary/60 transition-all flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm group-hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                        {t(numKey)}
                      </span>
                      <h3 className="font-bold text-base md:text-lg text-foreground">
                        {t(titleKey)}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      {t(descKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Golden tip */}
        <div className="mt-10 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">{t("farm_tip_title")}</p>
            <p className="text-amber-700 dark:text-amber-400 text-sm leading-relaxed">{t("farm_tip_desc")}</p>
          </div>
        </div>
      </section>

      {/* ── Courses ── */}
      <section id="courses" className="bg-muted/30 border-y border-border scroll-mt-24">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
              {t("course_section_title")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("course_section_sub")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course) => {
              const isActive = activeEnrollCourse === course.id;
              const showForm = isActive && (enrollState.phase === "form" || enrollState.phase === "submitting" || enrollState.phase === "error");
              const showSuccess = isActive && enrollState.phase === "success";

              return (
                <div
                  key={course.id}
                  className={`bg-gradient-to-br ${course.color} bg-card border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow`}
                >
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${course.isFree ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                      <CheckCircle className="w-3 h-3" />
                      {t(course.priceKey as Parameters<typeof t>[0])}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      {course.isOnline ? <Monitor className="w-3 h-3" /> : <MapPinned className="w-3 h-3" />}
                      {t(course.modeKey as Parameters<typeof t>[0])}
                    </span>
                  </div>

                  {/* Title + desc */}
                  <div>
                    <h3 className="font-bold text-lg text-foreground leading-snug mb-2">
                      {t(course.titleKey as Parameters<typeof t>[0])}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(course.descKey as Parameters<typeof t>[0])}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{t("course_duration")}: <strong className="text-foreground">{t(course.durationKey as Parameters<typeof t>[0])}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{t("course_level")}: <strong className="text-foreground">{t(course.levelKey as Parameters<typeof t>[0])}</strong></span>
                    </div>
                  </div>

                  {/* ── CTA / Enrollment ── */}
                  <div className="mt-auto">

                    {/* SUCCESS state */}
                    {showSuccess ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 flex gap-3 items-start">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{t("enroll_success_title")}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 leading-relaxed">{t("enroll_success_desc")}</p>
                        </div>
                      </div>
                    ) : showForm ? (
                      /* FORM state */
                      <form
                        onSubmit={(e) => handleSubmitEnroll(e, course.id)}
                        className="bg-background/80 border border-border rounded-xl p-4 space-y-3"
                      >
                        <p className="text-sm font-semibold text-foreground">{t("enroll_title")}</p>

                        {/* Name */}
                        <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2">
                          <User className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input
                            type="text"
                            value={enrollName}
                            onChange={(e) => setEnrollName(e.target.value)}
                            placeholder={t("enroll_name")}
                            required
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                          />
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2">
                          <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input
                            type="tel"
                            dir="ltr"
                            value={enrollPhone}
                            onChange={(e) => setEnrollPhone(e.target.value)}
                            placeholder={t("enroll_phone")}
                            required
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-start"
                          />
                        </div>

                        {/* Error */}
                        {enrollState.phase === "error" && (
                          <p className="text-xs text-destructive">{enrollState.msg}</p>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={enrollState.phase === "submitting"}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                          >
                            {enrollState.phase === "submitting" ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {t("enroll_submitting")}
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t("enroll_submit")}
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEnroll}
                            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            {t("enroll_cancel")}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* DEFAULT CTA */
                      course.isFree ? (
                        <button
                          onClick={() => handleOpenEnroll(course.id)}
                          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 px-4 text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <GraduationCap className="w-4 h-4" />
                          {t("course_enroll")}
                        </button>
                      ) : (
                        <Link href="/consultation">
                          <button className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-2.5 px-4 text-sm font-semibold hover:bg-muted transition-colors">
                            <MessageCircle className="w-4 h-4 text-primary" />
                            {t("course_contact")}
                          </button>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="bg-gradient-to-br from-primary/5 to-emerald-50/30 dark:to-emerald-950/10 border border-primary/20 rounded-3xl p-10">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <MessageCircle className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">{t("learn_cta_title")}</h2>
          <p className="text-muted-foreground mb-7 leading-relaxed">{t("learn_cta_sub")}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="gap-2 px-7">
              <Link href="/consultation">
                <MessageCircle className="w-4 h-4" />
                {t("learn_cta_btn")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 px-7">
              <Link href="/products">
                <BackArrow className="w-4 h-4" />
                {t("learn_cta_products")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
