import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Truck, LogOut, MapPin, Phone, Package, RefreshCw, Home, Navigation, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import StickerPrint from "@/components/StickerPrint";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Order {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "مؤكد — جاهز للشحن",
  shipped: "مشحون — في الطريق",
  delivered: "تم التوصيل",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-200",
  shipped: "bg-purple-500/10 text-purple-600 border-purple-200",
  delivered: "bg-green-500/10 text-green-600 border-green-200",
};

const NEXT_STATUS: Record<string, { value: string; label: string; color: string }> = {
  confirmed: { value: "shipped", label: "تأكيد الاستلام والشحن", color: "bg-purple-600 hover:bg-purple-700 text-white" },
  shipped: { value: "delivered", label: "تأكيد التوصيل", color: "bg-green-600 hover:bg-green-700 text-white" },
};

// ── Map helpers ────────────────────────────────────────────────────────────
function buildDestination(order: Order) {
  return encodeURIComponent(`${order.address}, ${order.city}, الجزائر`);
}
function googleMapsNavUrl(order: Order) {
  return `https://www.google.com/maps/dir/?api=1&destination=${buildDestination(order)}&travelmode=driving`;
}
function wazeNavUrl(order: Order) {
  return `https://waze.com/ul?q=${buildDestination(order)}&navigate=yes`;
}
function openStreetMapUrl(order: Order) {
  return `https://www.openstreetmap.org/search?query=${buildDestination(order)}`;
}

// ── Map modal ──────────────────────────────────────────────────────────────
function MapModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=-8.6914,18.9906,9.5166,37.3399&layer=mapnik&marker=&query=${buildDestination(order)}`;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 bg-card border-b border-border shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{order.customerName}</p>
          <p className="text-xs text-muted-foreground truncate">{order.address}، {order.city}</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">طلب #{order.id}</span>
      </div>

      {/* Map iframe */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          title="خريطة العنوان"
          src={mapSrc}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
        {/* Pin overlay label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-full px-4 py-1.5 text-xs font-medium shadow-lg pointer-events-none">
          <MapPin className="w-3 h-3 inline ml-1 text-primary" />
          {order.address}، {order.city}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="px-4 py-4 bg-card border-t border-border grid grid-cols-3 gap-3 shrink-0">
        <a
          href={googleMapsNavUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-3 font-bold text-xs hover:bg-primary/90 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Google Maps
        </a>
        <a
          href={wazeNavUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 bg-[#05c8f7] text-white rounded-xl py-3 font-bold text-xs hover:opacity-90 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.54 6.63C19.38 4.46 17.28 3 15 3c-.96 0-1.86.25-2.65.68C11.57 3.25 10.77 3 10 3 7.58 3 5.5 4.5 4.39 6.73 3.3 8.93 3.5 11.5 5 13.5L12 21l7-7.5c1.5-2 1.68-4.73.54-6.87z"/>
          </svg>
          Waze
        </a>
        <a
          href={openStreetMapUrl(order)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 bg-muted text-foreground rounded-xl py-3 font-bold text-xs hover:bg-muted/80 transition-colors border border-border"
        >
          <MapPin className="w-5 h-5" />
          OpenStreetMap
        </a>
      </div>
    </div>
  );
}

export default function DeliveryOrders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [stickerOrder, setStickerOrder] = useState<Order | null>(null);
  const [mapOrder, setMapOrder] = useState<Order | null>(null);

  const token = localStorage.getItem("deliveryToken");
  const userStr = localStorage.getItem("deliveryUser");
  const user = userStr ? JSON.parse(userStr) : null;
  const [available, setAvailable] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

  useEffect(() => {
    if (!token) { setLocation("/delivery/login"); }
  }, [token, setLocation]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/delivery/orders`, {
        headers: { "x-delivery-token": token },
      });
      if (res.status === 401) { setLocation("/delivery/login"); return; }
      const data = await res.json();
      setOrders(data);
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل الطلبات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, setLocation, toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    setUpdating(order.id);
    try {
      const res = await fetch(`${API}/api/delivery/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-delivery-token": token! },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "تم التحديث", description: `تم تغيير حالة الطلب #${order.id}` });
      fetchOrders();
    } catch {
      toast({ title: "خطأ", description: "فشل التحديث", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const toggleAvailability = async () => {
    setTogglingAvail(true);
    try {
      const res = await fetch(`${API}/api/delivery/me/available`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-delivery-token": token! },
        body: JSON.stringify({ available: !available }),
      });
      if (res.ok) {
        setAvailable((v) => !v);
        toast({ title: !available ? "أصبحت متاحاً" : "أصبحت مشغولاً" });
      }
    } finally { setTogglingAvail(false); }
  };

  const handleLogout = async () => {
    await fetch(`${API}/api/delivery/logout`, {
      method: "POST",
      headers: { "x-delivery-token": token! },
    }).catch(() => {});
    localStorage.removeItem("deliveryToken");
    localStorage.removeItem("deliveryUser");
    setLocation("/delivery/login");
  };

  if (!token) return null;

  const roleLabel = user?.role === "company" ? "شركة توصيل" : "سائق توصيل";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{roleLabel}</div>
            </div>
            <button
              onClick={toggleAvailability}
              disabled={togglingAvail}
              className={`mr-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                available
                  ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                  : "bg-red-100 text-red-600 border-red-300 hover:bg-red-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${available ? "bg-green-500" : "bg-red-500"}`} />
              {available ? "متاح" : "مشغول"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Link href="/">
                <Home className="w-4 h-4" />
                المتجر
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchOrders} title="تحديث">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">الطلبات المسندة</h1>
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {orders.length} طلب
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">لا توجد طلبات حالياً</p>
            <p className="text-sm mt-1">ستظهر هنا الطلبات المؤكدة والمشحونة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const next = NEXT_STATUS[order.status];
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  {/* Card header */}
                  <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">طلب #{order.id}</span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "dd MMM", { locale: ar })}
                    </span>
                  </div>

                  <div className="px-5 py-4 space-y-3">
                    {/* Customer */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.address}، {order.city}</div>
                        {order.notes && (
                          <div className="text-xs text-amber-600 mt-1 bg-amber-50 rounded px-2 py-0.5 inline-block">
                            {order.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <a
                      href={`tel:${order.phone}`}
                      className="flex items-center gap-3 text-sm text-primary hover:underline"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      <span dir="ltr">{order.phone}</span>
                    </a>

                    {/* Product */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{order.productName}</span>
                        <span className="text-muted-foreground"> × {order.quantity}</span>
                      </div>
                      <div className="mr-auto font-bold text-primary text-sm">
                        {order.totalPrice.toLocaleString("ar-DZ")} د.ج
                      </div>
                    </div>
                  </div>

                  {/* Navigate bar */}
                  <div className="px-5 pb-3">
                    <button
                      onClick={() => setMapOrder(order)}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      الملاحة إلى العنوان
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-4 flex gap-2">
                    {next && (
                      <Button
                        className={`flex-1 h-10 font-bold text-sm ${next.color}`}
                        disabled={updating === order.id}
                        onClick={() => handleStatusUpdate(order, next.value)}
                      >
                        {updating === order.id ? "جارٍ التحديث..." : next.label}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      title="طباعة الملصق"
                      onClick={() => setStickerOrder(order)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <StickerPrint
        order={stickerOrder}
        open={!!stickerOrder}
        onClose={() => setStickerOrder(null)}
      />

      {mapOrder && <MapModal order={mapOrder} onClose={() => setMapOrder(null)} />}
    </div>
  );
}
