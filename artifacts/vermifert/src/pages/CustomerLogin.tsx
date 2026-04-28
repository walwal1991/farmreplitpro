import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/lib/i18n";
import { Sprout, LogIn, UserPlus } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLang();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/customer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: t("login_error"), description: data.error, variant: "destructive" }); return; }
      localStorage.setItem("customerToken", data.token);
      localStorage.setItem("customerUser", JSON.stringify({ id: data.id, name: data.name, email: data.email, phone: data.phone }));
      toast({ title: t("login_welcome") + data.name });
      setLocation("/customer/dashboard");
    } finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regForm.password !== regForm.confirm) {
      toast({ title: t("login_error"), description: t("register_pass_mismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/customer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regForm.name, email: regForm.email, phone: regForm.phone, password: regForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: t("login_error"), description: data.error, variant: "destructive" }); return; }
      localStorage.setItem("customerToken", data.token);
      localStorage.setItem("customerUser", JSON.stringify({ id: data.id, name: data.name, email: data.email, phone: data.phone }));
      toast({ title: t("register_success") + data.name });
      setLocation("/customer/dashboard");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Sprout className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">{t("login_title")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("login_sub")}</p>
          </div>

          <div className="flex rounded-xl border border-border overflow-hidden mb-6">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === "login" ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted text-muted-foreground"}`}
            >
              <LogIn className="w-4 h-4 inline me-2" />
              {t("login_tab_login")}
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === "register" ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted text-muted-foreground"}`}
            >
              <UserPlus className="w-4 h-4 inline me-2" />
              {t("login_tab_register")}
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("login_email")}</Label>
                  <Input id="email" type="email" placeholder="example@email.com" dir="ltr" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t("login_password")}</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? t("login_loading") : t("login_btn")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("register_name")}</Label>
                  <Input id="name" value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">{t("login_email")}</Label>
                  <Input id="reg-email" type="email" placeholder="example@email.com" dir="ltr" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t("register_phone")}</Label>
                  <Input id="phone" type="tel" placeholder="0555 000 000" dir="ltr" value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-pass">{t("register_pass")}</Label>
                    <Input id="reg-pass" type="password" placeholder="••••••" value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">{t("register_confirm")}</Label>
                    <Input id="confirm" type="password" placeholder="••••••" value={regForm.confirm} onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))} required />
                  </div>
                </div>
                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? t("register_loading") : t("register_btn")}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
