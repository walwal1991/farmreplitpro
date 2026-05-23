import { Link, useLocation } from "wouter";
import {
  Sprout,
  ShoppingCart,
  User,
  Moon,
  Sun,
  Globe,
  Menu,
  ChevronDown,
  FlaskConical,
  Package,
  Truck,
  LayoutDashboard,
  Search,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState, useRef } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import type { Lang } from "@/lib/translations";

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: "ar", label: "العربية", flag: "🇩🇿" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [dark, setDark] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [langDropOpen, setLangDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const userDropRef = useRef<HTMLDivElement>(null);
  const langDropRef = useRef<HTMLDivElement>(null);
  const { count, open: openCart } = useCart();
  const { lang, setLang, t, dir } = useLang();

  const customerUser = (() => {
    try { return JSON.parse(localStorage.getItem("customerUser") ?? "null"); } catch { return null; }
  })();

  function handleCustomerLogout() {
    const token = localStorage.getItem("customerToken");
    if (token) {
      fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/customer/logout`, {
        method: "POST",
        headers: { "x-customer-token": token },
      });
    }
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");
    setUserDropOpen(false);
    setLocation("/");
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) setUserDropOpen(false);
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node)) setLangDropOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  const currentLang = LANG_OPTIONS.find(l => l.value === lang)!;

  const NAV_LINKS = [
    { href: "/", label: t("nav_home") },
    { href: "/subscriptions", label: lang === "ar" ? "الاشتراك الشهري 📦" : lang === "fr" ? "Abonnement mensuel" : "Monthly Box" },
    { href: "/learn", label: t("nav_learn") },
    { href: "/guide", label: t("nav_guide") },
    { href: "/consultation", label: t("nav_consultation") },
    { href: "/waste-collection", label: "من النفايات إلى السماد" },
    { href: "/bio-waste", label: lang === "ar" ? "بيع مخلفاتك ♻️" : lang === "fr" ? "Vendre vos déchets" : "Sell Bio Waste" },
  ];

  const PRODUCTS_DROPDOWN = [
    { href: "/products", label: t("nav_products"), icon: Package, desc: t("nav_products_desc") },
    { href: "/diagnosis", label: t("nav_diagnosis"), icon: FlaskConical, desc: t("nav_diagnosis_desc") },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Left side icons */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("nav_cart")}
            onClick={openCart}
            className="relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Button>

          {/* User dropdown */}
          <div ref={userDropRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("nav_login")}
              onClick={() => setUserDropOpen((v) => !v)}
              className={userDropOpen ? "bg-muted text-primary" : ""}
            >
              <User className="w-5 h-5" />
            </Button>
            {userDropOpen && (
              <div className={`absolute top-full mt-2 ${dir === "rtl" ? "right-0" : "left-0"} w-64 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50`}>
                {customerUser ? (
                  <>
                    <div className="px-4 py-3 border-b border-border/50 bg-primary/5">
                      <p className="text-xs text-muted-foreground">{t("nav_welcome")}</p>
                      <p className="font-bold text-sm text-primary">{customerUser.name}</p>
                    </div>
                    <Link href="/customer/dashboard" onClick={() => setUserDropOpen(false)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold">{t("nav_my_orders")}</div>
                    </Link>
                    <Link href="/track" onClick={() => setUserDropOpen(false)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Search className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold">{t("nav_track_order")}</div>
                    </Link>
                    <div className="border-t border-border/50 mx-3" />
                    <button onClick={handleCustomerLogout} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-destructive">
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold">{t("nav_logout")}</div>
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/customer/login" onClick={() => setUserDropOpen(false)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{t("nav_customer_account")}</div>
                        <div className="text-xs text-muted-foreground">{t("nav_customer_account_desc")}</div>
                      </div>
                    </Link>
                    <Link href="/track" onClick={() => setUserDropOpen(false)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Search className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-semibold">{t("nav_track_order")}</div>
                    </Link>
                  </>
                )}
                <div className="border-t border-border/50 mx-3" />
                <Link href="/admin/login" onClick={() => setUserDropOpen(false)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div className="text-sm text-muted-foreground">{t("nav_admin_portal")}</div>
                </Link>
                <Link href="/delivery/login" onClick={() => setUserDropOpen(false)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="text-sm text-muted-foreground">{t("nav_delivery_portal")}</div>
                </Link>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label={t("nav_dark_mode")}
            onClick={() => setDark((d) => !d)}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Language switcher */}
          <div ref={langDropRef} className="relative">
            <button
              onClick={() => setLangDropOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>{currentLang.flag}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${langDropOpen ? "rotate-180" : ""}`} />
            </button>
            {langDropOpen && (
              <div className={`absolute top-full mt-2 ${dir === "rtl" ? "right-0" : "left-0"} w-40 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50`}>
                {LANG_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setLang(option.value); setLangDropOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${lang === option.value ? "bg-primary/5 text-primary font-semibold" : "text-foreground"}`}
                  >
                    <span className="text-base">{option.flag}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-7 text-[15px] font-medium">
          {/* Home link first */}
          {(() => {
            const home = NAV_LINKS[0];
            const active = location === home.href;
            return (
              <Link
                key={home.href}
                href={home.href}
                className={active ? "text-primary border-b-2 border-primary pb-1" : "text-foreground/80 hover:text-primary transition-colors"}
              >
                {home.label}
              </Link>
            );
          })()}

          {/* Products dropdown — position 2 */}
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setDropOpen((v) => !v)}
              className={`flex items-center gap-1 transition-colors ${
                location === "/products" || location === "/diagnosis"
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-foreground/80 hover:text-primary"
              }`}
            >
              {t("nav_products")}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`} />
            </button>
            {dropOpen && (
              <div className={`absolute top-full mt-3 ${dir === "rtl" ? "right-0" : "left-0"} w-72 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50`}>
                {PRODUCTS_DROPDOWN.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDropOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors ${location === item.href ? "bg-primary/5 text-primary" : ""}`}
                    >
                      <Icon className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                      <div>
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remaining nav links (skip Home which is already rendered) */}
          {NAV_LINKS.slice(1).map((l) => {
            const active = location === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={active ? "text-primary border-b-2 border-primary pb-1" : "text-foreground/80 hover:text-primary transition-colors"}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className={`leading-tight ${dir === "rtl" ? "text-right" : "text-left"}`}>
            <div className={`flex items-baseline gap-1 ${dir === "rtl" ? "justify-end" : "justify-start"}`}>
              <span className="text-xl font-extrabold text-primary">VermiGold</span>
            </div>
            <div className="text-[11px] text-muted-foreground whitespace-nowrap">
              {lang === "ar" ? "نحو تربة أفضل... وبيئة أنظف" : lang === "fr" ? "Vers une meilleure terre" : "Towards Better Soil"}
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
        </Link>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={t("nav_cart")} onClick={openCart} className="relative">
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === "rtl" ? "right" : "left"} className="flex flex-col gap-3 pt-12">
              {PRODUCTS_DROPDOWN.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 text-base font-medium py-2 border-b border-border/50"
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    {item.label}
                  </Link>
                );
              })}
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-lg font-medium py-2 border-b border-border/50"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              {/* Mobile language switcher */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">{t("nav_lang")}</p>
                <div className="flex gap-2">
                  {LANG_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setLang(option.value); setOpen(false); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${lang === option.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border hover:bg-muted/80"}`}
                    >
                      {option.flag} {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button asChild variant="default" className="w-full mt-2 gap-2">
                <Link href="/products" onClick={() => setOpen(false)}>
                  <ShoppingCart className="w-4 h-4" />
                  {t("nav_order_now")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href="/admin/login" onClick={() => setOpen(false)}>
                  <User className="w-4 h-4" />
                  {t("nav_admin_login")}
                </Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
