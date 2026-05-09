"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { NOTIFICATION_ICONS, NOTIFICATION_COLORS } from "@/lib/notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  request_id: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  request_received: "Rental request",
  request_accepted: "Request accepted",
  request_declined: "Request declined",
  gear_delivered:   "Gear delivered",
  gear_received:    "Gear received",
  rental_complete:  "Rental complete",
  new_message:      "New message",
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const groups: Record<string, Notification[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Older: [],
  };

  for (const n of notifications) {
    const d = new Date(n.created_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day >= today)      groups["Today"].push(n);
    else if (day >= yesterday) groups["Yesterday"].push(n);
    else if (day >= weekAgo)   groups["This week"].push(n);
    else                       groups["Older"].push(n);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export default function NotificationsPage() {
  const router = useRouter();

  const [userId,        setUserId]        = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState<"all" | "unread">("all");
  const [markingAll,    setMarkingAll]     = useState(false);

  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth/login?redirect=/notifications");
        return;
      }
      setUserId(session.user.id);
    }
    init();
  }, [router]);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, request_id, read, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(100);

    setNotifications(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) fetchAll(userId);
  }, [userId, fetchAll]);

  // ── Realtime ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notif-page:${userId}`)
      .on("postgres_changes", {
        event:  "INSERT",
        schema: "public",
        table:  "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async function markAllRead() {
    if (!userId) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setMarkingAll(false);
  }

  async function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }

  async function handleClick(notif: Notification) {
    if (!notif.read) await markRead(notif.id);
    if (notif.request_id) {
      router.push(`/requests/${notif.request_id}`);
    }
    // If no request_id, just mark as read — already on the notifications page
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const grouped   = groupByDate(filtered);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">Activity</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#143D60]">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex-shrink-0 text-xs font-bold border border-[#143D60] text-[#143D60] px-4 py-2 rounded-xl hover:bg-[#143D60] hover:text-white transition-all duration-200 disabled:opacity-40 mt-2"
            >
              {markingAll ? "Marking…" : `Mark all read (${unreadCount})`}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="grid grid-cols-2 gap-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-1.5 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filter === "all" ? "bg-[#143D60] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filter === "unread" ? "bg-[#143D60] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-16 text-center">
            <p className="text-4xl mb-4">🔔</p>
            <p className="font-bold text-[#143D60] mb-1">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="text-sm text-gray-400 mb-5">
              {filter === "unread"
                ? "You're all caught up."
                : "Activity from your rentals and messages will show up here."}
            </p>
            {filter === "unread" && (
              <button
                onClick={() => setFilter("all")}
                className="text-sm font-semibold text-[#27667B] underline underline-offset-2"
              >
                View all notifications
              </button>
            )}
            {filter === "all" && (
              <Link href="/browse"
                className="inline-block bg-[#143D60] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200">
                Browse gear
              </Link>
            )}
          </div>
        )}

        {/* Grouped list */}
        <div className="space-y-6">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3 px-1">
                {label}
              </p>
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {items.map((n) => {
                  const iconEmoji = NOTIFICATION_ICONS[n.type] ?? "🔔";
                  const colorCls  = NOTIFICATION_COLORS[n.type] ?? "bg-gray-100 text-gray-500";
                  const typeLabel = TYPE_LABELS[n.type] ?? n.type;

                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-4 px-5 py-4 transition-colors duration-200 ${
                        !n.read ? "bg-[#FAFFF5]" : "hover:bg-gray-50/60"
                      }`}
                    >
                      {/* Icon */}
                      <button
                        onClick={() => handleClick(n)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5 transition-transform duration-200 hover:scale-105 ${colorCls}`}
                        title={typeLabel}
                      >
                        {iconEmoji}
                      </button>

                      {/* Content */}
                      <button
                        onClick={() => handleClick(n)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold tracking-wide uppercase mb-0.5 ${
                              !n.read ? "text-[#27667B]" : "text-gray-400"
                            }`}>
                              {typeLabel}
                            </p>
                            <p className={`text-sm leading-snug ${
                              !n.read ? "font-bold text-[#143D60]" : "font-medium text-gray-600"
                            }`}>
                              {n.title}
                            </p>
                          </div>
                          {!n.read && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#27667B] flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.body}</p>
                        <p className="text-[11px] text-gray-300 mt-1.5">{timeAgo(n.created_at)}</p>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="text-gray-200 hover:text-gray-400 transition-colors duration-200 flex-shrink-0 mt-1 p-1 rounded-lg hover:bg-gray-100"
                        title="Dismiss"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}