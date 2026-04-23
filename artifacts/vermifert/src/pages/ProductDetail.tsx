import Navbar from "@/components/Navbar";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowRight, CheckCircle2 } from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id, 10);
  
  const { data: product, isLoading, isError } = useGetProduct(productId, { 
    query: { 
      enabled: !!productId, 
      queryKey: getGetProductQueryKey(productId) 
    } 
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة للمنتجات
        </Link>

        {isLoading ? (
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : isError || !product ? (
          <div className="text-center py-20 bg-card rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">المنتج غير موجود</h2>
            <Button asChild variant="outline">
              <Link href="/products">تصفح المنتجات</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden border border-border/50">
              <img 
                src={product.imageUrl || vermicompostBag} 
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>
            
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-primary">{product.price} د.ج</span>
                  <span className="text-lg text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                    الوزن: {product.weightKg} {product.unit}
                  </span>
                </div>
              </div>

              <div className="prose prose-stone rtl:prose-p:text-right max-w-none text-muted-foreground">
                <p>{product.description}</p>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
                <h3 className="font-bold text-lg">مميزات المنتج:</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>عضوي وطبيعي 100%</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>غني بالعناصر الغذائية الأساسية</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>يحسن خصوبة التربة واحتفاظها بالماء</span>
                  </li>
                </ul>
              </div>

              <Button asChild size="lg" className="w-full h-14 text-lg gap-2">
                <Link href={`/order/${product.id}`}>
                  <ShoppingCart className="w-5 h-5" />
                  اطلب الآن - الدفع عند الاستلام
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
