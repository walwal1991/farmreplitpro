import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  LogOut,
  Home,
  KeyRound,
  Truck,
  Users,
  Star,
  GraduationCap,
  Leaf,
  HeartHandshake,
  Cpu,
  CalendarCheck,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

export default function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("adminToken") : null;

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin/login");
  };

  const links = [
    { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/admin/products", label: "المنتجات", icon: Package },
    { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
    { href: "/admin/consultations", label: "الاستشارات", icon: MessageSquare },
    { href: "/admin/delivery", label: "حسابات التوصيل", icon: Truck },
    { href: "/admin/customers", label: "العملاء", icon: Users },
    { href: "/admin/reviews", label: "التقييمات", icon: Star },
    { href: "/admin/enrollments", label: "تسجيلات الدورات", icon: GraduationCap },
    { href: "/admin/waste-collections", label: "جمع النفايات", icon: Leaf },
    { href: "/admin/bio-waste", label: "سوق المخلفات", icon: ShoppingCart },
    { href: "/admin/donors", label: "المتبرعون", icon: HeartHandshake },
    { href: "/admin/sensors", label: "حساسات التربة (IoT)", icon: Cpu },
    { href: "/admin/subscriptions", label: "الاشتراكات الشهرية", icon: CalendarCheck },
    { href: "/admin/change-password", label: "كلمة المرور", icon: KeyRound },
  ];

  return (
    <div className="w-64 bg-card border-l border-border h-screen flex flex-col sticky top-0">
      <div className="p-6 flex items-center justify-between">
        <Link href="/admin" className="text-xl font-bold text-primary flex items-center gap-2">
          <span>إدارة المتجر</span>
        </Link>
        <NotificationBell token={token} />
      </div>

      <div className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto min-h-0">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted w-full transition-colors"
        >
          <Home className="w-5 h-5" />
          العودة إلى المتجر
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
