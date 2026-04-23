import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, Sprout, ShieldCheck, HeartHandshake } from "lucide-react";
import { useListProducts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";

export default function Home() {
  const { data: products, isLoading } = useListProducts();
  const featuredProducts = products?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-background">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-right space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sprout className="w-4 h-4" />
              <span>من المزرعة إلى أرضك</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-foreground">
              سماد طبيعي حيوي، <br/>
              <span className="text-primary">يحيي تربتك</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              سماد ديدان عالي الجودة لجميع أنواع المزروعات. غني بالعناصر الغذائية والميكروبات النافعة لزيادة إنتاجيتك وتحسين جودة محاصيلك بطريقة طبيعية ومستدامة.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8 h-14">
                <Link href="/products">اطلب الآن</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14">
                <Link href="/consultation">اطلب استشارة مجانية</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative bg-muted">
              <img 
                src={vermicompostBag} 
                alt="سماد الديدان" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">لماذا تختار سمادنا؟</h2>
            <p className="text-muted-foreground text-lg">نحن نؤمن بأن الزراعة الناجحة تبدأ من التربة الصحية.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-2xl text-center space-y-4 border border-border/50">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">طبيعي 100%</h3>
              <p className="text-muted-foreground">خالٍ تماماً من المواد الكيميائية الضارة، آمن للبيئة والحيوانات الأليفة والنباتات المنزلية.</p>
            </div>
            <div className="bg-background p-8 rounded-2xl text-center space-y-4 border border-border/50">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">جودة مضمونة</h3>
              <p className="text-muted-foreground">يتم إنتاجه بعناية فائقة في مزارعنا وتغذيته بأفضل المخلفات العضوية لضمان أعلى نسب العناصر.</p>
            </div>
            <div className="bg-background p-8 rounded-2xl text-center space-y-4 border border-border/50">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">دعم مستمر</h3>
              <p className="text-muted-foreground">نقدم لك استشارات زراعية مجانية لمساعدتك في الحصول على أفضل النتائج لمحاصيلك.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">أبرز المنتجات</h2>
              <p className="text-muted-foreground text-lg">اختر ما يناسب مزرعتك من مجموعة منتجاتنا العضوية.</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:flex text-primary hover:text-primary/80">
              <Link href="/products">عرض كل المنتجات</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="aspect-square rounded-2xl w-full" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="group hover:border-primary transition-colors cursor-pointer overflow-hidden border-border/50">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      <img 
                        src={product.imageUrl || vermicompostBag} 
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-primary">{product.price} د.ج</span>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">{product.weightKg} كغ</span>
                      </div>
                      <Button className="w-full">تفاصيل المنتج</Button>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-2xl">
                لا توجد منتجات متاحة حالياً
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline" className="w-full">
              <Link href="/products">عرض كل المنتجات</Link>
            </Button>
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
                <span>متجر سماد الديدان</span>
              </Link>
              <p className="text-muted-foreground">
                نوفر لك أفضل أنواع السماد العضوي الحيوي لتحسين تربتك وزيادة إنتاجيتك.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/" className="hover:text-primary">الرئيسية</Link></li>
                <li><Link href="/products" className="hover:text-primary">المنتجات</Link></li>
                <li><Link href="/consultation" className="hover:text-primary">استشارة زراعية</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">تواصل معنا</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>info@vermifert.com</li>
                <li>+213 12 34 56 78</li>
                <li>الجزائر</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} متجر سماد الديدان. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
