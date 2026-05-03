import { useEffect, useRef, useState } from "react";
import { Bell, ShoppingBag, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ar });
  } catch {
    return "";
  }
}

export default function NotificationBell({ token }: { token: string | null }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [marking, setMarking] = useState(false);
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
    if (!token || marking) return;
    setMarking(true);
    await fetch(`${API}/api/admin/notifications/read-all`, {
      method: "PATCH",
      headers: { "x-admin-token": token },
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    setMarking(false);
  }

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(iv);
  }, [token]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors",
          open ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
        )}
        title="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-1 shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel — fixed so it never clips inside the sidebar */}
      {open && (
        <div
          dir="rtl"
          className="fixed top-16 right-4 w-96 bg-background border border-border rounded-2xl shadow-2xl z-[200] flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 80px)" }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-foreground">الإشعارات</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* ── List ── */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">لا توجد إشعارات</p>
              </div>
            ) : (
              <>
                {/* Unread section */}
                {unread.length > 0 && (
                  <>
                    <p className="px-5 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      غير مقروءة ({unread.length})
                    </p>
                    {unread.map(n => <NotifRow key={n.id} n={n} onClose={() => setOpen(false)} />)}
                  </>
                )}

                {/* Read section */}
                {read.length > 0 && (
                  <>
                    <p className="px-5 pt-4 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-t border-border/60 mt-2">
                      مقروءة
                    </p>
                    {read.map(n => <NotifRow key={n.id} n={n} onClose={() => setOpen(false)} />)}
                  </>
                )}
              </>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-border px-5 py-3 bg-muted/20">
            <Link
              href="/admin/orders"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl py-2 transition-colors"
            >
              عرض جميع الطلبات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({ n, onClose }: { n: Notification; onClose: () => void }) {
  return (
    <Link
      href="/admin/orders"
      onClick={onClose}
      className={cn(
        "flex gap-3 items-start px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer group",
        !n.is_read && "bg-primary/[0.04]"
      )}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <ShoppingBag className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm leading-snug flex-1",
            n.is_read ? "text-muted-foreground font-normal" : "text-foreground font-semibold"
          )}>
            {n.title}
          </p>
          {!n.is_read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        {n.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>
        )}
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          {timeAgo(n.created_at)}
        </p>
      </div>
    </Link>
  );
}
