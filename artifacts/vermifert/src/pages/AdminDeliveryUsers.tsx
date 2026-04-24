import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Power, Truck, User, Phone, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DeliveryUser {
  id: number;
  username: string;
  name: string;
  phone: string;
  role: string;
  active: boolean;
  available: boolean;
  createdAt: string;
}

interface CreateForm {
  username: string;
  password: string;
  name: string;
  phone: string;
  role: "driver" | "company";
}

const EMPTY_FORM: CreateForm = { username: "", password: "", name: "", phone: "", role: "driver" };

export default function AdminDeliveryUsers() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const { toast } = useToast();

  const [users, setUsers] = useState<DeliveryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "driver" | "company">("all");

  useEffect(() => { if (!token) setLocation("/admin/login"); }, [token, setLocation]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/delivery-users`, { headers: { "x-admin-token": token } });
      if (res.status === 401) { setLocation("/admin/login"); return; }
      setUsers(await res.json());
    } catch {
      toast({ title: "خطأ", description: "تعذر تحميل البيانات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, setLocation, toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/delivery-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "خطأ", description: data.error, variant: "destructive" }); return; }
      toast({ title: "تم الإنشاء", description: `تم إنشاء حساب "${form.name}"` });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل الإنشاء", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (user: DeliveryUser) => {
    try {
      await fetch(`${API}/api/admin/delivery-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify({ active: !user.active }),
      });
      toast({ title: user.active ? "تم تعطيل الحساب" : "تم تفعيل الحساب" });
      fetchUsers();
    } catch { toast({ title: "خطأ", variant: "destructive" }); }
  };

  const handleDelete = async (user: DeliveryUser) => {
    if (!confirm(`هل تريد حذف حساب "${user.name}" نهائياً؟`)) return;
    try {
      await fetch(`${API}/api/admin/delivery-users/${user.id}`, {
        method: "DELETE", headers: { "x-admin-token": token! },
      });
      toast({ title: "تم الحذف" });
      fetchUsers();
    } catch { toast({ title: "خطأ", variant: "destructive" }); }
  };

  if (!token) return null;

  const activeUsers = users.filter(u => u.active);
  const freeDrivers = activeUsers.filter(u => u.role === "driver" && u.available);
  const busyDrivers = activeUsers.filter(u => u.role === "driver" && !u.available);
  const freeCompanies = activeUsers.filter(u => u.role === "company" && u.available);

  const filtered = users.filter(u => filter === "all" || u.role === filter);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">حسابات التوصيل</h1>
              <p className="text-muted-foreground mt-1">السائقون وشركات التوصيل</p>
            </div>
            <Button className="gap-2 font-bold" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              إضافة حساب
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">سائقون متاحون</span>
              </div>
              <div className="text-3xl font-black text-green-700 dark:text-green-400">{freeDrivers.length}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-red-600">سائقون مشغولون</span>
              </div>
              <div className="text-3xl font-black text-red-600">{busyDrivers.length}</div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">شركات متاحة</span>
              </div>
              <div className="text-3xl font-black text-primary">{freeCompanies.length}</div>
            </div>
            <div className="bg-muted border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">إجمالي الحسابات</span>
              </div>
              <div className="text-3xl font-black">{users.length}</div>
            </div>
          </div>

          {/* Free drivers highlight */}
          {freeDrivers.length > 0 && (
            <div className="mb-8 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
              <h2 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                السائقون المتاحون الآن — يمكن تكليفهم بالطلبات
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {freeDrivers.map(u => (
                  <div key={u.id} className="bg-white dark:bg-green-950/40 rounded-lg p-3 border border-green-200 dark:border-green-700 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-lg shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{u.name}</div>
                      <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5" dir="ltr">
                        <Phone className="w-3 h-3" />{u.phone || "—"}
                      </div>
                    </div>
                    <div className="mr-auto shrink-0">
                      <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">متاح</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "all", label: "الكل" },
              { key: "driver", label: "السائقون" },
              { key: "company", label: "الشركات" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>لا توجد حسابات بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(user => {
                const isDriver = user.role === "driver";
                return (
                  <div
                    key={user.id}
                    className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${
                      !user.active
                        ? "opacity-50 bg-muted/30 border-border"
                        : user.available
                        ? "bg-card border-green-200 dark:border-green-800 shadow-sm"
                        : "bg-card border-border"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                        isDriver ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                                 : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{user.name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{user.username}</div>
                      </div>
                      {/* Availability badge */}
                      {user.active && (
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          user.available
                            ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/50 text-red-600"
                        }`}>
                          {user.available ? "متاح ✓" : "مشغول"}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground" dir="ltr">
                        <Phone className="w-3 h-3" />
                        {user.phone || "—"}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {isDriver ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {isDriver ? "سائق توصيل" : "شركة توصيل"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        منذ {format(new Date(user.createdAt), "dd MMM yyyy", { locale: ar })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-2 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 h-8 text-xs gap-1.5 ${user.active ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
                        onClick={() => handleToggleActive(user)}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {user.active ? "تعطيل" : "تفعيل"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Portal link */}
          <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">رابط بوابة التوصيل</div>
              <div className="text-xs text-muted-foreground mt-0.5">شارك مع السائقين وشركات التوصيل</div>
            </div>
            <Button
              variant="outline" size="sm" className="gap-1.5 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + import.meta.env.BASE_URL + "delivery/login");
                toast({ title: "تم النسخ", description: "تم نسخ الرابط إلى الحافظة" });
              }}
            >
              نسخ الرابط
            </Button>
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إضافة حساب توصيل جديد</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الاسم الكامل *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="محمد أحمد" required />
              </div>
              <div className="space-y-1.5">
                <Label>اسم المستخدم *</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="driver01" dir="ltr" required />
              </div>
              <div className="space-y-1.5">
                <Label>كلمة المرور *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0555123456" dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>نوع الحساب</Label>
              <div className="flex gap-3">
                {[{ value: "driver", label: "سائق" }, { value: "company", label: "شركة توصيل" }].map((opt) => (
                  <label key={opt.value} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                    form.role === opt.value ? "bg-primary/10 border-primary text-primary" : "border-border hover:bg-muted"
                  }`}>
                    <input type="radio" name="role" value={opt.value} checked={form.role === opt.value}
                      onChange={() => setForm({ ...form, role: opt.value as "driver" | "company" })} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 font-bold" disabled={saving}>
                {saving ? "جارٍ الحفظ..." : "إنشاء الحساب"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setForm(EMPTY_FORM); }}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
