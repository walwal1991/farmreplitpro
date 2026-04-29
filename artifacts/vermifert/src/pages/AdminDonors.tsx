import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Search, Users, Star, Leaf, Phone, AtSign,
  Trash2, RefreshCw, ChevronDown, ChevronUp,
  Award, Calendar,
} from "lucide-react";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const BADGE_LABELS: Record<string, string> = {
  seedling: "بذرة 🌱",
  plant: "نبتة 🌿",
  tree: "شجرة 🌳",
};
const BADGE_COLOR: Record<string, string> = {
  seedling: "bg-yellow-100 text-yellow-700 border-yellow-300",
  plant: "bg-green-100 text-green-700 border-green-300",
  tree: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

type Donor = {
  id: number;
  name: string;
  username: string;
  phone: string;
  greenPoints: number;
  totalKgDonated: string;
  badge: string;
  createdAt: string;
};

export default function AdminDonors() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");

  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "greenPoints" | "totalKgDonated">("createdAt");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [resetting, setResetting] = useState<number | null>(null);

  useEffect(() => {
    if (!token) { setLocation("/admin/login"); return; }
    load();
  }, [token]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/donors`, {
        headers: { "x-admin-token": token || "" },
      });
      if (!res.ok) throw new Error();
      setDonors(await res.json());
    } catch {
      setError("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  async function resetPoints(id: number) {
    if (!confirm("هل تريد تصفير نقاط هذا المتبرع؟")) return;
    setResetting(id);
    try {
      const res = await fetch(`${API}/api/admin/donors/${id}/reset-points`, {
        method: "POST",
        headers: { "x-admin-token": token || "" },
      });
      if (res.ok) {
        setDonors(ds => ds.map(d => d.id === id ? { ...d, greenPoints: 0 } : d));
      }
    } finally {
      setResetting(null);
    }
  }

  async function deleteDonor(id: number) {
    if (!confirm("هل تريد حذف هذا الحساب نهائياً؟ لا يمكن التراجع.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API}/api/admin/donors/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token || "" },
      });
      if (res.ok) {
        setDonors(ds => ds.filter(d => d.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  }

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  const filtered = donors
    .filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.username?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search)
    )
    .sort((a, b) => {
      const va = sortBy === "totalKgDonated" ? parseFloat(a[sortBy]) : sortBy === "createdAt" ? new Date(a[sortBy]).getTime() : a[sortBy];
      const vb = sortBy === "totalKgDonated" ? parseFloat(b[sortBy]) : sortBy === "createdAt" ? new Date(b[sortBy]).getTime() : b[sortBy];
      return sortDir === "desc" ? (vb as number) - (va as number) : (va as number) - (vb as number);
    });

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? (sortDir === "desc" ? <ChevronDown size={13} className="text-green-600" /> : <ChevronUp size={13} className="text-green-600" />)
      : <ChevronDown size={13} className="text-gray-300" />;

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">

          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="text-green-600" size={24} /> حسابات المتبرعين
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{donors.length} حساب مسجّل</p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-2 text-sm border rounded-xl px-4 py-2 hover:bg-muted transition"
            >
              <RefreshCw size={14} /> تحديث
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Users size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المتبرعين</p>
                <p className="text-xl font-bold">{donors.length}</p>
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star size={18} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مجموع النقاط الخضراء</p>
                <p className="text-xl font-bold">{donors.reduce((s, d) => s + d.greenPoints, 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Leaf size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مجموع الكيلوغرامات</p>
                <p className="text-xl font-bold">{donors.reduce((s, d) => s + parseFloat(d.totalKgDonated || "0"), 0).toFixed(1)} كغ</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو اسم المستخدم أو رقم الهاتف..."
              className="w-full border rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
          ) : error ? (
            <div className="text-center py-16 text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">لا توجد نتائج</div>
          ) : (
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">المتبرع</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">الاتصال</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      <button className="flex items-center gap-1" onClick={() => toggleSort("greenPoints")}>
                        النقاط <SortIcon col="greenPoints" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                      <button className="flex items-center gap-1" onClick={() => toggleSort("totalKgDonated")}>
                        الكمية <SortIcon col="totalKgDonated" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الشارة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                      <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>
                        <Calendar size={12} /> الانضمام <SortIcon col="createdAt" />
                      </button>
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{d.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AtSign size={10} />{d.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone size={11} /> {d.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-yellow-600 flex items-center gap-1">
                          <Star size={12} /> {d.greenPoints}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Leaf size={12} className="text-green-500" />
                          {parseFloat(d.totalKgDonated || "0").toFixed(1)} كغ
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs border rounded-full px-2 py-0.5 font-medium ${BADGE_COLOR[d.badge] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {BADGE_LABELS[d.badge] ?? d.badge}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString("ar-DZ")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => resetPoints(d.id)}
                            disabled={resetting === d.id}
                            title="تصفير النقاط"
                            className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition disabled:opacity-40"
                          >
                            <Award size={15} />
                          </button>
                          <button
                            onClick={() => deleteDonor(d.id)}
                            disabled={deleting === d.id}
                            title="حذف الحساب"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
