import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TripMapProps {
  orderAddress: string;
  orderCity: string;
  tripStarted: boolean;
}

// ── Top-down delivery car SVG ─────────────────────────────────────────────────
// Pointing upward (north = direction of travel)
function carHtml(moving: boolean) {
  const cls = moving ? "trip-car-moving" : "trip-car-idle";
  return `
<div class="${cls}" style="width:36px;height:56px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
<svg viewBox="0 0 36 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="56">
  <!-- Body -->
  <rect x="5" y="8" width="26" height="40" rx="7" fill="#2d6a4f"/>
  <!-- Cabin roof -->
  <rect x="9" y="10" width="18" height="16" rx="4" fill="#40916c"/>
  <!-- Front windshield -->
  <rect x="10" y="11" width="16" height="10" rx="3" fill="#d8f3dc" opacity="0.92"/>
  <!-- Cargo area -->
  <rect x="9" y="28" width="18" height="14" rx="2" fill="#1b4332" opacity="0.4"/>
  <!-- Rear window -->
  <rect x="11" y="38" width="14" height="7" rx="2" fill="#d8f3dc" opacity="0.55"/>
  <!-- Front-left wheel -->
  <rect x="1" y="11" width="5" height="9" rx="2.5" fill="#1b4332"/>
  <rect x="2" y="13" width="3" height="5" rx="1.5" fill="#52b788"/>
  <!-- Front-right wheel -->
  <rect x="30" y="11" width="5" height="9" rx="2.5" fill="#1b4332"/>
  <rect x="31" y="13" width="3" height="5" rx="1.5" fill="#52b788"/>
  <!-- Rear-left wheel -->
  <rect x="1" y="34" width="5" height="9" rx="2.5" fill="#1b4332"/>
  <rect x="2" y="36" width="3" height="5" rx="1.5" fill="#52b788"/>
  <!-- Rear-right wheel -->
  <rect x="30" y="34" width="5" height="9" rx="2.5" fill="#1b4332"/>
  <rect x="31" y="36" width="3" height="5" rx="1.5" fill="#52b788"/>
  <!-- Headlights -->
  <rect x="10" y="7" width="6" height="3" rx="1.5" fill="#ffd166"/>
  <rect x="20" y="7" width="6" height="3" rx="1.5" fill="#ffd166"/>
  <!-- Tail lights -->
  <rect x="10" y="48" width="6" height="3" rx="1.5" fill="#ef233c"/>
  <rect x="20" y="48" width="6" height="3" rx="1.5" fill="#ef233c"/>
  <!-- Center stripe -->
  <rect x="17" y="28" width="2" height="10" rx="1" fill="#52b788" opacity="0.5"/>
</svg>
</div>`;
}

// ── Destination pin ───────────────────────────────────────────────────────────
const destHtml = `
<div style="display:flex;flex-direction:column;align-items:center;gap:0">
  <div style="width:36px;height:36px;background:#ef233c;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(239,35,60,0.5);border:2px solid white">
    <svg style="transform:rotate(45deg)" width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M17 8C8 10 5.9 16.17 3.82 21c0 0 .55-2.84 2.7-5.31C7.87 14.1 9 13.13 9 12a3 3 0 0 1 6 0c0 1.13 1.13 2.1 2.48 3.69C19.55 18.16 20.1 21 20.1 21 18.02 16.17 15.9 10 7 8z"/>
    </svg>
  </div>
  <div style="width:2px;height:8px;background:#ef233c;opacity:0.7"></div>
</div>`;

// ── Driver position dot ───────────────────────────────────────────────────────
const driverDotHtml = `
<div style="width:14px;height:14px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.25)"></div>`;

