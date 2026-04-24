import { useState, useEffect } from "react";
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
import { Users, Search, Edit, Trash2, Ban, CheckCircle, ShoppingBag } from "lucide-react";
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

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
            <Badge variant="outline" className="text-base px-4 py-2">
              {customers.length} عميل
            </Badge>
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
                      {filtered.map((c) => (
                        <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEdit(c)}
                                title="تعديل"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleBlock(c)}
                                title={c.is_blocked ? "رفع الحظر" : "حظر"}
                                className={c.is_blocked ? "text-green-600 hover:text-green-700" : "text-orange-500 hover:text-orange-600"}
                              >
                                {c.is_blocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteTarget(c)}
                                title="حذف"
                                className="text-destructive hover:text-destructive"
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
            </CardContent>
          </Card>
        </div>
      </main>

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
