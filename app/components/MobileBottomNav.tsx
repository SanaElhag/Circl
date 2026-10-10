"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Explore",
    href: "/browse",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
    ),
  },
  {
    label: "Post",
    href: "/post-gear",
    isHero: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: "Inbox",
    href: "/messages",
    icon: null,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkUnread() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);
      // Count messages from others in the last 7 days as proxy for unread
      const uid = session.user.id;
      const { data: requests } = await supabase
        .from("requests")
        .select("id")
        .or(`requester_id.eq.${uid}`)
        .in("status", ["accepted", "active", "completed", "closed"]);
      if (!requests?.length) return;
      const ids = requests.map((r: { id: string }) => r.id);
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("request_id", ids)
        .neq("sender_id", uid)
        .gt("created_at", new Date(Date.now() - 86400000 * 7).toISOString());
      setUnreadMessages(count ?? 0);
    }
    checkUnread();
  }, []);

  if (pathname.startsWith("/auth")) return null;

  return (
    // The "floating island" — mx-4 pulls it away from screen edges
    // rounded-2xl + shadow gives the hovering effect
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.12)] px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            // the real profile page is /profile/[id] - there's no plain
            // /profile route, so this has to resolve to an actual id (or
            // send a signed-out tap to login) instead of the bare path
            const href = item.label === "Profile"
              ? (userId ? `/profile/${userId}` : "/auth/login?redirect=/profile")
              : item.href;

            // Hero "Post" button — slightly elevated circle
            if (item.isHero) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-[#143D60] text-white"
                      : "bg-[#143D60] text-white hover:bg-[#27667B]"
                  }`}>
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-medium text-[#143D60] tracking-wide">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={href}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors duration-200"
              >
                <span className={`transition-colors duration-200 ${
                  isActive ? "text-[#143D60]" : "text-gray-500"
                }`}>
                  {item.href === "/messages" ? (
                    <div className="relative">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {unreadMessages > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#27667B]" />
                      )}
                    </div>
                  ) : item.icon}
                </span>
                <span className={`text-[9px] font-medium tracking-wide transition-colors duration-200 ${
                  isActive ? "text-[#143D60]" : "text-gray-500"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}