// ── Main component ────────────────────────────────────────────────────────────
export default function TripMap({ orderAddress, orderCity, tripStarted }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);
  const driverDotRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastRouteKey = useRef<string>("");

  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [destPos, setDestPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<"locating" | "ready" | "error">("locating");

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([36.2, 2.9], 8);

    // Carto Voyager tiles — clean, neutral, no OSM branding
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Minimal attribution
    L.control.attribution({ prefix: false, position: "bottomleft" })
      .addAttribution("© CartoDB")
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      carMarkerRef.current = null;
      driverDotRef.current = null;
      routeLayerRef.current = null;
      destMarkerRef.current = null;
    };
  }, []);

  // ── Geocode destination ───────────────────────────────────────────────────
  useEffect(() => {
    const q = `${orderAddress}, ${orderCity}, الجزائر`;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
      headers: { "Accept-Language": "ar" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]) {
          setDestPos([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      })
      .catch(() => {});
  }, [orderAddress, orderCity]);

  // ── Watch driver GPS position ─────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setStatus("error"); return; }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverPos([pos.coords.latitude, pos.coords.longitude]);
        setStatus("ready");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 },
    );
    watchIdRef.current = id;

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ── Update map when positions change ─────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Car marker (positioned at driver's actual GPS)
    if (driverPos) {
      const icon = L.divIcon({
        html: carHtml(tripStarted),
        iconSize: [36, 56],
        iconAnchor: [18, 48],
        className: "",
      });
      if (!carMarkerRef.current) {
        carMarkerRef.current = L.marker(driverPos, { icon, zIndexOffset: 1000 }).addTo(map);
      } else {
        carMarkerRef.current.setLatLng(driverPos).setIcon(icon);
      }
    }

    // Destination marker
    if (destPos && !destMarkerRef.current) {
      const icon = L.divIcon({
        html: destHtml,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        className: "",
      });
      destMarkerRef.current = L.marker(destPos, { icon }).addTo(map);
    }

    // Fit both into view and fetch route
    if (driverPos && destPos) {
      const bounds = L.latLngBounds([driverPos, destPos]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 16 });

      const routeKey = `${driverPos[0].toFixed(4)},${driverPos[1].toFixed(4)}-${destPos[0].toFixed(4)},${destPos[1].toFixed(4)}`;
      if (routeKey !== lastRouteKey.current) {
        lastRouteKey.current = routeKey;
        fetchRoute(driverPos, destPos, map);
      }
    } else if (driverPos) {
      map.setView(driverPos, 15);
    } else if (destPos) {
      map.setView(destPos, 14);
    }
  }, [driverPos, destPos, tripStarted]);

  // ── Fetch road route from OSRM ────────────────────────────────────────────
  async function fetchRoute(from: [number, number], to: [number, number], map: L.Map) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?geometries=geojson&overview=full`;
      const res = await fetch(url);
      const data = await res.json();
      const coords: [number, number][] = data.routes?.[0]?.geometry?.coordinates?.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
      );
      if (!coords?.length) return;

      if (routeLayerRef.current) {
        routeLayerRef.current.setLatLngs(coords);
      } else {
        // Outer glow
        L.polyline(coords, { color: "#fff", weight: 10, opacity: 0.6, lineCap: "round", lineJoin: "round" }).addTo(map);
        routeLayerRef.current = L.polyline(coords, {
          color: "#4361ee",
          weight: 6,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }
      // Bring car on top
      carMarkerRef.current?.bringToFront();
    } catch (_) {}
  }

  return (
    <div className="relative w-full h-full">
      {/* Inject car animations */}
      <style>{`
        @keyframes trip-idle  { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-5px) rotate(1.5deg)} }
        @keyframes trip-drive { 0%,100%{transform:translateY(0) rotate(-1deg)}  25%{transform:translateY(-3px) rotate(1deg)} 75%{transform:translateY(-1px) rotate(-1deg)} }
        .trip-car-idle   { animation: trip-idle  3s ease-in-out infinite; }
        .trip-car-moving { animation: trip-drive 1s ease-in-out infinite; }
      `}</style>

      {/* Loading overlay */}
      {status === "locating" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">جاري تحديد موقعك…</p>
        </div>
      )}

      {/* Error — no GPS */}
      {status === "error" && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full shadow">
          تعذّر تحديد الموقع — الخريطة تعرض الوجهة فقط
        </div>
      )}

      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
