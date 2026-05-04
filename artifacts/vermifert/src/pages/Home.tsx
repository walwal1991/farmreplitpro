import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, Sprout, ShieldCheck, HeartHandshake, ShoppingBag, LayoutDashboard, Truck, User, Search, ArrowLeft } from "lucide-react";
import { useListProducts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";
import heroField from "@assets/generated_images/hero-green-field.png";

export default function Home() {
  const { data: products, isLoading } = useListProducts();
  const featuredProducts = products?.slice(0, 4) || [];
  const { add } = useCart();
  const { t, lang } = useLang();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroField})` }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" aria-hidden="true" />

        <div className="relative z-10 container mx-auto px-4 py-24 lg:py-36 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/30 backdrop-blur text-white text-sm font-medium mb-10">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            <span>{t("home_badge")}</span>
          </div>

          <h1 className="font-extrabold leading-[1.05] text-5xl sm:text-6xl lg:text-8xl tracking-tight">
            <span className="block bg-gradient-to-l from-amber-300 via-yellow-200 to-lime-200 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
              {t("home_hero_line1")}
            </span>
            <span className="block mt-2 bg-gradient-to-l from-lime-200 via-emerald-300 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
              {t("home_hero_line2")}
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base sm:text-lg text-white/90 leading-loose">
            {t("home_hero_p")}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Button asChild size="lg" className="text-base px-8 h-12 shadow-lg">
              <Link href="/products">{t("home_order_now")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 h-12 bg-white/10 hover:bg-white/20 text-white border-white/40 backdrop-blur">
              <Link href="/consultation">{t("home_free_consult")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">{t("home_why_title")}</h2>
            <p className="text-muted-foreground text-lg">{t("home_why_sub")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-2xl text-center space-y-4 border border-border/50">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">{t("home_feat1_title")}</h3>
              <p className="text-muted-foreground">{t("home_feat1_body")}</p>
            </div>
            <div className="bg-background p-8 rounded-2xl text-center space-y-4 border border-border/50">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">{t("home_feat2_title")}</h3>
              <p className="text-muted-foreground">{t("home_feat2_body")}</p>
            </div>
            <div className="bg-background p-8 rounded-2xl text-center space-y-4 border border-border/50">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">{t("home_feat3_title")}</h3>
              <p className="text-muted-foreground">{t("home_feat3_body")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">{t("home_featured_title")}</h2>
              <p className="text-muted-foreground text-lg">{t("home_featured_sub")}</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:flex text-primary hover:text-primary/80">
              <Link href="/products">{t("home_view_all")}</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-square rounded-xl w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-border/60 hover:border-primary transition-colors flex flex-col">
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      <img src={product.imageUrl || vermicompostBag} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  </Link>
                  <CardContent className="p-3 flex-1 flex flex-col gap-2">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-primary tabular-nums">{product.price} د.ج</span>
                      <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{product.weightKg} {product.unit}</span>
                    </div>
                    <Button size="sm" className="w-full gap-1.5 mt-auto" onClick={() => add({ id: product.id, name: product.name, price: product.price, unit: product.unit, weightKg: product.weightKg, imageUrl: product.imageUrl })}>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {t("home_add_to_cart")}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-2xl">
                {t("home_no_products")}
              </div>
            )}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline" className="w-full">
              <Link href="/products">{t("home_view_all")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-16 bg-muted/40 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">
              {lang === "fr" ? "Accès aux portails" : lang === "en" ? "Portal Access" : "بوابات الدخول"}
            </h2>
            <p className="text-muted-foreground">
              {lang === "fr" ? "Choisissez votre espace" : lang === "en" ? "Choose your portal" : "اختر بوابتك للدخول"}
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {/* Customer */}
            <Link href="/customer/login" className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-background border border-border hover:border-primary hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <User className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-sm">حساب الزبون</div>
                <div className="text-xs text-muted-foreground mt-0.5">طلباتي • كوبوناتي</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-auto" />
            </Link>

            {/* Track Order */}
            <Link href="/track" className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-background border border-border hover:border-primary hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Search className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-sm">تتبع الطلب</div>
                <div className="text-xs text-muted-foreground mt-0.5">أدخل رقم التتبع</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors mt-auto" />
            </Link>

            {/* Admin */}
            <Link href="/admin" className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-background border border-border hover:border-amber-500 hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-sm">لوحة الإدارة</div>
                <div className="text-xs text-muted-foreground mt-0.5">المنتجات • الطلبات</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors mt-auto" />
            </Link>

            {/* Driver */}
            <Link href="/delivery/login" className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-background border border-border hover:border-orange-500 hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-sm">بوابة السائق</div>
                <div className="text-xs text-muted-foreground mt-0.5">الطلبات المعيّنة لي</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors mt-auto" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                <Sprout className="w-6 h-6" />
                <span>Vermifert</span>
              </Link>
              <p className="text-muted-foreground">{t("home_footer_desc")}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t("home_footer_links")}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/" className="hover:text-primary">{t("nav_home")}</Link></li>
                <li><Link href="/products" className="hover:text-primary">{t("nav_products")}</Link></li>
                <li><Link href="/consultation" className="hover:text-primary">{t("home_footer_consult")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t("home_footer_contact")}</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>info@vermifert.com</li>
                <li>+213 12 34 56 78</li>
                <li>{t("home_footer_country")}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Vermifert. {t("home_footer_rights")}.
          </div>
        </div>
      </footer>
    </div>
  );
}
