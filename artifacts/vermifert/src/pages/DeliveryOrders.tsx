import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Truck, LogOut, MapPin, Phone, Package, RefreshCw, Home, Navigation, X, Camera, PenLine, CheckCircle, Trash2, ImageIcon, PlayCircle, Flag } from "lucide-react";
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
  requiresSignature: boolean;
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

// ── Signature Pad ──────────────────────────────────────────────────────────
function SignaturePad({ onSignature }: { onSignature: (data: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      };
    }
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasDrawn.current = true;
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    if (hasDrawn.current) {
      onSignature(canvasRef.current!.toDataURL("image/png"));
    }
  }

  function clearPad() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onSignature(null);
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-border rounded-xl bg-white overflow-hidden" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full"
          style={{ height: 160, cursor: "crosshair" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/30 text-sm select-none">
          <PenLine className="w-5 h-5 ml-1" />
          وقّع هنا
        </div>
      </div>
      <button
        type="button"
        onClick={clearPad}
        className="text-xs text-muted-foreground flex items-center gap-1 hover:text-destructive transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        مسح التوقيع
      </button>
    </div>
  );
}

// ── Proof Modal ─────────────────────────────────────────────────────────────
function ProofModal({
  order,
  onClose,
  onConfirm,
  submitting,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (proof: { proofImage?: string; signatureImage?: string }) => void;
  submitting: boolean;
}) {
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProofImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const canSubmit = !order.requiresSignature || !!signatureImage;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="bg-background w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">إثبات التوصيل</h2>
            <p className="text-sm text-muted-foreground">طلب #{order.id} — {order.customerName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Photo proof */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">صورة إثبات التوصيل</span>
              <span className="text-xs text-muted-foreground">(اختياري)</span>
            </div>

            {proofImage ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={proofImage} alt="إثبات التوصيل" className="w-full max-h-48 object-cover" />
                <button
                  onClick={() => { setProofImage(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm font-medium">التقط صورة أو اختر من المعرض</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Signature (only if required) */}
          {order.requiresSignature && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">توقيع الزبون</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">مطلوب</span>
              </div>
              <SignaturePad onSignature={setSignatureImage} />
            </div>
          )}

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            بعد التأكيد سيتم تحديث حالة الطلب إلى "تم التوصيل" ولن يمكن التراجع.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
            disabled={!canSubmit || submitting}
            onClick={() => onConfirm({ proofImage: proofImage ?? undefined, signatureImage: signatureImage ?? undefined })}
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? "جارٍ التأكيد..." : "تأكيد التوصيل"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Car SVG icon ────────────────────────────────────────────────────────────
function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="rgba(0,0,0,0.18)" />
      {/* Body */}
      <rect x="10" y="28" width="44" height="22" rx="6" fill="#2d6a4f" />
      {/* Cabin */}
      <rect x="16" y="16" width="32" height="16" rx="5" fill="#40916c" />
      {/* Windshield front */}
      <rect x="18" y="17" width="12" height="11" rx="3" fill="#b7e4c7" opacity="0.85" />
      {/* Windshield rear */}
      <rect x="34" y="17" width="12" height="11" rx="3" fill="#b7e4c7" opacity="0.85" />
      {/* Left wheels */}
      <circle cx="18" cy="50" r="6" fill="#1b4332" />
      <circle cx="18" cy="50" r="3" fill="#74c69d" />
      {/* Right wheels */}
      <circle cx="46" cy="50" r="6" fill="#1b4332" />
      <circle cx="46" cy="50" r="3" fill="#74c69d" />
      {/* Headlights */}
      <rect x="11" y="32" width="5" height="3" rx="1.5" fill="#ffd166" />
      {/* Taillights */}
      <rect x="48" y="32" width="5" height="3" rx="1.5" fill="#ef233c" />
    </svg>
  );
}

// ── Trip modal (Uber-style) ─────────────────────────────────────────────────
function TripModal({
  order,
  onClose,
  onArrive,
}: {
  order: Order;
  onClose: () => void;
  onArrive: () => void;
}) {
  const [tripStarted, setTripStarted] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState(false);
  const destination = buildDestination(order);

  // Try to get driver's real location for a proper route
  useEffect(() => {
    if (!navigator.geolocation) { setGeoError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError(true),
      { timeout: 8000, maximumAge: 30000 },
    );
  }, []);

  // Build map src: directions (with route line) when we have location, destination-only fallback
  const mapSrc = currentPos
    ? `https://maps.google.com/maps?saddr=${currentPos.lat},${currentPos.lng}&daddr=${destination}&output=embed`
    : geoError
    ? `https://maps.google.com/maps?q=${destination}&output=embed&z=14`
    : null; // still loading location

  function startTrip() {
    setTripStarted(true);
    window.open(googleMapsNavUrl(order), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" dir="rtl">
      <style>{`
        @keyframes car-float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes car-drive {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          25%       { transform: translateY(-4px) rotate(1.5deg); }
          75%       { transform: translateY(-2px) rotate(-1.5deg); }
        }
        @keyframes ping-dot {
          0%   { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .car-idle    { animation: car-float 3s ease-in-out infinite; }
        .car-moving  { animation: car-drive 1.2s ease-in-out infinite; }
        .ping-ring   { animation: ping-dot 1.4s ease-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 bg-card border-b border-border shrink-0 relative z-10">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">توصيل — {order.customerName}</p>
          <p className="text-xs text-muted-foreground">{order.address}، {order.city}</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
          #{order.id}
        </span>
      </div>

      {/* Map + Car overlay */}
      <div className="flex-1 relative overflow-hidden">
        {/* Google Maps iframe — directions embed once location is known */}
        {mapSrc ? (
          <iframe
            key={mapSrc}
            title="خريطة الوجهة"
            src={mapSrc}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        ) : (
          /* Loading state while waiting for geolocation */
          <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">جاري تحديد موقعك…</p>
          </div>
        )}

        {/* Gradient fade at bottom so card sits over map cleanly */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        {/* Animated car icon — center of map */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center">
            {/* Pulsing location ring */}
            <div className="relative mb-1">
              <div
                className="ping-ring absolute inset-0 rounded-full bg-primary/30"
                style={{ width: 56, height: 56, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
              />
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow-md" />
            </div>
            {/* Car */}
            <CarIcon className={`w-16 h-16 drop-shadow-xl ${tripStarted ? "car-moving" : "car-idle"}`} />
          </div>
        </div>

        {/* Destination pin label */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg pointer-events-none">
          <Flag className="w-3 h-3 text-green-600 shrink-0" />
          <span className="text-xs font-medium truncate max-w-[200px]">{order.address}، {order.city}</span>
        </div>

        {/* Trip-started indicator */}
        {tripStarted && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <Navigation className="w-3 h-3" />
            في الطريق
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="bg-card border-t border-border px-5 pt-3 pb-5 space-y-3 shrink-0">
        {/* Compact order row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>{order.productName} × {order.quantity}</span>
          </div>
          <a href={`tel:${order.phone}`} className="flex items-center gap-1.5 text-primary font-medium">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span dir="ltr">{order.phone}</span>
          </a>
        </div>

        {/* Action buttons */}
        {!tripStarted ? (
          <button
            onClick={startTrip}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-3 shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <PlayCircle className="w-6 h-6" />
            بدء الرحلة
          </button>
        ) : (
          <>
            <button
              onClick={() => { onClose(); onArrive(); }}
              className="w-full h-14 rounded-2xl bg-green-600 text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg hover:bg-green-700 active:scale-[0.98] transition-all"
            >
              <CheckCircle className="w-6 h-6" />
              وصلت
            </button>
            <button
              onClick={startTrip}
              className="w-full h-10 rounded-xl bg-muted text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              إعادة فتح الملاحة
            </button>
          </>
        )}
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
  const [proofOrder, setProofOrder] = useState<Order | null>(null);

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
    if (newStatus === "delivered") {
      setProofOrder(order);
      return;
    }
    await submitStatusUpdate(order.id, newStatus, {});
  };

  const submitStatusUpdate = async (
    orderId: number,
    newStatus: string,
    proof: { proofImage?: string; signatureImage?: string },
  ) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`${API}/api/delivery/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-delivery-token": token! },
        body: JSON.stringify({ status: newStatus, ...proof }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "تم التوصيل ✓", description: `تم تأكيد توصيل الطلب #${orderId}` });
      setProofOrder(null);
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
                      {order.requiresSignature && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <PenLine className="w-2.5 h-2.5" />
                          يتطلب توقيعاً
                        </span>
                      )}
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

                  {/* Trip button */}
                  <div className="px-5 pb-3">
                    <button
                      onClick={() => setMapOrder(order)}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      بدء الرحلة
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

      {mapOrder && (
        <TripModal
          order={mapOrder}
          onClose={() => setMapOrder(null)}
          onArrive={() => { setMapOrder(null); setProofOrder(mapOrder); }}
        />
      )}

      {proofOrder && (
        <ProofModal
          order={proofOrder}
          onClose={() => setProofOrder(null)}
          submitting={updating === proofOrder.id}
          onConfirm={(proof) => submitStatusUpdate(proofOrder.id, "delivered", proof)}
        />
      )}
    </div>
  );
}
