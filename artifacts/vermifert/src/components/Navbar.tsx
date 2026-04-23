import { Link } from "wouter";
import { Leaf, Sprout, ShoppingCart, MessageSquare, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/" className="text-foreground hover:text-primary font-medium transition-colors" onClick={() => setOpen(false)}>الرئيسية</Link>
      <Link href="/products" className="text-foreground hover:text-primary font-medium transition-colors" onClick={() => setOpen(false)}>المنتجات</Link>
      <Link href="/consultation" className="text-foreground hover:text-primary font-medium transition-colors" onClick={() => setOpen(false)}>استشارة زراعية</Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Sprout className="w-6 h-6" />
            <span>متجر سماد الديدان</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <NavLinks />
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button asChild variant="default" className="gap-2">
            <Link href="/products">
              <ShoppingCart className="w-4 h-4" />
              اطلب الآن
            </Link>
          </Button>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-4 pt-12">
              <NavLinks />
              <Button asChild variant="default" className="w-full mt-4 gap-2">
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
