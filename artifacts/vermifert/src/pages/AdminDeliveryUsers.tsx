import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Truck, Phone, CheckCircle2, XCircle,
  Building2, Pencil, KeyRound, Search, ShieldBan, ShieldCheck, Trash2,
} from "lucide-react";
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
  blockedReason: string | null;
  createdAt: string;
}

interface CreateForm {
  username: string;
  password: string;
  name: string;
  phone: string;
  role: "driver" | "company";
}

interface EditForm {
  name: string;
  phone: string;
  username: string;
  role: "driver" | "company";
  newPassword: string;
}

const EMPTY_CREATE: CreateForm = { username: "", password: "", name: "", phone: "", role: "driver" };

export default function AdminDeliveryUsers() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const { toast } = useToast();

  const [users, setUsers] = useState<DeliveryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "driver" | "company">("all");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<DeliveryUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", phone: "", username: "", role: "driver", newPassword: "" });
  const [saving, setSaving] = useState(false);

  // Block dialog
  const [blockTarget, setBlockTarget] = useState<DeliveryUser | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);

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
    } finally { setLoading(false); }
  }, [token, setLocation, toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openEdit = (user: DeliveryUser) => {
    setEditTarget(user);
    setEditForm({ name: user.name, phone: user.phone, username: user.username, role: user.role as "driver" | "company", newPassword: "" });
  };

  const openBlock = (user: DeliveryUser) => {
    setBlockTarget(user);
    setBlockReason("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/admin/delivery-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "خطأ", description: data.error, variant: "destructive" }); return; }
      toast({ title: "تم الإنشاء", description: `تم إنشاء حساب "${createForm.name}"` });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
      fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل الإنشاء", variant: "destructive" });
    } finally { setCreating(false); }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: editForm.name,
        phone: editForm.phone,
        username: editForm.username,
        role: editForm.role,
      };
      if (editForm.newPassword) body.password = editForm.newPassword;
      const res = await fetch(`${API}/api/admin/delivery-users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "خطأ", description: data.error, variant: "destructive" }); return; }
      toast({ title: "تم الحفظ", description: `تم تحديث بيانات "${editForm.name}"` });
      setEditTarget(null);
      fetchUsers();
    } catch {
      toast({ title: "خطأ", description: "فشل التحديث", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTarget) return;
    setBlocking(true);
    try {
      const res = await fetch(`${API}/api/admin/delivery-users/${blockTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify({ active: false, blockedReason: blockReason.trim() || null }),
      });
      if (!res.ok) { toast({ title: "خطأ", variant: "destructive" }); return; }
      toast({ title: "تم الحظر", description: `تم حظر حساب "${blockTarget.name}"` });
      setBlockTarget(null);
      fetchUsers();
    } catch {
      toast({ title: "خطأ", variant: "destructive" });
    } finally { setBlocking(false); }
  };

  const handleUnblock = async (user: DeliveryUser) => {
    try {
      await fetch(`${API}/api/admin/delivery-users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token! },
        body: JSON.stringify({ active: true }),
      });
      toast({ title: "تم رفع الحظر", description: `تم تفعيل حساب "${user.name}" من جديد` });
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
  const blockedUsers = users.filter(u => !u.active);
  const totalCompanies = users.filter(u => u.role === "company").length;

  const filtered = users
    .filter(u => filter === "all" || u.role === filter)
    .filter(u => {
      const q = search.toLowerCase();
      return !q || u.name.includes(q) || u.username.toLowerCase().includes(q) || u.phone.includes(q);
    });

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">حسابات التوصيل</h1>
              <p className="text-muted-foreground mt-1">إدارة السائقين وشركات التوصيل</p>
            </div>
            <Button className="gap-2 font-bold" onClick={() => setCreateOpen(true)}>
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
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">سائقون مشغولون</span>
              </div>
              <div className="text-3xl font-black text-amber-700">{busyDrivers.length}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldBan className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">محظورون</span>
              </div>
              <div className="text-3xl font-black text-red-700">{blockedUsers.length}</div>
            </div>
            <div className="bg-muted border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">إجمالي الحسابات</span>
              </div>
              <div className="text-3xl font-black">{users.length}</div>
            </div>
          </div>

          {/* Filters + Search */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex gap-2">
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
            <div className="flex-1 max-w-xs relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو المستخدم..."
                className="pr-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-right font-semibold text-muted-foreground px-4 py-3">الاسم</th>
                  <th className="text-right font-semibold text-muted-foreground px-4 py-3">اسم المستخدم</th>
                  <th className="text-right font-semibold text-muted-foreground px-4 py-3">الهاتف</th>
                  <th className="text-right font-semibold text-muted-foreground px-4 py-3">النوع</th>
                  <th className="text-right font-semibold text-muted-foreground px-4 py-3">الحالة</th>
                  <th className="text-right font-semibold text-muted-foreground px-4 py-3">التوفر</th>
                  <th className="text-right font-semibold text-muted-foreground px-4 py-3">تاريخ الإنشاء</th>
                  <th className="text-right font-semibold text-muted-foreground px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-muted animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-muted-foreground">
                      <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>لا توجد حسابات مطابقة</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, idx) => {
                    const isDriver = user.role === "driver";
                    const isBlocked = !user.active;
                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${isBlocked ? "bg-red-50/40 dark:bg-red-950/10" : idx % 2 !== 0 ? "bg-muted/10" : ""}`}
                      >
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                              isBlocked ? "bg-red-100 dark:bg-red-900/40 text-red-500" :
                              isDriver ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                                       : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                            }`}>
                              {isBlocked ? <ShieldBan className="w-4 h-4" /> : user.name.charAt(0)}
                            </div>
                            <div>
                              <span className={`font-medium ${isBlocked ? "line-through text-muted-foreground" : ""}`}>{user.name}</span>
                              {user.blockedReason && (
                                <p className="text-xs text-red-500 mt-0.5 max-w-[160px] truncate" title={user.blockedReason}>
                                  السبب: {user.blockedReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{user.username}</span>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-muted-foreground" dir="ltr">
                            <Phone className="w-3 h-3" />
                            {user.phone || <span className="italic opacity-50">—</span>}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            isDriver
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                              : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          }`}>
                            {isDriver ? <Truck className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                            {isDriver ? "سائق" : "شركة"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {isBlocked ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600">
                              <ShieldBan className="w-3 h-3" />
                              محظور
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700">
                              مفعّل
                            </span>
                          )}
                        </td>

                        {/* Available */}
                        <td className="px-4 py-3">
                          {!isBlocked ? (
                            <span className={`flex items-center gap-1 text-xs font-medium ${
                              user.available ? "text-green-600" : "text-amber-600"
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${user.available ? "bg-green-500" : "bg-amber-500"}`} />
                              {user.available ? "متاح" : "مشغول"}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Created at */}
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(user.createdAt), "dd MMM yyyy", { locale: ar })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* Edit */}
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="تعديل البيانات"
                              onClick={() => openEdit(user)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>

                            {/* Block / Unblock */}
                            {isBlocked ? (
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="رفع الحظر"
                                onClick={() => handleUnblock(user)}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                title="حظر الحساب"
                                onClick={() => openBlock(user)}
                              >
                                <ShieldBan className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Delete */}
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="حذف الحساب"
                              onClick={() => handleDelete(user)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

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

      {/* ── Create Dialog ─────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) { setCreateOpen(false); setCreateForm(EMPTY_CREATE); } }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة حساب توصيل جديد</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الاسم الكامل *</Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="محمد أحمد" required />
              </div>
              <div className="space-y-1.5">
                <Label>اسم المستخدم *</Label>
                <Input value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} placeholder="driver01" dir="ltr" required />
              </div>
              <div className="space-y-1.5">
                <Label>كلمة المرور *</Label>
                <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="••••••••" required />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف</Label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="0555123456" dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>نوع الحساب</Label>
              <div className="flex gap-3">
                {[{ value: "driver", label: "سائق" }, { value: "company", label: "شركة توصيل" }].map((opt) => (
                  <label key={opt.value} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                    createForm.role === opt.value ? "bg-primary/10 border-primary text-primary" : "border-border hover:bg-muted"
                  }`}>
                    <input type="radio" name="create-role" value={opt.value} checked={createForm.role === opt.value}
                      onChange={() => setCreateForm({ ...createForm, role: opt.value as "driver" | "company" })} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 font-bold" disabled={creating}>
                {creating ? "جارٍ الحفظ..." : "إنشاء الحساب"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setCreateForm(EMPTY_CREATE); }}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              تعديل بيانات الحساب
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الاسم الكامل *</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>اسم المستخدم *</Label>
                <Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} dir="ltr" required />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>رقم الهاتف</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="0555123456" dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>نوع الحساب</Label>
              <div className="flex gap-3">
                {[{ value: "driver", label: "سائق" }, { value: "company", label: "شركة توصيل" }].map((opt) => (
                  <label key={opt.value} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                    editForm.role === opt.value ? "bg-primary/10 border-primary text-primary" : "border-border hover:bg-muted"
                  }`}>
                    <input type="radio" name="edit-role" value={opt.value} checked={editForm.role === opt.value}
                      onChange={() => setEditForm({ ...editForm, role: opt.value as "driver" | "company" })} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                كلمة مرور جديدة
                <span className="text-xs text-muted-foreground font-normal">(اتركها فارغة إن لم تريد تغييرها)</span>
              </Label>
              <Input
                type="password"
                value={editForm.newPassword}
                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 font-bold" disabled={saving}>
                {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Block Dialog ──────────────────────────────────── */}
      <Dialog open={!!blockTarget} onOpenChange={(v) => { if (!v) setBlockTarget(null); }}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldBan className="w-5 h-5" />
              حظر الحساب
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBlock} className="space-y-4 mt-2">
            {blockTarget && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center font-bold text-red-600">
                  {blockTarget.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm">{blockTarget.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{blockTarget.username}</div>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>سبب الحظر <span className="text-muted-foreground font-normal text-xs">(اختياري)</span></Label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="مثال: تأخر متكرر في التوصيل، سلوك غير لائق..."
                rows={3}
                className="resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              سيتم إلغاء جلسة الدخول الخاصة بهذا الحساب فوراً ولن يتمكن من الدخول حتى رفع الحظر.
            </p>
            <div className="flex gap-3 pt-1">
              <Button type="submit" variant="destructive" className="flex-1 font-bold gap-2" disabled={blocking}>
                <ShieldBan className="w-4 h-4" />
                {blocking ? "جارٍ الحظر..." : "تأكيد الحظر"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setBlockTarget(null)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
