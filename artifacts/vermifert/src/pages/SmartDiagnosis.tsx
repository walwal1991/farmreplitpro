import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useListProducts } from "@workspace/api-client-react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import {
  FlaskConical, Leaf, Ruler, Sprout, CheckCircle2, ShoppingCart,
  MapPin, Droplets, Wind, CloudRain, Sun, CloudSun, Cloud, Loader2, Thermometer, Cpu, TrendingUp,
} from "lucide-react";
import vermicompostBag from "@assets/generated_images/vermicompost-bag.png";
import { useToast } from "@/hooks/use-toast";
import type { Lang } from "@/lib/translations";

// ── IoT Moisture Widget ───────────────────────────────────────────────────────

const MOISTURE_TIERS = [
  { max: 20, label: "جاف جداً — ري عاجل!",     tip: "🚨 التربة في حالة جفاف حرج. تحتاج ريّاً فورياً قبل إضافة أي سماد.", gauge: "#ef4444" },
  { max: 40, label: "جاف — ري موصى به",         tip: "⚠️ الرطوبة منخفضة. يُنصح بالريّ قبل إضافة السماد لضمان الامتصاص الجيد.", gauge: "#f97316" },
  { max: 65, label: "مناسب — وضع مثالي",        tip: "✅ رطوبة التربة مثالية. الآن هو أفضل وقت لتطبيق سماد الديدان.", gauge: "#22c55e" },
  { max: 85, label: "رطب — أجّل التسميد",       tip: "💧 التربة رطبة أكثر من اللازم. انتظر حتى تجف قليلاً قبل التسميد.", gauge: "#3b82f6" },
  { max: 101, label: "مشبع — خطر تعفّن الجذور", tip: "🌊 التربة مشبعة بالماء. لا تسمّد الآن وتحقق من الصرف.", gauge: "#8b5cf6" },
];

function getMoistureTier(m: number) {
  return MOISTURE_TIERS.find(t => m < t.max) ?? MOISTURE_TIERS[MOISTURE_TIERS.length - 1];
}

interface SensorReading { moisture: number; temperature: number | null; createdAt: string }
interface SensorInfo { deviceId: string; name: string; location: string | null; reading: SensorReading | null }

