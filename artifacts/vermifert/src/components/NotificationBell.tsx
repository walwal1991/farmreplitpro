import { useEffect, useRef, useState } from "react";
import { Bell, ShoppingBag, CalendarCheck, CheckCheck, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell({ token }: { token: string | null }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/notifications`, {
        headers: { "x-admin-token": token },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    if (!token) return;
    await fetch(`${API}/api/admin/notifications/read-all`, {
      method: "PATCH",
      headers: { "x-admin-token": token },
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  // Poll every 30 s
  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(iv);
  }, [token]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function handleOpen() {
    setOpen(o => !o);
    if (!open) fetchNotifications();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
        title="الإشعارات"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 flex flex-col max-h-[480px]" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">الإشعارات</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  تحديد الكل كمقروء
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">لا توجد إشعارات</p>
            ) : (
              notifications.map(n => {
                const Icon = n.type === "new_subscription" ? CalendarCheck : ShoppingBag;
                const href = n.type === "new_subscription" ? "/admin/subscriptions" : "/admin/orders";
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex gap-3 items-start px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer",
                      !n.is_read && "bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      n.type === "new_subscription" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-green-100 dark:bg-green-900/30"
                    )}>
                      <Icon className={cn("w-4 h-4", n.type === "new_subscription" ? "text-amber-600" : "text-green-600")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn("text-sm font-medium leading-tight", !n.is_read && "text-foreground font-semibold")}>
                          {n.title}
                        </p>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1" dir="ltr">
                        {format(new Date(n.created_at), "d MMM yyyy - HH:mm", { locale: ar })}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border">
            <Link
              href="/admin/orders"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-primary hover:underline"
            >
              عرض كل الطلبات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
