import { useEffect, useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Star, Trash2, ArrowRight, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Review {
  id: number;
  productId: number;
  customerId: number | null;
  customerName: string;
  rating: number;
  comment: string;
  imageUrl: string | null;
  createdAt: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/reviews`, {
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) { setLocation("/admin/login"); return; }
      setReviews(await res.json());
    } finally { setLoading(false); }
  }, [token, setLocation]);

  useEffect(() => {
    if (!token) { setLocation("/admin/login"); return; }
    fetchReviews();
  }, [token, setLocation, fetchReviews]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/reviews/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token! },
      });
      if (!res.ok) {
        const d = await res.json();
        toast({ title: "خطأ", description: d.error, variant: "destructive" });
        return;
      }
      toast({ title: "تم حذف التقييم" });
      setDeleteTarget(null);
      fetchReviews();
    } finally { setDeleteLoading(false); }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">إدارة التقييمات</h1>
          </div>
          <div className="mr-auto flex items-center gap-4 text-sm text-muted-foreground">
            <span>{reviews.length} تقييم</span>
            {reviews.length > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                متوسط {avgRating}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد تقييمات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-bold text-sm">{review.customerName}</span>
                    {review.customerId && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">عميل مسجّل</span>
                    )}
                    <StarDisplay rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.createdAt), "d MMMM yyyy", { locale: ar })}
                    </span>
                    <Link
                      href={`/products/${review.productId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      منتج #{review.productId}
                    </Link>
                  </div>
                  {review.comment ? (
                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 mt-1 italic">بدون تعليق</p>
                  )}
                  {review.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={review.imageUrl}
                        alt="صورة التقييم"
                        className="rounded-lg max-h-32 w-auto object-cover border border-border cursor-zoom-in"
                        onClick={() => window.open(review.imageUrl!, "_blank")}
                      />
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => setDeleteTarget(review)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التقييم؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف تقييم <strong>{deleteTarget?.customerName}</strong> نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
