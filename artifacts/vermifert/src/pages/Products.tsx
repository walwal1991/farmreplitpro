import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListProducts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Search, Filter, Star } from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { useMemo, useState, useEffect } from "react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface RatingStat { product_id: number; count: number; avg: number; }

function MiniStars({ avg, count }: { avg: number; count: number }) {
  const full = Math.round(avg);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} className={`w-3 h-3 ${s <= full ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/20"}`} />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">({count})</span>
    </div>
  );
}

export default function Products() {
  const { data: products, isLoading } = useListProducts();
  const { add } = useCart();
  const { t } = useLang();

  const CATEGORIES = [
    { value: "all", label: t("cat_all") },
    { value: "solid", label: t("cat_solid") },
    { value: "liquid", label: t("cat_liquid") },
    { value: "worms", label: t("cat_worms") },
    { value: "equipment", label: t("cat_equipment") },
  ];

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [ratings, setRatings] = useState<Map<number, RatingStat>>(new Map());

  useEffect(() => {
    fetch(`${API}/api/products/ratings`)
      .then(r => r.json())
      .then((rows: RatingStat[]) => {
        const map = new Map<number, RatingStat>();
        rows.forEach(r => map.set(r.product_id, r));
        setRatings(map);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && (p.category ?? "solid") !== category) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, category]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("products_title")}</h1>
          <p className="text-lg text-muted-foreground">{t("products_sub")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Filter sidebar */}
          <aside className="lg:sticky lg:top-24 self-start">
            <Card className="border-border/60">
              <CardContent className="p-5 space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <Filter className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">{t("products_filter")}</h2>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t("products_search")}</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("products_search_ph")}
                      className="pr-9"
                      data-testid="input-product-search"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground block">{t("products_type")}</label>
                  <div className="space-y-2">
                    {CATEGORIES.map((c) => {
                      const checked = category === c.value;
                      return (
                        <label key={c.value} className="flex items-center justify-between gap-3 cursor-pointer group" data-testid={`filter-category-${c.value}`}>
                          <span className={`text-sm ${checked ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground"}`}>{c.label}</span>
                          <span className="relative inline-flex items-center justify-center">
                            <input type="radio" name="category" value={c.value} checked={checked} onChange={() => setCategory(c.value)} className="sr-only" />
                            <span className={`w-4 h-4 rounded-full border-2 transition-colors ${checked ? "border-primary" : "border-muted-foreground/40 group-hover:border-muted-foreground"}`} />
                            {checked && <span className="absolute w-2 h-2 rounded-full bg-primary" />}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {(search || category !== "all") && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSearch(""); setCategory("all"); }} data-testid="button-clear-filters">
                    {t("products_reset")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Products grid */}
          <div>
            {!isLoading && products && (
              <p className="text-sm text-muted-foreground mb-4">{filtered.length} {t("products_count")}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-square rounded-xl w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))
              ) : filtered.length ? (
                filtered.map((product) => {
                  const stat = ratings.get(product.id);
                  return (
                    <Card key={product.id} className="group overflow-hidden border-border/60 hover:border-primary transition-colors flex flex-col">
                      <Link href={`/products/${product.id}`} className="block">
                        <div className="aspect-square bg-muted relative overflow-hidden">
                          <img src={product.imageUrl || vermicompostBag} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      </Link>
                      <CardContent className="p-3 flex flex-col gap-2 flex-1">
                        <Link href={`/products/${product.id}`}>
                          <h3 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                        </Link>
                        {stat && stat.count > 0 ? (
                          <MiniStars avg={stat.avg} count={stat.count} />
                        ) : (
                          <div className="flex items-center gap-0.5 opacity-30">
                            {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-muted text-muted-foreground" />)}
                            <span className="text-[10px] text-muted-foreground mr-1">{t("products_no_rating")}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-base font-extrabold text-primary tabular-nums">{product.price} د.ج</span>
                          <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{product.weightKg} {product.unit}</span>
                        </div>
                        <Button size="sm" className="w-full gap-1.5 mt-auto" onClick={() => add({ id: product.id, name: product.name, price: product.price, unit: product.unit, weightKg: product.weightKg, imageUrl: product.imageUrl })}>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {t("products_add_cart")}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-20 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
                  <p className="text-lg">{t("products_no_match")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
