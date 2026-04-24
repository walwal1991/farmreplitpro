import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminChangePassword } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle2 } from "lucide-react";

export default function AdminChangePassword() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("adminToken");
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setLocation("/admin/login");
  }, [token, setLocation]);

  const change = useAdminChangePassword({
    request: { headers: { "x-admin-token": token || "" } },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) {
      toast({
        title: "كلمة مرور قصيرة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "غير متطابقة",
        description: "تأكيد كلمة المرور لا يطابق الكلمة الجديدة.",
        variant: "destructive",
      });
      return;
    }
    change.mutate(
      {
        data: { currentPassword, newPassword },
      },
      {
        onSuccess: (res) => {
          localStorage.setItem("adminToken", res.token);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setDone(true);
          toast({
            title: "تم التحديث",
            description: "تم تغيير كلمة المرور بنجاح.",
          });
        },
        onError: () => {
          toast({
            title: "تعذّر تغيير كلمة المرور",
            description: "تأكّد من كلمة المرور الحالية ثم حاول مجدداً.",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">تغيير كلمة المرور</h1>
          <p className="text-muted-foreground mb-8">
            استخدم كلمة مرور قوية لا تقل عن 6 أحرف.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                تحديث كلمة المرور
              </CardTitle>
            </CardHeader>
            <CardContent>
              {done && (
                <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  تم تحديث كلمة المرور بنجاح.
                </div>
              )}
              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="current">كلمة المرور الحالية</Label>
                  <Input
                    id="current"
                    type="password"
                    dir="ltr"
                    className="text-right"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new">كلمة المرور الجديدة</Label>
                  <Input
                    id="new"
                    type="password"
                    dir="ltr"
                    className="text-right"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">تأكيد كلمة المرور الجديدة</Label>
                  <Input
                    id="confirm"
                    type="password"
                    dir="ltr"
                    className="text-right"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={change.isPending}
                >
                  {change.isPending
                    ? "جاري التحديث..."
                    : "تحديث كلمة المرور"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
