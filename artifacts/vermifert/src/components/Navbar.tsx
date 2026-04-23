import { Link, useLocation } from "wouter";
import {
  Sprout,
  ShoppingCart,
  User,
  Moon,
  Sun,
  Globe,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المنتجات" },
  { href: "/guide", label: "دليل الاستعمال" },
  { href: "/consultation", label: "الاستشارة" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const [dark, setDark] = useState(false);
  const { count, open: openCart } = useCart();

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Left side icons (LTR position; on RTL these appear on the visual left) */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="السلة"
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
          <Button variant="ghost" size="icon" aria-label="الحساب">
            <User className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="الوضع الليلي"
            onClick={() => setDark((d) => !d)}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <span className="ms-1 inline-flex items-center justify-center text-[11px] font-bold tracking-wide text-primary border border-primary/40 rounded-md px-1.5 py-0.5">
            DZ
          </span>
          <Button variant="ghost" size="icon" aria-label="اللغة">
            <Globe className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">العربية</span>
        </div>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-7 text-[15px] font-medium">
          {NAV_LINKS.map((l) => {
            const active = location === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-foreground/80 hover:text-primary transition-colors"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Brand on the right (visual right in RTL) */}
        <Link href="/" className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-2xl font-extrabold text-primary">
                متجر سماد
              </span>
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                الديدان
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              نحو تربة أفضل... وبيئة أنظف
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary">
            <Sprout className="w-6 h-6" />
          </div>
        </Link>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="السلة"
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
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-3 pt-12">
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
              <Button
                asChild
                variant="default"
                className="w-full mt-4 gap-2"
              >
                <Link href="/products" onClick={() => setOpen(false)}>
                  <ShoppingCart className="w-4 h-4" />
                  اطلب الآن
                </Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
