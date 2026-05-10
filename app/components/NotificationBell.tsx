"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { NOTIFICATION_ICONS, NOTIFICATION_COLORS } from "@/lib/notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DROPDOWN_LIMIT = 5;

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  request_id: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Toast popup ───────────────────────────────────────────────────────────────

function NotifToast({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const icon  = NOTIFICATION_ICONS[notif.type] ?? "🔔";
  const color = NOTIFICATION_COLORS[notif.type] ?? "bg-white text-gray-700";

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-sm
        bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden
        animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="flex items-start gap-3 p-4">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${color}`}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#143D60] leading-tight">{notif.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 -mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100">
        <div className="h-full bg-[#143D60] animate-[shrink_4.5s_linear_forwards]" style={{
          animation: "shrink 4.5s linear forwards",
        }} />
      </div>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ── Main bell ─────────────────────────────────────────────────────────────────

export default function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [toast,         setToast]         = useState<Notification | null>(null);
  const [markingAll,    setMarkingAll]     = useState(false);

  // ── Fetch — plain async function, called from effects and event handlers ────

  async function loadNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, request_id, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(DROPDOWN_LIMIT);

    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    setNotifications(data ?? []);
    setUnreadCount(count ?? 0);
  }

  // Initial load
  // useEffect(() => {
  //   loadNotifications();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [userId]);

  // ── Realtime ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const n = payload.new as Notification;
          // Prepend to list (capped at DROPDOWN_LIMIT)
          setNotifications((prev) => [n, ...prev].slice(0, DROPDOWN_LIMIT));
          setUnreadCount((c) => c + 1);
          // Show toast (only if dropdown isn't open)
          setToast((current) => current ?? n);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Close on outside click ─────────────────────────────────────────────────

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async function markAllRead() {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setMarkingAll(false);
  }

  async function handleClick(notif: Notification) {
    if (!notif.read) await markRead(notif.id);
    setOpen(false);
    if (notif.request_id) {
      router.push(`/requests/${notif.request_id}`);
    } else {
      // No linked request — go to the full notifications page
      router.push("/notifications");
    }
  }

  const icon  = (n: Notification) => NOTIFICATION_ICONS[n.type] ?? "🔔";
  const color = (n: Notification) => NOTIFICATION_COLORS[n.type] ?? "bg-gray-100 text-gray-500";

  return (
    <>
      {/* ── Bell button ── */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => { setOpen((v) => !v); if (!open) loadNotifications(); }}
          title="Notifications"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-[#143D60] hover:bg-gray-50 transition-all duration-200"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            {unreadCount > 0 && (
              <circle cx="18" cy="5" r="3.5" fill="#ef4444" stroke="white" strokeWidth="1.5"/>
            )}
          </svg>
        </button>

        {/* ── Dropdown ── */}
        {open && (
          <div className="absolute top-[calc(100%+10px)] right-0 w-80 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-bold text-[#143D60]">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs font-semibold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingAll}
                  className="text-xs text-[#27667B] font-semibold hover:text-[#143D60] transition-colors duration-200 disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-gray-400">You&apos;re all caught up.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors duration-200 ${
                      !n.read ? "bg-[#F9FAFB]" : ""
                    }`}
                  >
                    {/* Icon bubble */}
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${color(n)}`}>
                      {icon(n)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!n.read ? "font-bold text-[#143D60]" : "font-medium text-gray-600"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#27667B] flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-50 px-4 py-3">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-[#27667B] hover:text-[#143D60] transition-colors duration-200"
              >
                View all notifications →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <NotifToast
          notif={toast}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}