function IoTWidget({ apiBase }: { apiBase: string }) {
  const [pending, setPending] = useState("");
  const [sensor, setSensor] = useState<SensorInfo | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSensor = useCallback(async (id: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/sensors/${encodeURIComponent(id)}/latest`);
      if (!res.ok) { setError("الجهاز غير موجود. تأكد من معرّف الجهاز."); setSensor(null); return; }
      setSensor(await res.json()); setError("");

      const hRes = await fetch(`${apiBase}/api/sensors/${encodeURIComponent(id)}/history?limit=20`);
      if (hRes.ok) setHistory(await hRes.json());
    } catch { if (!silent) setError("تعذّر الاتصال بالخادم"); }
    finally { if (!silent) setLoading(false); }
  }, [apiBase]);

  const connect = (id: string) => {
    if (!id.trim()) return;
    fetchSensor(id.trim());
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchSensor(id.trim(), true), 30_000);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const tier = sensor?.reading ? getMoistureTier(sensor.reading.moisture) : null;
  const moisture = sensor?.reading?.moisture ?? 0;
  const circumference = 2 * Math.PI * 26;
  const dash = (moisture / 100) * circumference;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-green-50 to-emerald-50 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
          <Cpu className="w-4 h-4 text-primary" />
        </div>
        <p className="font-bold text-sm">حساس رطوبة التربة (IoT)</p>
      </div>

      {/* Device ID input */}
      <form onSubmit={e => { e.preventDefault(); connect(pending); }} className="flex gap-2">
        <input
          value={pending}
          onChange={e => setPending(e.target.value)}
          placeholder="أدخل معرّف الجهاز (Device ID)..."
          dir="ltr"
          className="flex-1 bg-white/80 border border-border rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
        />
        <button type="submit" disabled={!pending.trim()} className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors">
          ربط
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحميل...
        </div>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}

      {sensor && sensor.reading && tier && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">{sensor.name}</p>
              {sensor.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} />{sensor.location}</p>}
            </div>
            <span className="text-[10px] text-muted-foreground">
              يتجدد كل 30 ث
            </span>
          </div>

          {/* Gauge + stats */}
          <div className="flex items-center gap-4">
            {/* Circular gauge */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="26" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                <circle cx="30" cy="30" r="26" fill="none"
                  stroke={tier.gauge} strokeWidth="5"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold leading-none">{Math.round(moisture)}%</span>
                <span className="text-[9px] text-muted-foreground">رطوبة</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-2">
              <div className="inline-block text-xs font-bold px-2.5 py-1 rounded-full border"
                style={{ color: tier.gauge, backgroundColor: `${tier.gauge}15`, borderColor: `${tier.gauge}40` }}>
                {tier.label}
              </div>
              {sensor.reading.temperature !== null && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Thermometer size={12} className="text-orange-500" />
                  درجة الحرارة: <strong>{sensor.reading.temperature}°C</strong>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                آخر قراءة:{" "}
                {new Date(sensor.reading.createdAt).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* History sparkline */}
          {history.length > 1 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">آخر {history.length} قراءة</p>
              <div className="flex items-end gap-0.5 h-10">
                {history.map((h, i) => {
                  const t = getMoistureTier(h.moisture);
                  return (
                    <div key={i} title={`${Math.round(h.moisture)}%`}
                      className="flex-1 rounded-sm transition-all"
                      style={{ height: `${Math.max(4, h.moisture)}%`, backgroundColor: `${t.gauge}90` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Tip */}
          <p className="text-xs rounded-xl px-3 py-2 border leading-relaxed"
            style={{ backgroundColor: `${tier.gauge}10`, borderColor: `${tier.gauge}30`, color: tier.gauge }}>
            {tier.tip}
          </p>
        </div>
      )}

      {sensor && !sensor.reading && (
        <p className="text-sm text-muted-foreground text-center py-3">لا توجد قراءات بعد — تأكد أن الجهاز يرسل البيانات.</p>
      )}
    </div>
  );
}

// ── Weather helpers ───────────────────────────────────────────────────────────

interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  uvIndex: number;
  forecast: { date: string; maxTemp: number; minTemp: number; precip: number; code: number }[];
}

function wmoLabel(code: number): string {
  if (code === 0) return "صافٍ";
  if (code <= 3) return "غائم جزئياً";
  if (code <= 49) return "ضبابي";
  if (code <= 67) return "مطر";
  if (code <= 77) return "ثلج";
  if (code <= 82) return "زخات مطر";
  if (code <= 99) return "عاصفة";
  return "غير معروف";
}

function WmoIcon({ code, size = 20 }: { code: number; size?: number }) {
  if (code === 0) return <Sun size={size} className="text-yellow-500" />;
  if (code <= 3) return <CloudSun size={size} className="text-yellow-400" />;
  if (code <= 67) return <CloudRain size={size} className="text-blue-400" />;
  return <Cloud size={size} className="text-gray-400" />;
}

async function geocode(city: string): Promise<{ lat: number; lon: number; display: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "ar", "User-Agent": "vermifert-app" } });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name.split(",").slice(0, 2).join("،") };
}

async function fetchWeather(lat: number, lon: number, display: string): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,uv_index");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum");
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString());
  const d = await res.json();
  const c = d.current;

  return {
    city: display,
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    precipitation: c.precipitation,
    weatherCode: c.weather_code,
    uvIndex: Math.round(c.uv_index ?? 0),
    forecast: d.daily.time.slice(1, 5).map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(d.daily.temperature_2m_max[i + 1]),
      minTemp: Math.round(d.daily.temperature_2m_min[i + 1]),
      precip: d.daily.precipitation_sum[i + 1],
      code: d.daily.weather_code[i + 1],
    })),
  };
}

function WeatherCard({ weather, loading, error }: { weather: WeatherData | null; loading: boolean; error: string }) {
  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> جارٍ تحميل بيانات الطقس...
    </div>
  );
  if (error) return <p className="text-red-500 text-sm py-2">{error}</p>;
  if (!weather) return null;

  const days = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-sky-50 to-blue-50 p-4 space-y-3">
      {/* Current */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
            <MapPin size={11} /> {weather.city}
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-sky-700">{weather.temp}°</span>
            <span className="text-sm text-muted-foreground mb-1">/ يشعر كـ {weather.feelsLike}°</span>
          </div>
          <p className="text-sm text-sky-600 font-medium">{wmoLabel(weather.weatherCode)}</p>
        </div>
        <WmoIcon code={weather.weatherCode} size={48} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: <Droplets size={13} className="text-blue-500" />, label: "رطوبة", val: `${weather.humidity}%` },
          { icon: <Wind size={13} className="text-gray-500" />,     label: "ريح", val: `${weather.windSpeed} كم/س` },
          { icon: <CloudRain size={13} className="text-blue-400" />, label: "تساقط", val: `${weather.precipitation} مم` },
          { icon: <Sun size={13} className="text-orange-400" />,    label: "UV", val: weather.uvIndex },
        ].map(({ icon, label, val }) => (
          <div key={label} className="bg-white/70 rounded-xl p-2 text-center border border-white">
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-xs font-bold text-gray-700">{val}</p>
          </div>
        ))}
      </div>

      {/* Forecast */}
      <div className="grid grid-cols-4 gap-1.5">
        {weather.forecast.map(f => {
          const day = days[new Date(f.date).getDay()];
          return (
            <div key={f.date} className="bg-white/70 rounded-xl p-2 text-center border border-white">
              <p className="text-[10px] text-muted-foreground mb-1">{day}</p>
              <div className="flex justify-center mb-1"><WmoIcon code={f.code} size={14} /></div>
              <p className="text-xs font-bold">{f.maxTemp}°</p>
              <p className="text-[10px] text-muted-foreground">{f.minTemp}°</p>
              {f.precip > 0 && <p className="text-[10px] text-blue-400">{f.precip}مم</p>}
            </div>
          );
        })}
      </div>

      {/* Agri tip based on weather */}
      {weather.temp > 35 && (
        <p className="text-xs bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-3 py-2">
          🌡️ درجة الحرارة مرتفعة — ينصح بالتسميد في الصباح الباكر أو المساء لتجنب تبخر المواد الغذائية.
        </p>
      )}
      {weather.precipitation > 5 && (
        <p className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-3 py-2">
          🌧️ يُتوقع هطول مطر — يمكن تخفيف جرعة السماد السائل لهذا الأسبوع.
        </p>
      )}
      {weather.humidity > 80 && (
        <p className="text-xs bg-teal-50 border border-teal-200 text-teal-700 rounded-xl px-3 py-2">
          💧 رطوبة عالية — تأكد من تهوية التربة جيداً قبل الإضافة.
        </p>
      )}
    </div>
  );
}

// ── Irrigation System ─────────────────────────────────────────────────────────
function calcIrrigation(soilType: string, crop: string, area: number, weather: WeatherData | null, irrigationSystem = "auto") {
  let waterPerSqm = 4;
  if (soilType === "sandy" || soilType === "rocky") waterPerSqm = 6;
  else if (soilType === "clay") waterPerSqm = 3;
  else if (soilType === "silt") waterPerSqm = 4.5;

  if (["tomato", "cucumber", "pepper"].includes(crop)) waterPerSqm *= 1.4;
  else if (crop === "potato") waterPerSqm *= 1.2;
  else if (crop === "fruit_tree") waterPerSqm *= 0.85;

  // Drip irrigation uses ~30% less water; sprinkler ~15% less
  if (irrigationSystem === "drip") waterPerSqm *= 0.70;
  else if (irrigationSystem === "sprinkler") waterPerSqm *= 0.85;
  else if (irrigationSystem === "manual") waterPerSqm *= 1.10;

  let freqDays = 3;
  if (soilType === "sandy" || soilType === "rocky") freqDays = 2;
  else if (soilType === "clay") freqDays = 6;
  else if (soilType === "silt") freqDays = 4;
  if (["tomato", "cucumber", "pepper"].includes(crop)) freqDays = Math.max(1, freqDays - 1);
  if (crop === "fruit_tree") freqDays += 2;

  // Drip can water more frequently with less stress
  if (irrigationSystem === "drip") freqDays = Math.max(1, freqDays - 1);

  const tips: string[] = [];
  if (weather) {
    if (weather.temp > 35) { freqDays = Math.max(1, freqDays - 1); tips.push("🌡️ الحرارة مرتفعة — زِد تكرار الريّ وتجنّب الريّ في منتصف النهار."); }
    if (weather.precipitation > 5) { waterPerSqm *= 0.6; tips.push("🌧️ يُتوقع هطول مطر — قلّل كمية الريّ هذا الأسبوع."); }
    if (weather.humidity > 75) { waterPerSqm *= 0.85; tips.push("💧 رطوبة جوية عالية — يمكن تخفيف كمية الريّ."); }
    if (weather.temp < 15) { freqDays += 2; tips.push("❄️ الجو بارد — قلّل تكرار الريّ وريّ في الصباح الباكر فقط."); }
  }

  // System-specific tips
  if (irrigationSystem === "drip") tips.push("💧 ريّ بالتنقيط: وفّر حتى 30% من المياه مع توصيل مباشر لجذور النبات.");
  else if (irrigationSystem === "sprinkler") tips.push("🚿 ريّ بالرش: مناسب للمساحات الكبيرة — تجنّب الرش وقت الحرارة الشديدة.");
  else if (irrigationSystem === "flood") tips.push("🌊 ريّ بالغمر: تأكد من انتظام مستوى الأرض لضمان توزيع متساوٍ للمياه.");
  else if (irrigationSystem === "manual") tips.push("🪣 ريّ يدوي: ريّ ببطء وبالقرب من الجذور لتجنّب هدر المياه.");
  else if (tips.length === 0) tips.push("✅ ظروف الريّ مثالية — التزم بالجدول المقترح للحصول على أفضل نتيجة.");

  if (tips.length === 0) tips.push("✅ ظروف الريّ مثالية — التزم بالجدول المقترح للحصول على أفضل نتيجة.");

  const bestTime = weather && weather.temp > 28 ? "الصباح الباكر (6–8 ص) أو المساء (5–7 م)" : "الصباح (7–10 ص)";

  // Respect user-chosen system; auto = infer from crop/soil
  let method: string;
  let methodIcon: string;
  if (irrigationSystem === "drip")      { method = "بالتنقيط (Drip)";      methodIcon = "💧"; }
  else if (irrigationSystem === "sprinkler") { method = "بالرش (Sprinkler)"; methodIcon = "🚿"; }
  else if (irrigationSystem === "flood")     { method = "بالغمر (فيضاني)";  methodIcon = "🌊"; }
  else if (irrigationSystem === "manual")    { method = "يدوي";              methodIcon = "🪣"; }
  else {
    // auto-detect
    method = "بالغمر (فيضاني)"; methodIcon = "🌊";
    if (["tomato", "cucumber", "pepper", "flowers"].includes(crop) || soilType === "sandy") { method = "بالتنقيط (Drip)"; methodIcon = "💧"; }
    else if (["wheat", "corn", "lawn"].includes(crop)) { method = "بالرش (Sprinkler)"; methodIcon = "🚿"; }
    else if (crop === "fruit_tree") { method = "بالتنقيط أو الحوض"; methodIcon = "🌳"; }
  }

  const sessionsPerMonth = Math.round(30 / freqDays);
  const monthlyTotal = Math.round(waterPerSqm * area * sessionsPerMonth);
  const totalPerSession = Math.round(waterPerSqm * area);

  return { waterPerSqm: Math.round(waterPerSqm * 10) / 10, freqDays, bestTime, method, methodIcon, monthlyTotal, totalPerSession, tips };
}

function IrrigationWidget({ soilType, crop, area, weather, irrigationSystem }: { soilType: string; crop: string; area: number; weather: WeatherData | null; irrigationSystem: string }) {
  const plan = calcIrrigation(soilType, crop, area, weather, irrigationSystem);
  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
          <Droplets className="w-4 h-4 text-blue-600" />
        </div>
        <p className="font-bold text-sm text-blue-900 dark:text-blue-300">نظام الريّ الذكي</p>
        {weather && (
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full mr-auto">
            محسوب بالطقس الحالي
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "💧", label: "كمية الريّ (لكل م²)", value: `${plan.waterPerSqm} لتر` },
          { icon: "📅", label: "تكرار الريّ", value: `كل ${plan.freqDays} يوم` },
          { icon: "⏰", label: "أفضل وقت للريّ", value: plan.bestTime },
          { icon: plan.methodIcon, label: "طريقة الريّ الموصى بها", value: plan.method },
        ].map(({ icon, label, value }) => (
          <div key={label} className="bg-white/80 dark:bg-white/5 rounded-xl p-3 border border-blue-100 dark:border-blue-800/50">
            <div className="text-lg mb-1">{icon}</div>
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-xs font-bold text-blue-900 dark:text-blue-200 mt-0.5 leading-snug">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs opacity-75">إجمالي المياه / شهر</p>
          <p className="text-2xl font-black">
            {plan.monthlyTotal.toLocaleString()} <span className="text-sm font-normal">لتر</span>
          </p>
        </div>
        <div className="text-left border-r border-white/20 pr-4 mr-2">
          <p className="text-xs opacity-75">كل جلسة ريّ</p>
          <p className="text-xl font-black">
            {plan.totalPerSession.toLocaleString()} <span className="text-sm font-normal">لتر</span>
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {plan.tips.map((tip, i) => (
          <p key={i} className="text-xs rounded-xl px-3 py-2 bg-white/70 dark:bg-white/5 border border-blue-100 dark:border-blue-800/30 text-blue-800 dark:text-blue-300 leading-relaxed">
            {tip}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── Plant Growth Stages ───────────────────────────────────────────────────────

interface GrowthStage {
  icon: string;
  name: string;
  duration: string;
  days: [number, number];
  tip: string;
  fertilizerTip: string;
  color: string;
  solidMult: number;
  liquidMult: number;
}

const GROWTH_STAGES: Record<string, GrowthStage[]> = {
  tomato: [
    { icon: "🌱", name: "الإنبات",      duration: "0–7 أيام",   days: [0,7],    tip: "حافظ على رطوبة التربة المستمرة وحرارة 20–25°C", fertilizerTip: "لا تسميد في هذه المرحلة",                        color: "#86efac", solidMult: 0,   liquidMult: 0   },
    { icon: "🌿", name: "الشتلة",       duration: "7–21 يوم",   days: [7,21],   tip: "ضوء كافٍ وري منتظم خفيف",                        fertilizerTip: "جرعة خفيفة من السماد السائل (50%)",           color: "#4ade80", solidMult: 0,   liquidMult: 0.5 },
    { icon: "🍃", name: "النمو الخضري", duration: "21–45 يوم",  days: [21,45],  tip: "تقليم الأوراق الصفراء وتثبيت الساق",             fertilizerTip: "✅ أفضل وقت للسماد الصلب — جرعة كاملة",        color: "#22c55e", solidMult: 1,   liquidMult: 1   },
    { icon: "🌸", name: "الإزهار",      duration: "45–65 يوم",  days: [45,65],  tip: "تجنّب الريّ الزائد للحفاظ على العقد",             fertilizerTip: "سماد سائل خفيف كل أسبوعين",                  color: "#f9a8d4", solidMult: 0,   liquidMult: 0.5 },
    { icon: "🍅", name: "الإثمار",      duration: "65–95 يوم",  days: [65,95],  tip: "ري منتظم لتفادي تشقق الثمار",                    fertilizerTip: "أوقف التسميد — ركّز على الريّ المنتظم",        color: "#f97316", solidMult: 0,   liquidMult: 0   },
    { icon: "🧺", name: "الحصاد",       duration: "95–120 يوم", days: [95,120], tip: "اقطف عند اكتمال اللون واليُسر",                   fertilizerTip: "بعد الحصاد: أضف سماد الديدان لتجديد التربة", color: "#ca8a04", solidMult: 0.5, liquidMult: 0   },
  ],
  potato: [
    { icon: "🌱", name: "الإنبات",        duration: "0–14 يوم",   days: [0,14],    tip: "غرس على عمق 10–15 سم",                           fertilizerTip: "لا تسميد قبل الإنبات",                        color: "#86efac", solidMult: 0,   liquidMult: 0   },
    { icon: "🌿", name: "النمو الخضري",   duration: "14–45 يوم",  days: [14,45],   tip: "تلميع التراب حول الساق",                         fertilizerTip: "✅ سماد الديدان الصلب — جرعة كاملة",           color: "#22c55e", solidMult: 1,   liquidMult: 1   },
    { icon: "🫚", name: "تكوين الدرنات", duration: "45–75 يوم",  days: [45,75],   tip: "ري منتظم بدون تقطّع لتفادي التشويه",             fertilizerTip: "سماد سائل خفيف كل ثلاثة أسابيع",             color: "#a78bfa", solidMult: 0,   liquidMult: 0.5 },
    { icon: "⭐", name: "النضج",          duration: "75–100 يوم", days: [75,100],  tip: "قلّل الريّ تدريجياً عند اصفرار الأوراق",         fertilizerTip: "أوقف التسميد",                                color: "#fbbf24", solidMult: 0,   liquidMult: 0   },
    { icon: "🧺", name: "الحصاد",         duration: "100–120 يوم",days: [100,120], tip: "انتظر 2 أسبوع بعد جفاف الأوراق",                 fertilizerTip: "بعد الحصاد: سماد الديدان لتجديد التربة",      color: "#ca8a04", solidMult: 0.5, liquidMult: 0   },
  ],
  wheat: [
    { icon: "🌱", name: "الإنبات",      duration: "0–10 أيام",   days: [0,10],    tip: "رطوبة مستمرة وبذر على عمق 3–5 سم",               fertilizerTip: "لا تسميد — انتظر الإنبات",                    color: "#86efac", solidMult: 0,   liquidMult: 0   },
    { icon: "🌿", name: "التفريع",      duration: "10–30 يوم",   days: [10,30],   tip: "ري خفيف ومنتظم",                                 fertilizerTip: "✅ سماد الديدان الصلب — الجرعة الأولى",        color: "#4ade80", solidMult: 1,   liquidMult: 0   },
    { icon: "🍃", name: "النمو الخضري", duration: "30–60 يوم",   days: [30,60],   tip: "مراقبة الآفات وتطبيق وقائي",                     fertilizerTip: "سماد سائل لدعم النمو",                        color: "#22c55e", solidMult: 0,   liquidMult: 1   },
    { icon: "🌾", name: "طرد السنابل",  duration: "60–80 يوم",   days: [60,80],   tip: "ري منتظم بدون إفراط",                             fertilizerTip: "أوقف التسميد في هذه المرحلة",                 color: "#fbbf24", solidMult: 0,   liquidMult: 0   },
    { icon: "✨", name: "النضج",         duration: "80–100 يوم",  days: [80,100],  tip: "قلّل الريّ — جفاف تدريجي",                       fertilizerTip: "لا تسميد",                                    color: "#f59e0b", solidMult: 0,   liquidMult: 0   },
    { icon: "🧺", name: "الحصاد",       duration: "100–120 يوم", days: [100,120], tip: "احصد عند نسبة رطوبة 14%",                         fertilizerTip: "بعد الحصاد: جهّز التربة بسماد الديدان",       color: "#ca8a04", solidMult: 0.5, liquidMult: 0   },
  ],
  corn: [
    { icon: "🌱", name: "الإنبات",      duration: "0–10 أيام",   days: [0,10],    tip: "حرارة 18–32°C مثالية للإنبات",                   fertilizerTip: "لا تسميد",                                    color: "#86efac", solidMult: 0,   liquidMult: 0   },
    { icon: "🌿", name: "الشتلة",       duration: "10–35 يوم",   days: [10,35],   tip: "ري خفيف منتظم",                                  fertilizerTip: "✅ سماد الديدان الصلب — الجرعة الأولى",        color: "#22c55e", solidMult: 1,   liquidMult: 0   },
    { icon: "🍃", name: "النمو الخضري", duration: "35–65 يوم",   days: [35,65],   tip: "ري وفير ومتواصل",                                 fertilizerTip: "سماد سائل أسبوعياً",                          color: "#16a34a", solidMult: 0,   liquidMult: 1   },
    { icon: "🌽", name: "الاهتياج",     duration: "65–80 يوم",   days: [65,80],   tip: "مرحلة حرجة — لا تقطع الريّ",                     fertilizerTip: "أوقف التسميد",                                color: "#f59e0b", solidMult: 0,   liquidMult: 0   },
    { icon: "⭐", name: "النضج",         duration: "80–100 يوم",  days: [80,100],  tip: "قلّل الريّ تدريجياً",                             fertilizerTip: "لا تسميد",                                    color: "#fbbf24", solidMult: 0,   liquidMult: 0   },
    { icon: "🧺", name: "الحصاد",       duration: "100–120 يوم", days: [100,120], tip: "احصد عند جفاف السدى البنّي",                      fertilizerTip: "بعد الحصاد: سماد الديدان للدورة القادمة",     color: "#ca8a04", solidMult: 0.5, liquidMult: 0   },
  ],
  pepper: [
    { icon: "🌱", name: "الإنبات",      duration: "0–10 أيام",   days: [0,10],    tip: "حرارة 22–28°C وضوء جيد",                         fertilizerTip: "لا تسميد",                                    color: "#86efac", solidMult: 0,   liquidMult: 0   },
    { icon: "🌿", name: "الشتلة",       duration: "10–30 يوم",   days: [10,30],   tip: "ريّ خفيف وتهوية جيدة",                           fertilizerTip: "سماد سائل مخفف 50%",                          color: "#4ade80", solidMult: 0,   liquidMult: 0.5 },
    { icon: "🍃", name: "النمو الخضري", duration: "30–55 يوم",   days: [30,55],   tip: "تقليم الأفرع الجانبية الزائدة",                  fertilizerTip: "✅ سماد الديدان الصلب — جرعة كاملة",           color: "#22c55e", solidMult: 1,   liquidMult: 1   },
    { icon: "🌸", name: "الإزهار",      duration: "55–75 يوم",   days: [55,75],   tip: "تجنّب تغيّر الحرارة المفاجئ",                    fertilizerTip: "سماد سائل خفيف",                              color: "#f9a8d4", solidMult: 0,   liquidMult: 0.5 },
    { icon: "🌶️",name: "الإثمار",      duration: "75–100 يوم",  days: [75,100],  tip: "ري منتظم لضمان نضج منتظم",                       fertilizerTip: "أوقف التسميد",                                color: "#f97316", solidMult: 0,   liquidMult: 0   },
    { icon: "🧺", name: "الحصاد",       duration: "100–130 يوم", days: [100,130], tip: "اقطف عند اكتمال اللون للنوع",                    fertilizerTip: "بعد الحصاد: جدّد التربة بسماد الديدان",       color: "#ca8a04", solidMult: 0.5, liquidMult: 0   },
  ],
  cucumber: [
    { icon: "🌱", name: "الإنبات",      duration: "0–7 أيام",   days: [0,7],    tip: "درجة حرارة 24–29°C",                              fertilizerTip: "لا تسميد",                                    color: "#86efac", solidMult: 0,   liquidMult: 0   },
    { icon: "🌿", name: "الشتلة",       duration: "7–21 يوم",   days: [7,21],   tip: "ري خفيف وضوء كافٍ",                               fertilizerTip: "سماد سائل مخفف",                              color: "#4ade80", solidMult: 0,   liquidMult: 0.5 },
    { icon: "🍃", name: "النمو الخضري", duration: "21–40 يوم",  days: [21,40],  tip: "تدريب الكرمة وتوجيهها",                          fertilizerTip: "✅ سماد الديدان الصلب — جرعة كاملة",           color: "#22c55e", solidMult: 1,   liquidMult: 1   },
    { icon: "🌸", name: "الإزهار",      duration: "40–55 يوم",  days: [40,55],  tip: "مساعدة التلقيح يدوياً إذا لزم",                  fertilizerTip: "سماد سائل أسبوعياً",                          color: "#fde68a", solidMult: 0,   liquidMult: 1   },
    { icon: "🥒", name: "الإثمار",      duration: "55–70 يوم",  days: [55,70],  tip: "ري وفير ومستمر",                                 fertilizerTip: "أوقف التسميد",                                color: "#16a34a", solidMult: 0,   liquidMult: 0   },
    { icon: "🧺", name: "الحصاد",       duration: "70–90 يوم",  days: [70,90],  tip: "اقطف مبكراً لتحفيز إنتاج ثمار جديدة",            fertilizerTip: "بعد الموسم: سماد الديدان للتجديد",            color: "#ca8a04", solidMult: 0.5, liquidMult: 0   },
  ],
  fruit_tree: [
    { icon: "😴", name: "السكون",           duration: "ديسمبر–فبراير",  days: [0,60],    tip: "تقليم الأغصان الميتة والضعيفة",               fertilizerTip: "✅ سماد الديدان الصلب — أفضل وقت للتسميد",   color: "#94a3b8", solidMult: 1,   liquidMult: 0   },
    { icon: "🌸", name: "الإيراق والإزهار", duration: "مارس–أبريل",     days: [60,120],  tip: "تجنّب الصقيع وريّ جيد",                       fertilizerTip: "سماد سائل عند بداية الإزهار",                color: "#f9a8d4", solidMult: 0,   liquidMult: 1   },
    { icon: "🍃", name: "النمو الخضري",     duration: "أبريل–يونيو",    days: [120,180], tip: "مراقبة الآفات وتطبيق وقائي",                 fertilizerTip: "سماد سائل شهرياً",                           color: "#22c55e", solidMult: 0,   liquidMult: 1   },
    { icon: "🍏", name: "تكوين الثمار",     duration: "يونيو–أغسطس",   days: [180,240], tip: "تنظيف الثمار الزائدة لتضخيم الباقي",          fertilizerTip: "جرعة خفيفة من سماد الديدان",                 color: "#a3e635", solidMult: 0.5, liquidMult: 0   },
    { icon: "🍎", name: "النضج والحصاد",   duration: "أغسطس–أكتوبر",  days: [240,300], tip: "قلّل الريّ أسبوعين قبل الحصاد",               fertilizerTip: "لا تسميد",                                   color: "#f97316", solidMult: 0,   liquidMult: 0   },
  ],
  flowers: [
    { icon: "🌱", name: "الإنبات",     duration: "0–10 أيام",  days: [0,10],   tip: "رطوبة مستمرة وضوء خفيف",                          fertilizerTip: "لا تسميد",                                    color: "#86efac", solidMult: 0,   liquidMult: 0   },
    { icon: "🌿", name: "الشتلة",      duration: "10–25 يوم",  days: [10,25],  tip: "انقل عند ظهور 4 أوراق حقيقية",                   fertilizerTip: "سماد سائل مخفف 30%",                          color: "#4ade80", solidMult: 0,   liquidMult: 0.3 },
    { icon: "🍃", name: "النمو الخضري",duration: "25–50 يوم",  days: [25,50],  tip: "تقليم القمم لتكثيف التفريع",                      fertilizerTip: "✅ سماد الديدان الصلب — جرعة كاملة",           color: "#22c55e", solidMult: 1,   liquidMult: 1   },
    { icon: "🌸", name: "برعمة وإزهار",duration: "50–80 يوم",  days: [50,80],  tip: "إزالة الأزهار الذابلة باستمرار",                  fertilizerTip: "سماد سائل أسبوعياً لإطالة الإزهار",          color: "#e879f9", solidMult: 0,   liquidMult: 1   },
    { icon: "🌻", name: "ذروة الإزهار",duration: "80–120 يوم", days: [80,120], tip: "ري صباحاً لتفادي الأمراض الفطرية",                 fertilizerTip: "خفّف الجرعة إلى النصف",                       color: "#f59e0b", solidMult: 0,   liquidMult: 0.5 },
  ],
  default: [
    { icon: "🌱", name: "الإنبات",      duration: "0–10 أيام",  days: [0,10],  tip: "رطوبة مناسبة وحرارة معتدلة",                       fertilizerTip: "لا تسميد في هذه المرحلة",                     color: "#86efac", solidMult: 0,   liquidMult: 0   },
    { icon: "🌿", name: "النمو المبكر", duration: "10–30 يوم",  days: [10,30], tip: "ري منتظم وضوء كافٍ",                               fertilizerTip: "سماد سائل خفيف",                              color: "#22c55e", solidMult: 0,   liquidMult: 0.5 },
    { icon: "🍃", name: "النمو الخضري", duration: "30–60 يوم",  days: [30,60], tip: "مراقبة الآفات وتغذية منتظمة",                      fertilizerTip: "✅ سماد الديدان الصلب — جرعة كاملة",           color: "#16a34a", solidMult: 1,   liquidMult: 1   },
    { icon: "🌸", name: "الإزهار",      duration: "60–80 يوم",  days: [60,80], tip: "تجنّب الريّ الزائد",                               fertilizerTip: "سماد سائل خفيف",                              color: "#f9a8d4", solidMult: 0,   liquidMult: 0.5 },
    { icon: "🧺", name: "الحصاد",       duration: "80–120 يوم", days: [80,120],tip: "احصد في الوقت المناسب",                            fertilizerTip: "بعد الحصاد: أضف سماد الديدان لتجديد التربة", color: "#ca8a04", solidMult: 0.5, liquidMult: 0   },
  ],
};

function PlantGrowthStages({
  crop,
  selectedStage,
  onSelectStage,
}: {
  crop: string;
  selectedStage: number;
  onSelectStage: (i: number) => void;
}) {
  const stages = GROWTH_STAGES[crop] ?? GROWTH_STAGES.default;
  const stage = stages[selectedStage];

  return (
    <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-green-600" />
        </div>
        <p className="font-bold text-sm text-green-900 dark:text-green-300">مراحل نمو النبات</p>
        <span className="text-[10px] bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full mr-auto">
          {stages.length} مراحل
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute top-6 right-6 left-6 h-0.5 bg-green-200 dark:bg-green-800 z-0" />
        <div className="relative z-10 flex justify-between gap-1">
          {stages.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelectStage(i)}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all shadow-sm
                  ${selectedStage === i
                    ? "scale-110 shadow-md border-transparent ring-2 ring-offset-1"
                    : "bg-white dark:bg-card border-green-200 dark:border-green-700 hover:scale-105"
                  }`}
                style={selectedStage === i
                  ? { backgroundColor: s.color, borderColor: s.color, ringColor: s.color }
                  : {}}
              >
                {s.icon}
              </div>
              <p className={`text-[9px] font-medium text-center leading-tight transition-colors ${selectedStage === i ? "font-bold" : "text-muted-foreground"}`}
                style={selectedStage === i ? { color: s.color } : {}}>
                {s.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel for selected stage */}
      {stage && (
        <div
          className="rounded-xl p-4 space-y-3 border transition-all"
          style={{ backgroundColor: `${stage.color}18`, borderColor: `${stage.color}40` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{stage.icon}</span>
              <div>
                <p className="font-bold text-sm" style={{ color: stage.color }}>{stage.name}</p>
                <p className="text-xs text-muted-foreground">{stage.duration}</p>
              </div>
            </div>
            <div className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ backgroundColor: `${stage.color}25`, color: stage.color }}>
              {stage.solidMult === 0 && stage.liquidMult === 0 ? "بدون تسميد" :
               stage.solidMult === 1 && stage.liquidMult === 1 ? "جرعة كاملة" :
               stage.solidMult >= 1 ? "صلب كامل" :
               stage.liquidMult >= 1 ? "سائل كامل" : "جرعة مخففة"}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 bg-white/60 dark:bg-white/5 rounded-lg px-3 py-2">
              <span className="text-sm mt-0.5">💡</span>
              <p className="text-xs text-foreground/80 leading-relaxed">{stage.tip}</p>
            </div>
            <div className="flex items-start gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: `${stage.color}20` }}>
              <span className="text-sm mt-0.5">🌿</span>
              <p className="text-xs font-medium leading-relaxed" style={{ color: stage.color }}>
                {stage.fertilizerTip}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Recommendation {
  productId: number;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  quantityNeeded: number;
  frequency: string;
  note: string;
}

function buildRecommendations(
  soilType: string,
  ph: number,
  areaSqm: number,
  crop: string,
  solidProducts: ReturnType<typeof useListProducts>["data"],
  liquidProducts: ReturnType<typeof useListProducts>["data"],
  lang: Lang,
  t: (k: string) => string,
  solidMult: number,
  liquidMult: number,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const units = areaSqm / 100;

  let solidDosePerUnit = 5;
  if (soilType === "sandy" || soilType === "rocky") solidDosePerUnit = 7;
  if (soilType === "clay") solidDosePerUnit = 4;
  if (ph < 6) solidDosePerUnit *= 1.2;
  if (ph > 7.5) solidDosePerUnit *= 0.9;
  if (["tomato", "potato", "pepper", "cucumber"].includes(crop)) solidDosePerUnit *= 1.3;
  if (["wheat", "corn"].includes(crop)) solidDosePerUnit *= 1.1;

  const solidKgBase = Math.ceil(solidDosePerUnit * units);
  const solidKg = Math.ceil(solidKgBase * solidMult);

  const solidFrequency =
    ph < 6 ? t("diag_freq_3w") :
    ["tomato", "potato", "pepper"].includes(crop) ? t("diag_freq_4w") :
    t("diag_freq_6w");

  const solidNote =
    ph < 6 ? t("diag_note_acidic") :
    ph > 7.5 ? t("diag_note_alkaline") :
    t("diag_note_neutral");

  const solid = solidProducts?.[0];
  if (solid && solidKg > 0) {
    recs.push({ productId: solid.id, name: solid.name, price: solid.price, unit: solid.unit, imageUrl: solid.imageUrl, quantityNeeded: solidKg, frequency: solidFrequency, note: solidNote });
  }

  let liquidLBase = Math.ceil(units);
  if (["tomato", "pepper", "cucumber", "flowers"].includes(crop)) liquidLBase = Math.ceil(units * 1.5);
  const liquidL = Math.ceil(liquidLBase * liquidMult);

  const liquidFrequency =
    ["tomato", "pepper", "cucumber"].includes(crop) ? t("diag_freq_2w") :
    t("diag_freq_3w");

  const liquid = liquidProducts?.[0];
  if (liquid && liquidL > 0) {
    recs.push({ productId: liquid.id, name: liquid.name, price: liquid.price, unit: liquid.unit, imageUrl: liquid.imageUrl, quantityNeeded: liquidL, frequency: liquidFrequency, note: t("diag_liquid_note") });
  }

  return recs;
}

export default function SmartDiagnosis() {
  const { data: products } = useListProducts();
  const { add } = useCart();
  const { toast } = useToast();
  const { t, lang } = useLang();

  const SOIL_TYPES = [
    { value: "sandy", label: t("soil_sandy") },
    { value: "clay",  label: t("soil_clay") },
    { value: "silt",  label: t("soil_silt") },
    { value: "loam",  label: t("soil_loam") },
    { value: "rocky", label: t("soil_rocky") },
    { value: "other", label: t("soil_other") },
  ];

  const CROPS = [
    { value: "tomato",     label: t("crop_tomato") },
    { value: "potato",     label: t("crop_potato") },
    { value: "wheat",      label: t("crop_wheat") },
    { value: "corn",       label: t("crop_corn") },
    { value: "pepper",     label: t("crop_pepper") },
    { value: "cucumber",   label: t("crop_cucumber") },
    { value: "fruit_tree", label: t("crop_fruit_tree") },
    { value: "flowers",    label: t("crop_flowers") },
    { value: "lawn",       label: t("crop_lawn") },
    { value: "other",      label: t("crop_other") },
  ];

  const IRRIGATION_SYSTEMS = [
    { value: "auto",      label: "تلقائي",        icon: "🔄" },
    { value: "drip",      label: "تنقيط",         icon: "💧" },
    { value: "sprinkler", label: "رش",             icon: "🚿" },
    { value: "flood",     label: "غمر (فيضاني)",  icon: "🌊" },
    { value: "manual",    label: "يدوي",           icon: "🪣" },
  ];

  const [soilType, setSoilType] = useState("sandy");
  const [ph, setPh] = useState("7");
  const [area, setArea] = useState("1000");
  const [crop, setCrop] = useState("tomato");
  const [irrigationSystem, setIrrigationSystem] = useState("auto");
  const [submitted, setSubmitted] = useState(false);

  // Growth stage state — default to the first "full dose" stage
  const [growthStageIndex, setGrowthStageIndex] = useState(() => {
    const stages = GROWTH_STAGES["tomato"];
    return stages.findIndex(s => s.solidMult >= 1) ?? 0;
  });

  // Reset growth stage index when crop changes (pick the first full-dose stage or 0)
  useEffect(() => {
    const stages = GROWTH_STAGES[crop] ?? GROWTH_STAGES.default;
    const bestIdx = stages.findIndex(s => s.solidMult >= 1);
    setGrowthStageIndex(bestIdx >= 0 ? bestIdx : 0);
    setSubmitted(false);
  }, [crop]);

  // Weather state
  const [cityInput, setCityInput] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!cityInput.trim()) { setWeather(null); setWeatherError(""); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setWeatherLoading(true);
      setWeatherError("");
      try {
        const geo = await geocode(cityInput.trim());
        if (!geo) { setWeatherError("لم يُعثر على الموقع — تأكد من اسم المدينة أو المنطقة."); setWeather(null); }
        else { setWeather(await fetchWeather(geo.lat, geo.lon, geo.display)); }
      } catch { setWeatherError("تعذّر تحميل بيانات الطقس، يُرجى المحاولة مجدداً."); }
      finally { setWeatherLoading(false); }
    }, 800);
  }, [cityInput]);

  const solidProducts = useMemo(() => products?.filter((p) => p.category === "solid" && p.active) ?? [], [products]);
  const liquidProducts = useMemo(() => products?.filter((p) => p.category === "liquid" && p.active) ?? [], [products]);

  // Derive multipliers from the selected growth stage
  const currentStages = GROWTH_STAGES[crop] ?? GROWTH_STAGES.default;
  const currentStage = currentStages[growthStageIndex] ?? currentStages[0];

  const recommendations = useMemo(() => {
    if (!submitted) return [];
    return buildRecommendations(
      soilType, parseFloat(ph) || 7, parseFloat(area) || 100, crop,
      solidProducts, liquidProducts, lang, t as (k: string) => string,
      currentStage.solidMult, currentStage.liquidMult,
    );
  }, [submitted, soilType, ph, area, crop, solidProducts, liquidProducts, lang, currentStage]);

  const totalCost = useMemo(() => recommendations.reduce((s, r) => s + r.price * r.quantityNeeded, 0), [recommendations]);

  const phNum = parseFloat(ph) || 7;
  const phComment =
    phNum < 6 ? t("diag_ph_acidic") :
    phNum > 7.5 ? t("diag_ph_alkaline") :
    t("diag_ph_neutral");

  const soilLabel = SOIL_TYPES.find((s) => s.value === soilType)?.label ?? "";
  const areaNum = parseFloat(area) || 100;
  const summaryNote = `${t("diag_summary")} ${ph}. ${t("diag_summary_soil")}: ${soilLabel}. ${t("diag_summary_area")} ${areaNum} ${t("diag_summary_sqm")}. ${phComment}.`;

  const addAllToCart = () => {
    recommendations.forEach((r) => {
      for (let i = 0; i < r.quantityNeeded; i++) {
        add({ id: r.productId, name: r.name, price: r.price, unit: r.unit, weightKg: 1, imageUrl: r.imageUrl });
      }
    });
    toast({ title: t("diag_added"), description: t("diag_added_desc") });
  };

  const noFertilizerNeeded = currentStage.solidMult === 0 && currentStage.liquidMult === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("diag_title")}</h1>
          <p className="text-lg text-muted-foreground">{t("diag_sub")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left column: form + weather */}
          <div className="space-y-4">
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Sprout className="w-4 h-4 text-primary" />
                    {t("diag_soil_type")}
                  </Label>
                  <select
                    value={soilType}
                    onChange={(e) => { setSoilType(e.target.value); setSubmitted(false); }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SOIL_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="ph">
                    <FlaskConical className="w-4 h-4 text-primary" />
                    {t("diag_ph")}
                  </Label>
                  <Input id="ph" type="number" min="1" max="14" step="0.1" value={ph} onChange={(e) => { setPh(e.target.value); setSubmitted(false); }} dir="ltr" />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Leaf className="w-4 h-4 text-primary" />
                    {t("diag_crop")}
                  </Label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CROPS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="area">
                    <Ruler className="w-4 h-4 text-primary" />
                    {t("diag_area")}
                  </Label>
                  <Input id="area" type="number" min="1" value={area} onChange={(e) => { setArea(e.target.value); setSubmitted(false); }} dir="ltr" />
                </div>

                {/* Growth Stage Picker */}
                <div className="space-y-2 col-span-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    مرحلة النمو الحالية
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {currentStages.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setGrowthStageIndex(i); setSubmitted(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          growthStageIndex === i
                            ? "text-white shadow-sm border-transparent"
                            : "bg-background border-input text-muted-foreground hover:border-green-300 hover:text-green-700"
                        }`}
                        style={growthStageIndex === i ? { backgroundColor: s.color, borderColor: s.color } : {}}
                      >
                        <span>{s.icon}</span>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <MapPin className="w-4 h-4 text-primary" />
                    موقع المزرعة (المدينة أو المنطقة)
                  </Label>
                  <Input
                    type="text"
                    value={cityInput}
                    onChange={e => setCityInput(e.target.value)}
                    placeholder="مثال: الجزائر العاصمة، ورقلة، تيزي وزو..."
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    نظام الريّ المستخدم
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {IRRIGATION_SYSTEMS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setIrrigationSystem(s.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          irrigationSystem === s.value
                            ? "bg-blue-500 border-blue-500 text-white shadow-sm"
                            : "bg-background border-input text-muted-foreground hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        <span>{s.icon}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button className="w-full h-12 text-base font-bold" onClick={() => setSubmitted(true)} disabled={!ph || !area || parseFloat(area) <= 0}>
                {t("diag_btn")}
              </Button>
            </CardContent>
          </Card>

          {/* Weather Card */}
          {(cityInput.trim() || weatherLoading) && (
            <WeatherCard weather={weather} loading={weatherLoading} error={weatherError} />
          )}

          {/* IoT Soil Moisture Widget */}
          <IoTWidget apiBase={API} />
          </div>{/* end left column */}

          {/* Results + Irrigation */}
          <div className="space-y-4">
            {submitted && recommendations.length > 0 ? (
              <div className="rounded-2xl bg-primary text-primary-foreground p-6 space-y-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  {t("diag_result_title")}
                </h2>

                {/* Stage badge */}
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                  <span className="text-xl">{currentStage.icon}</span>
                  <div>
                    <p className="text-xs text-white/60">التوصية مبنية على مرحلة النمو</p>
                    <p className="text-sm font-bold text-amber-300">{currentStage.name} — {currentStage.duration}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {recommendations.map((r) => (
                    <div key={r.productId} className="bg-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <img src={r.imageUrl || vermicompostBag} alt={r.name} className="w-10 h-10 rounded-lg object-cover bg-white/20" />
                        <span className="font-bold text-amber-300">{r.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-white/60 text-xs">{t("diag_qty_needed")}</div>
                          <div className="font-bold">{r.quantityNeeded} {r.unit}</div>
                        </div>
                        <div>
                          <div className="text-white/60 text-xs">{t("diag_frequency")}</div>
                          <div className="font-bold">{r.frequency}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/20 pt-4 space-y-1">
                  <div className="text-white/70 text-sm">{t("diag_est_cost")}</div>
                  <div className="text-4xl font-extrabold tabular-nums">
                    {totalCost.toLocaleString()}
                    <span className="text-2xl ms-1">د.ج</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3 text-sm text-white/80 leading-relaxed border-s-4 border-amber-300">
                  {summaryNote}
                </div>

                <Button className="w-full h-11 font-bold bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2" onClick={addAllToCart}>
                  <ShoppingCart className="w-4 h-4" />
                  {t("diag_add_cart")}
                </Button>
              </div>
            ) : submitted && noFertilizerNeeded ? (
              <div className="rounded-2xl border-2 p-6 space-y-3" style={{ borderColor: `${currentStage.color}60`, backgroundColor: `${currentStage.color}10` }}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentStage.icon}</span>
                  <div>
                    <p className="font-bold text-base" style={{ color: currentStage.color }}>{currentStage.name}</p>
                    <p className="text-xs text-muted-foreground">{currentStage.duration}</p>
                  </div>
                </div>
                <p className="font-bold text-sm text-foreground/80">{currentStage.fertilizerTip}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 {currentStage.tip}
                </p>
                <p className="text-xs text-muted-foreground">غيّر مرحلة النمو لمعرفة التوصية الخاصة بكل مرحلة.</p>
              </div>
            ) : submitted && recommendations.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
                <p className="text-lg">{t("diag_no_products")}</p>
                <p className="text-sm mt-2">{t("diag_no_products_hint")}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
                <FlaskConical className="w-10 h-10 text-primary/40" />
                <p className="text-base">{t("diag_enter_first")}</p>
              </div>
            )}

            {/* Irrigation System */}
            {parseFloat(area) > 0 && (
              <IrrigationWidget
                soilType={soilType}
                crop={crop}
                area={parseFloat(area) || 100}
                weather={weather}
                irrigationSystem={irrigationSystem}
              />
            )}

            {/* Plant Growth Stages */}
            <PlantGrowthStages
              crop={crop}
              selectedStage={growthStageIndex}
              onSelectStage={(i) => { setGrowthStageIndex(i); setSubmitted(false); }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
