import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminLogin } from "@workspace/api-client-react";
import { useState } from "react";
import { Sprout, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const login = useAdminLogin();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    login.mutate({ data: { username, password } }, {
      onSuccess: (res) => {
        localStorage.setItem("adminToken", res.token);
        setLocation("/admin/products");
      },
      onError: () => {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5">
          <ArrowRight className="w-4 h-4" />
          العودة إلى المتجر
        </Link>
      <div className="bg-card p-8 rounded-3xl border border-border shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">تسجيل الدخول للإدارة</h1>
          <p className="text-muted-foreground mt-2">متجر سماد الديدان</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              type="text"
              dir="ltr"
              className="text-right"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              className="text-right"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full h-12" disabled={login.isPending}>
            {login.isPending ? "جاري الدخول..." : "دخول"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            هذه الصفحة مخصّصة لمسؤول المتجر فقط.
          </p>
        </form>
      </div>
      </div>
    </div>
  );
}
