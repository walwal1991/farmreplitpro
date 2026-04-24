import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Power, Truck, User } from "lucide-react";
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

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/delivery-users`, {
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) { setLocation("/admin/login"); return; }
      const data = await res.json();
      setUsers(data);
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
      if (!res.ok) {
        toast({ title: "خطأ", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "تم الإنشاء", description: `تم إنشاء الحساب "${form.name}" بنجاح` });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل الإنشاء", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (user: DeliveryUser) => {
    try {
      const res = await fetch(`${API}/api/admin/delivery-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify({ active: !user.active }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم التحديث", description: user.active ? "تم تعطيل الحساب" : "تم تفعيل الحساب" });
      fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل التحديث", variant: "destructive" });
    }
  };

  const handleDelete = async (user: DeliveryUser) => {
    if (!confirm(`هل تريد حذف حساب "${user.name}" نهائياً؟`)) return;
    try {
      const res = await fetch(`${API}/api/admin/delivery-users/${user.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token! },
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم الحذف" });
      fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
    }
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">حسابات التوصيل</h1>
              <p className="text-muted-foreground mt-1">إدارة حسابات السائقين وشركات التوصيل</p>
            </div>
            <Button className="gap-2 font-bold" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              إضافة حساب
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "إجمالي الحسابات", value: users.length, icon: Truck },
              { label: "السائقون", value: users.filter(u => u.role === "driver").length, icon: User },
              { label: "شركات التوصيل", value: users.filter(u => u.role === "company").length, icon: Truck },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                <div className="text-2xl font-black text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">الاسم</th>
                    <th className="px-6 py-4 font-medium">اسم المستخدم</th>
                    <th className="px-6 py-4 font-medium">الهاتف</th>
                    <th className="px-6 py-4 font-medium">النوع</th>
                    <th className="px-6 py-4 font-medium">تاريخ الإنشاء</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                    <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-5 bg-muted rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        لا توجد حسابات بعد. أضف سائقاً أو شركة توصيل.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${!user.active ? "opacity-50" : ""}`}>
                        <td className="px-6 py-4 font-bold">{user.name}</td>
                        <td className="px-6 py-4 font-mono text-muted-foreground">{user.username}</td>
                        <td className="px-6 py-4" dir="ltr">{user.phone || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            user.role === "company"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}>
                            {user.role === "company" ? "شركة توصيل" : "سائق"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {format(new Date(user.createdAt), "dd MMM yyyy", { locale: ar })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            user.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                          }`}>
                            {user.active ? "نشط" : "معطل"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${user.active ? "text-amber-500 hover:text-amber-600" : "text-green-600 hover:text-green-700"}`}
                              title={user.active ? "تعطيل" : "تفعيل"}
                              onClick={() => handleToggle(user)}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="حذف"
                              onClick={() => handleDelete(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Portal link */}
          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">رابط بوابة التوصيل</div>
              <div className="text-xs text-muted-foreground mt-0.5">شارك هذا الرابط مع السائقين وشركات التوصيل</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
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

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة حساب توصيل جديد</DialogTitle>
          </DialogHeader>
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
                {[
                  { value: "driver", label: "سائق" },
                  { value: "company", label: "شركة توصيل" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                    form.role === opt.value
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border hover:bg-muted"
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={form.role === opt.value}
                      onChange={() => setForm({ ...form, role: opt.value as "driver" | "company" })}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 font-bold" disabled={saving}>
                {saving ? "جارٍ الحفظ..." : "إنشاء الحساب"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setForm(EMPTY_FORM); }}>
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
