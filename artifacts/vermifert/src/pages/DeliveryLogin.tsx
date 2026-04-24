import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck, Sprout, ArrowRight } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function DeliveryLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/delivery/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطأ في تسجيل الدخول", description: data.error, variant: "destructive" });
        return;
      }
      localStorage.setItem("deliveryToken", data.token);
      localStorage.setItem("deliveryUser", JSON.stringify({ id: data.id, name: data.name, username: data.username, role: data.role }));
      setLocation("/delivery/orders");
    } catch {
      toast({ title: "خطأ", description: "تعذر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5">
          <ArrowRight className="w-4 h-4" />
          العودة إلى المتجر
        </Link>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary mx-auto mb-4">
            <Truck className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sprout className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-primary">متجر سماد الديدان</span>
          </div>
          <h1 className="text-2xl font-bold">بوابة التوصيل</h1>
          <p className="text-muted-foreground text-sm mt-1">للسائقين وشركات التوصيل</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
            {loading ? "جارٍ الدخول..." : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
