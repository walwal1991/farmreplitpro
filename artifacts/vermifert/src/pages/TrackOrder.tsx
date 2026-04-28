import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import OrderTracker from "@/components/OrderTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Package } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { format } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface TrackResult {
  id: number;
  trackingNumber: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  city: string;
  customerName: string;
  createdAt: string;
  assignedDriverName?: string | null;
}

export default function TrackOrder() {
  const [location] = useLocation();
  const { t, lang } = useLang();

  const pathParts = location.split("/");
  const urlTracking = pathParts[pathParts.length - 1] !== "track" ? pathParts[pathParts.length - 1] : "";

  const [trackingInput, setTrackingInput] = useState(urlTracking.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");

  const dateLocale = lang === "ar" ? ar : lang === "fr" ? fr : enUS;

  const STATUS_LABELS: Record<string, string> = {
    pending: t("status_pending"),
    confirmed: t("status_confirmed"),
    shipped: t("status_shipped"),
    delivered: t("status_delivered"),
    cancelled: t("status_cancelled"),
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  async function doTrack(tn: string) {
    if (!tn) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API}/api/orders/track/${tn}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("track_invalid")); return; }
      setResult(data);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (urlTracking) doTrack(urlTracking.toUpperCase());
  }, []);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    await doTrack(trackingInput.trim().toUpperCase());
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Search className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">{t("track_title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("track_sub")}</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-3 mb-8">
          <div className="flex-1">
            <Label htmlFor="tracking" className="sr-only">{t("track_tracking_number")}</Label>
            <Input
              id="tracking"
              placeholder="VF2026XXXXXX"
              dir="ltr"
              className="text-center font-mono text-base h-12 uppercase tracking-widest"
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value.toUpperCase())}
              required
            />
          </div>
          <Button type="submit" className="h-12 px-6" disabled={loading}>
            <Search className="w-4 h-4 me-2" />
            {loading ? t("track_searching") : t("track_search")}
          </Button>
        </form>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-center mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="font-bold text-base">{result.productName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5">
                    <span>{t("track_qty")} {result.quantity}</span>
                    <span>{result.totalPrice.toLocaleString()} د.ج</span>
                    <span>{result.city}</span>
                    <span>{format(new Date(result.createdAt), "d MMMM yyyy", { locale: dateLocale })}</span>
                  </div>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[result.status] ?? ""}`}>
                  {STATUS_LABELS[result.status] ?? result.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <span>{t("track_tracking_number")}</span>
                <code className="font-mono font-bold text-primary" dir="ltr">{result.trackingNumber}</code>
              </div>
            </div>
            <div className="px-5 py-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">{t("track_stages")}</h3>
              <OrderTracker status={result.status} assignedDriverName={result.assignedDriverName} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
