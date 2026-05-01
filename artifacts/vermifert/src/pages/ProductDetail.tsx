import Navbar from "@/components/Navbar";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ShoppingBag, ArrowRight, CheckCircle2, Star, MessageSquare, Send, ImagePlus, X, Gift, Copy } from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";
import { useCart } from "@/lib/cart";
import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";
import { format } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  imageUrl: string | null;
  createdAt: string;
}

interface ReviewStats {
  count: number;
  avg: number;
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star className={`w-7 h-7 transition-colors ${s <= (hover || value) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id, 10);
  const { add } = useCart();
  const { toast } = useToast();
  const { t, lang } = useLang();

  const dateLocale = lang === "ar" ? ar : lang === "fr" ? fr : enUS;

  const { data: product, isLoading, isError } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) },
  });

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ count: 0, avg: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const customerToken = localStorage.getItem("customerToken") ?? "";
  const customerUser = (() => {
    try { return JSON.parse(localStorage.getItem("customerUser") ?? "null"); } catch { return null; }
  })();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rewardCode, setRewardCode] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const RATING_LABELS: Record<string, string[]> = {
    ar: ["", "ضعيف جداً", "ضعيف", "مقبول", "جيد", "ممتاز"],
    en: ["", "Very poor", "Poor", "Fair", "Good", "Excellent"],
    fr: ["", "Très mauvais", "Mauvais", "Correct", "Bien", "Excellent"],
  };

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API}/api/products/${productId}/reviews`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setStats(data.stats ?? { count: 0, avg: 0 });
    } finally { setReviewsLoading(false); }
  }, [productId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("review_img_too_large"), description: t("review_img_limit"), variant: "destructive" });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setImageBase64(b64);
      setImagePreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: t("review_choose_rating"), variant: "destructive" });
      return;
    }
    const name = customerUser?.name ?? guestName.trim();
    if (!name || name.length < 2) {
      toast({ title: t("review_name_required"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customerToken) headers["x-customer-token"] = customerToken;

      const res = await fetch(`${API}/api/products/${productId}/reviews`, {
        method: "POST",
        headers,
        body: JSON.stringify({ rating, comment, customerName: name, imageUrl: imageBase64 ?? null }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: t("login_error"), description: d.error, variant: "destructive" });
        return;
      }
      setSubmitted(true);
      setRating(0);
      setComment("");
      setGuestName("");
      clearImage();
      fetchReviews();
      if (d.rewardCode) {
        setRewardCode(d.rewardCode);
      } else {
        toast({ title: t("review_thanks") });
      }
    } finally { setSubmitting(false); }
  };

  const copyRewardCode = () => {
    if (!rewardCode) return;
    navigator.clipboard.writeText(rewardCode);
    toast({ title: "تم نسخ الكود!" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Reward Code Modal */}
      {rewardCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Gift className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">شكراً على تقييمك! 🌱</h2>
            <p className="text-muted-foreground text-sm mb-6">
              كمكافأة على مراجعتك القيّمة، حصلت على كوبون خصم 10% لطلبك القادم:
            </p>
            <div
              onClick={copyRewardCode}
              className="flex items-center justify-center gap-3 bg-primary/5 border-2 border-primary/20 rounded-2xl px-6 py-4 mb-6 cursor-pointer hover:border-primary/50 transition-colors group"
            >
              <code className="text-xl font-mono font-bold text-primary tracking-widest">{rewardCode}</code>
              <Copy className="w-5 h-5 text-primary/50 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground mb-6">انقر على الكود لنسخه — صالح لمدة 90 يوماً</p>
            <Button onClick={() => setRewardCode(null)} className="w-full">
              رائع، شكراً!
            </Button>
          </div>
        </div>
      )}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowRight className="w-4 h-4" />
          {t("detail_back")}
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
            <h2 className="text-2xl font-bold mb-4">{t("detail_not_found")}</h2>
            <Button asChild variant="outline"><Link href="/products">{t("nav_products")}</Link></Button>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="aspect-square bg-muted rounded-3xl overflow-hidden border border-border/50">
                <img src={product.imageUrl || vermicompostBag} alt={product.name} className="object-cover w-full h-full" />
              </div>

              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl font-bold text-primary">{product.price} د.ج</span>
                    <span className="text-lg text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                      {t("detail_weight")}: {product.weightKg} {product.unit}
                    </span>
                  </div>
                  {!reviewsLoading && stats.count > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <StarDisplay rating={Math.round(stats.avg)} size="sm" />
                      <span className="text-sm font-bold text-amber-500">{stats.avg.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({stats.count} {t("detail_reviews")})</span>
                    </div>
                  )}
                </div>

                <div className="prose prose-stone rtl:prose-p:text-right max-w-none text-muted-foreground">
                  <p>{product.description}</p>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
                  <h3 className="font-bold text-lg">{t("detail_features")}</h3>
                  <ul className="space-y-3">
                    {[t("detail_feat1"), t("detail_feat2"), t("detail_feat3")].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="flex-1 h-14 text-base gap-2"
                    onClick={() => add({ id: product.id, name: product.name, price: product.price, unit: product.unit, weightKg: product.weightKg, imageUrl: product.imageUrl })}>
                    <ShoppingBag className="w-5 h-5" />
                    {t("products_add_cart")}
                  </Button>
                  <Button asChild size="lg" variant="outline" className="flex-1 h-14 text-base gap-2">
                    <Link href={`/order/${product.id}`}>
                      <ShoppingCart className="w-5 h-5" />
                      {t("detail_order_now")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <section className="mt-16">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">{t("review_title")}</h2>
                {stats.count > 0 && (
                  <span className="text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {stats.count} {t("detail_reviews")}
                  </span>
                )}
              </div>

              <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
                <div className="space-y-4">
                  {!reviewsLoading && stats.count > 0 && (
                    <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-5xl font-black text-primary tabular-nums">{stats.avg.toFixed(1)}</div>
                        <StarDisplay rating={Math.round(stats.avg)} size="sm" />
                        <div className="text-xs text-muted-foreground mt-1">{stats.count} {t("detail_reviews")}</div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map(star => {
                          const cnt = reviews.filter(r => r.rating === star).length;
                          const pct = stats.count ? (cnt / stats.count) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                              <span className="w-3 text-muted-foreground tabular-nums">{star}</span>
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-5 text-xs text-muted-foreground tabular-nums">{cnt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                          <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                          <div className="h-3 bg-muted rounded w-full mb-2" />
                          <div className="h-3 bg-muted rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
                      <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">{t("review_none")}</p>
                      <p className="text-sm mt-1">{t("review_be_first")}</p>
                    </div>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="font-bold text-sm">{review.customerName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(review.createdAt), "d MMMM yyyy", { locale: dateLocale })}
                            </div>
                          </div>
                          <StarDisplay rating={review.rating} size="sm" />
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground leading-relaxed mb-3">{review.comment}</p>}
                        {review.imageUrl && (
                          <div className="mt-2">
                            <img src={review.imageUrl} alt={t("review_img_alt")} className="rounded-xl max-h-60 w-auto object-cover border border-border cursor-zoom-in"
                              onClick={() => window.open(review.imageUrl!, "_blank")} />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="lg:sticky lg:top-24">
                  {submitted ? (
                    <div className="bg-card border border-border rounded-2xl p-6 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold mb-1">{t("review_thanks")}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{t("review_helped")}</p>
                      <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>{t("review_add_another")}</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="bg-card border border-border rounded-2xl p-6 space-y-5">
                      <h3 className="font-bold text-lg">{t("review_add_title")}</h3>

                      {!customerUser && (
                        <div className="space-y-1.5">
                          <Label>{t("review_your_name")}</Label>
                          <Input value={guestName} onChange={e => setGuestName(e.target.value)} required />
                        </div>
                      )}
                      {customerUser && (
                        <div className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          {t("review_as")}: <strong>{customerUser.name}</strong>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>{t("review_your_rating")}</Label>
                        <StarInput value={rating} onChange={setRating} />
                        {rating > 0 && (
                          <p className="text-xs text-muted-foreground">{RATING_LABELS[lang][rating]}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label>{t("review_comment")} ({t("review_optional")})</Label>
                        <Textarea rows={4} placeholder={t("review_comment_ph")} value={comment} onChange={e => setComment(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("review_image")} ({t("review_optional")})</Label>
                        {imagePreview ? (
                          <div className="relative inline-block">
                            <img src={imagePreview} alt={t("review_img_preview")} className="rounded-xl max-h-40 w-auto object-cover border border-border" />
                            <button type="button" onClick={clearImage} className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-5 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                            <ImagePlus className="w-7 h-7 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{t("review_img_click")}</span>
                            <span className="text-xs text-muted-foreground/70">{t("review_img_limit")}</span>
                            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                          </label>
                        )}
                      </div>

                      <Button type="submit" className="w-full gap-2" disabled={submitting}>
                        {submitting ? t("review_submitting") : (
                          <>
                            <Send className="w-4 h-4" />
                            {t("review_submit")}
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
