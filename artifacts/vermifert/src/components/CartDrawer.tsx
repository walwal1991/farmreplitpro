import { useCart } from "@/lib/cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useLang } from "@/lib/i18n";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";

export default function CartDrawer() {
  const { items, total, isOpen, close, setQty, remove } = useCart();
  const { t } = useLang();

  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b border-border/60">
          <SheetTitle className="flex items-center gap-2 text-right">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span>{t("drawer_title")} ({items.length})</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <p className="text-muted-foreground">{t("drawer_empty")}</p>
            <Button asChild onClick={close}>
              <Link href="/products">{t("drawer_browse")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 bg-card border border-border/60 rounded-xl p-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={it.imageUrl || vermicompostBag} alt={it.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm line-clamp-2 mb-1">{it.name}</h4>
                    <div className="text-sm text-primary font-bold mb-2">{it.price} د.ج</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button onClick={() => setQty(it.id, it.quantity - 1)} className="px-2 py-1 hover:bg-muted" aria-label="-">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-sm font-medium tabular-nums">{it.quantity}</span>
                        <button onClick={() => setQty(it.id, it.quantity + 1)} className="px-2 py-1 hover:bg-muted" aria-label="+">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button onClick={() => remove(it.id)} className="ms-auto text-destructive/70 hover:text-destructive p-1" aria-label="remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("drawer_total")}</span>
                <span className="text-xl font-extrabold text-primary tabular-nums">{total} د.ج</span>
              </div>
              <Button asChild size="lg" className="w-full" onClick={close}>
                <Link href="/cart">{t("drawer_checkout")}</Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground">{t("drawer_cod")}</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
