import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListProducts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";

export default function Products() {
  const { data: products, isLoading } = useListProducts();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">منتجاتنا العضوية</h1>
          <p className="text-lg text-muted-foreground">
            تشكيلة متنوعة من أسمدة الديدان ومستخلصاتها لتلبية جميع احتياجات مزرعتك أو حديقتك.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-square rounded-2xl w-full" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          ) : products?.length ? (
            products.map((product) => (
              <Card key={product.id} className="group overflow-hidden border-border/50 hover:border-primary transition-colors flex flex-col">
                <Link href={`/products/${product.id}`} className="block flex-1">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img 
                      src={product.imageUrl || vermicompostBag} 
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between mb-4 mt-auto">
                      <span className="text-lg font-bold text-primary">{product.price} د.ج</span>
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">{product.weightKg} {product.unit}</span>
                    </div>
                  </CardContent>
                </Link>
                <div className="px-6 pb-6 mt-auto">
                  <Button asChild className="w-full gap-2">
                    <Link href={`/order/${product.id}`}>
                      <ShoppingCart className="w-4 h-4" />
                      اطلب الآن
                    </Link>
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
              <p className="text-lg">لا توجد منتجات متاحة حالياً.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
