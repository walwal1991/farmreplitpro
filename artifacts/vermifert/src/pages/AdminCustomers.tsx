import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Edit, Trash2, Ban, CheckCircle, ShoppingBag, UserPlus, Printer } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_blocked: boolean;
  created_at: string;
  order_count: number;
}

export default function AdminCustomers() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const printRef = useRef<HTMLDivElement>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/customers`, {
        headers: { "x-admin-token": token || "" },
      });
      if (res.status === 401) { setLocation("/admin/login"); return; }
      const data = await res.json();
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search)
  );

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError("الاسم والإيميل وكلمة المرور مطلوبة");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch(`${API}/api/admin/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token || "" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) { const d = await res.json(); setCreateError(d.error || "فشل الإنشاء"); return; }
      setShowCreate(false);
      setCreateForm({ name: "", email: "", phone: "", password: "" });
      fetchCustomers();
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setEditForm({ name: c.name, email: c.email, phone: c.phone || "", password: "" });
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editCustomer) return;
    setEditLoading(true);
    setEditError("");
    try {
      const body: Record<string, string> = {};
      if (editForm.name !== editCustomer.name) body.name = editForm.name;
      if (editForm.email !== editCustomer.email) body.email = editForm.email;
      if (editForm.phone !== (editCustomer.phone || "")) body.phone = editForm.phone;
      if (editForm.password) body.password = editForm.password;
      if (Object.keys(body).length === 0) { setEditCustomer(null); return; }
      const res = await fetch(`${API}/api/admin/customers/${editCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token || "" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setEditError(d.error || "فشل التعديل"); return; }
      setEditCustomer(null);
      fetchCustomers();
    } finally {
      setEditLoading(false);
    }
  };

  const handleBlock = async (c: Customer) => {
    await fetch(`${API}/api/admin/customers/${c.id}/block`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token || "" },
      body: JSON.stringify({ blocked: !c.is_blocked }),
    });
    fetchCustomers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await fetch(`${API}/api/admin/customers/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token || "" },
      });
      setDeleteTarget(null);
      fetchCustomers();
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>قائمة العملاء — متجر سماد الديدان</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 32px; color: #1a1a1a; direction: rtl; }
          .header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #4a7c59; padding-bottom: 16px; }
          .header h1 { font-size: 22px; color: #4a7c59; }
          .header p { font-size: 13px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #4a7c59; color: white; padding: 10px 12px; text-align: right; }
          td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: bold; }
          .badge-active { background: #d1fae5; color: #065f46; }
          .badge-blocked { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #9ca3af; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>قائمة العملاء</h1>
          <p>متجر سماد الديدان — ${format(new Date(), "dd MMMM yyyy", { locale: ar })} — إجمالي العملاء: ${filtered.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>الهاتف</th>
              <th>الطلبات</th>
              <th>تاريخ التسجيل</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${c.name}</td>
                <td dir="ltr">${c.email}</td>
                <td dir="ltr">${c.phone || "—"}</td>
                <td>${c.order_count}</td>
                <td>${format(new Date(c.created_at), "dd/MM/yyyy")}</td>
                <td><span class="badge ${c.is_blocked ? 'badge-blocked' : 'badge-active'}">${c.is_blocked ? 'محظور' : 'نشط'}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="footer">تمت الطباعة بواسطة لوحة تحكم المتجر</div>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              إدارة العملاء
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-base px-4 py-2">
                {customers.length} عميل
              </Badge>
              <Button variant="outline" onClick={handlePrint} disabled={loading}>
                <Printer className="w-4 h-4 ml-2" />
                طباعة القائمة
              </Button>
              <Button onClick={() => { setShowCreate(true); setCreateError(""); setCreateForm({ name: "", email: "", phone: "", password: "" }); }}>
                <UserPlus className="w-4 h-4 ml-2" />
                إضافة عميل
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالاسم أو الإيميل أو الهاتف..."
                  className="pr-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>قائمة العملاء</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={printRef}>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">لا يوجد عملاء مطابقون</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-right py-3 px-4 font-medium">#</th>
                          <th className="text-right py-3 px-4 font-medium">الاسم</th>
                          <th className="text-right py-3 px-4 font-medium">الإيميل</th>
                          <th className="text-right py-3 px-4 font-medium">الهاتف</th>
                          <th className="text-right py-3 px-4 font-medium">الطلبات</th>
                          <th className="text-right py-3 px-4 font-medium">تاريخ التسجيل</th>
                          <th className="text-right py-3 px-4 font-medium">الحالة</th>
                          <th className="text-right py-3 px-4 font-medium">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((c, i) => (
                          <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-4 text-muted-foreground text-xs">{i + 1}</td>
                            <td className="py-4 px-4 font-medium">{c.name}</td>
                            <td className="py-4 px-4 text-muted-foreground" dir="ltr">{c.email}</td>
                            <td className="py-4 px-4 text-muted-foreground" dir="ltr">{c.phone || "—"}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1">
                                <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{c.order_count}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground text-xs">
                              {format(new Date(c.created_at), "dd MMM yyyy", { locale: ar })}
                            </td>
                            <td className="py-4 px-4">
                              {c.is_blocked ? (
                                <Badge variant="destructive" className="text-xs">محظور</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-300">نشط</Badge>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => openEdit(c)} title="تعديل">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm" variant="ghost" onClick={() => handleBlock(c)}
                                  title={c.is_blocked ? "رفع الحظر" : "حظر"}
                                  className={c.is_blocked ? "text-green-600 hover:text-green-700" : "text-orange-500 hover:text-orange-600"}
                                >
                                  {c.is_blocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </Button>
                                <Button
                                  size="sm" variant="ghost" onClick={() => setDeleteTarget(c)}
                                  title="حذف" className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="أحمد محمد" />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني <span className="text-destructive">*</span></Label>
              <Input dir="ltr" type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input dir="ltr" value={createForm.phone} onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="0550000000" />
            </div>
            <div className="space-y-1.5">
              <Label>كلمة المرور <span className="text-destructive">*</span></Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="6 أحرف على الأقل" />
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCustomer} onOpenChange={(o) => !o && setEditCustomer(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات العميل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>الاسم</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>الإيميل</Label>
              <Input dir="ltr" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input dir="ltr" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>كلمة مرور جديدة <span className="text-muted-foreground text-xs">(اتركها فارغة إن لم تريد التغيير)</span></Label>
              <Input type="password" value={editForm.password} onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditCustomer(null)}>إلغاء</Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف حساب <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) نهائياً ولا يمكن استعادته.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? "جارٍ الحذف..." : "حذف نهائياً"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
