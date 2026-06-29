"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import NotificationBell from "./NotificationBell";

const communityLinks = [
  { label: "Latest Posts",   href: "/community" },
  { label: "Creator's Blog", href: "/community/blog" },
  { label: "Campus News",    href: "/community/news" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router   = useRouter();

  const [categories, setCategories] = useState<{ label: string; slug: string }[]>([
    { label: "Skiing",        slug: "skiing" },
    { label: "Snowboarding",  slug: "snowboarding" },
    { label: "Hiking",        slug: "hiking" },
    { label: "Camping",       slug: "camping" },
    { label: "Climbing",      slug: "climbing" },
    { label: "Water Sports",  slug: "water-sports" },
    { label: "Cycling",       slug: "cycling" },
    { label: "Fishing",       slug: "fishing" },
  ]);
  const [user,          setUser]          = useState<User | null | undefined>(undefined);
  const [scrolled,      setScrolled]      = useState(false);
  const [browseOpen,    setBrowseOpen]    = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);

  const browseTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const communityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRef     = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase
      .from("categories")
      .select("name, slug")
      .eq("is_active", true)
      .order("position")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCategories(data.map((c) => ({ label: c.name, slug: c.slug })));
        }
      });
  }, []);

  // Scroll shrink
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Browse hover
  function openBrowse()    { if (browseTimer.current) clearTimeout(browseTimer.current); setBrowseOpen(true); }
  function closeBrowse()   { browseTimer.current = setTimeout(() => setBrowseOpen(false), 150); }

  // Community hover
  function openCommunity()  { if (communityTimer.current) clearTimeout(communityTimer.current); setCommunityOpen(true); }
  function closeCommunity() { communityTimer.current = setTimeout(() => setCommunityOpen(false), 150); }

  // Profile hover
  function openProfile()  { if (profileTimer.current) clearTimeout(profileTimer.current); setProfileOpen(true); }
  function closeProfile() { profileTimer.current = setTimeout(() => setProfileOpen(false), 150); }

  async function handleSignOut() {
    setProfileOpen(false);
    setMobileOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  }

  const isLoading   = user === undefined;
  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    ?? user?.email?.[0]?.toUpperCase()
    ?? "?";

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all duration-300 ${
          scrolled ? "h-14" : "h-20"
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">

          {/* ── LEFT: Brand ── */}
          <Link
            href="/"
            className="text-sm font-bold tracking-[0.2em] text-[#143D60] uppercase shrink-0 hover:opacity-70 transition-opacity duration-200"
          >
            Circl
          </Link>

          {/* ── CENTER: Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-8">

            {/* Browse — clickable + mega menu on hover */}
            <div className="relative" onMouseEnter={openBrowse} onMouseLeave={closeBrowse}>
              <Link
                href="/browse"
                className={`text-sm transition-colors duration-200 flex items-center gap-1 ${
                  pathname.startsWith("/browse") ? "text-[#143D60] font-semibold" : "text-gray-500 hover:text-[#143D60]"
                }`}
              >
                Browse
                <svg className={`w-3 h-3 transition-transform duration-300 ${browseOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              {browseOpen && <div className="absolute top-full left-0 w-full h-4" />}
            </div>

            <Link
              href="/about"
              className={`text-sm transition-colors duration-200 ${
                pathname === "/about" ? "text-[#143D60] font-semibold" : "text-gray-500 hover:text-[#143D60]"
              }`}
            >
              About
            </Link>

            {/* Community — clickable + mega menu on hover */}
            <div className="relative" onMouseEnter={openCommunity} onMouseLeave={closeCommunity}>
              <Link
                href="/community"
                className={`text-sm transition-colors duration-200 flex items-center gap-1 ${
                  pathname.startsWith("/community") ? "text-[#143D60] font-semibold" : "text-gray-500 hover:text-[#143D60]"
                }`}
              >
                Community
                <svg className={`w-3 h-3 transition-transform duration-300 ${communityOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              {communityOpen && <div className="absolute top-full left-0 w-full h-4" />}
            </div>

            {/* Become an Owner */}
            {user ? (
              <Link
                href="/become-owner"
                className={`text-sm transition-colors duration-200 ${
                  pathname.startsWith("/become-owner") ? "text-[#143D60] font-semibold" : "text-gray-500 hover:text-[#143D60]"
                }`}
              >
                Become an Owner
              </Link>
            ) : (
              <Link
                href="/auth/login?redirect=/become-owner"
                className="text-sm text-gray-500 hover:text-[#143D60] transition-colors duration-200"
              >
                Become an Owner
              </Link>
            )}
          </nav>

          {/* ── RIGHT: Auth actions ── */}
          <div className="hidden md:flex items-center gap-3">
            {!isLoading && (
              user ? (
                <>
                  {/* Dashboard */}
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-[#143D60] px-4 py-2 text-sm font-medium text-[#143D60] hover:bg-[#143D60] hover:text-white transition-all duration-200"
                  >
                    Dashboard
                  </Link>

                  {/* Notification bell */}
                  <NotificationBell userId={user.id} />

                  {/* Profile dropdown */}
                  <div
                    ref={profileRef}
                    className="relative"
                    onMouseEnter={openProfile}
                    onMouseLeave={closeProfile}
                  >
                    <button
                      onClick={() => setProfileOpen((v) => !v)}
                      className="flex items-center justify-center h-9 w-9 rounded-full bg-[#DDEB9D] text-xs font-bold text-[#143D60] hover:bg-[#A0C878] transition-colors duration-200"
                      title="My account"
                    >
                      {userInitial}
                    </button>

                    {profileOpen && <div className="absolute top-full right-0 w-full h-3" />}

                    {profileOpen && (
                      <div
                        className="absolute top-[calc(100%+12px)] right-0 w-52 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden"
                        onMouseEnter={openProfile} onMouseLeave={closeProfile}
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-gray-50">
                          <p className="text-xs font-bold text-[#143D60] truncate">
                            {user.user_metadata?.full_name ?? "Circl Member"}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                        </div>

                        <Link href={`/profile/${user.id}`}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-[#143D60] hover:bg-gray-50 transition-colors duration-200 border-b border-gray-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>

                        <Link href="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-[#143D60] hover:bg-gray-50 transition-colors duration-200 border-b border-gray-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          Dashboard
                        </Link>

                        <Link href="/messages"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-[#143D60] hover:bg-gray-50 transition-colors duration-200 border-b border-gray-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Messages
                        </Link>

                        <Link href="/account-settings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-[#143D60] hover:bg-gray-50 transition-colors duration-200 border-b border-gray-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Account Settings
                        </Link>

                        <button onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors duration-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth/login"
                    className="text-sm text-gray-500 hover:text-[#143D60] transition-colors duration-200">
                    Sign in
                  </Link>
                  <Link href="/auth/register"
                    className="rounded-xl border border-[#143D60] px-5 py-2 text-sm font-medium text-[#143D60] hover:bg-[#143D60] hover:text-white transition-all duration-200">
                    Join Circl
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 text-[#143D60]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </header>

      {/* ── MEGA MENU ── */}
      {browseOpen && (
        <div
          className="fixed top-0 left-0 right-0 z-40"
          style={{ paddingTop: scrolled ? "56px" : "80px" }}
          onMouseEnter={openBrowse}
          onMouseLeave={closeBrowse}
        >
          <div className="bg-white border-b border-gray-100 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="mx-auto max-w-7xl px-6 py-10">
              <p className="text-xs tracking-[0.25em] uppercase text-gray-400 mb-8">Browse by category</p>
              <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                {categories.map((cat) => (
                  <Link key={cat.slug} href={`/browse?category=${cat.slug}`}
                    onClick={() => setBrowseOpen(false)}
                    className="group flex items-center justify-between py-3 border-b border-gray-100 hover:border-[#143D60] transition-colors duration-200">
                    <span className="text-sm text-gray-700 group-hover:text-[#143D60] transition-colors duration-200 font-medium">
                      {cat.label}
                    </span>
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#143D60] group-hover:translate-x-0.5 transition-all duration-200"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400 tracking-wide">
                  Gear shared by verified UFV students and staff.
                </p>
                <Link href="/browse" onClick={() => setBrowseOpen(false)}
                  className="text-xs font-semibold text-[#143D60] tracking-wider uppercase hover:opacity-60 transition-opacity duration-200">
                  View all →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COMMUNITY MEGA MENU ── */}
      {communityOpen && (
        <div
          className="fixed top-0 left-0 right-0 z-40"
          style={{ paddingTop: scrolled ? "56px" : "80px" }}
          onMouseEnter={openCommunity}
          onMouseLeave={closeCommunity}
        >
          <div className="bg-white border-b border-gray-100 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="mx-auto max-w-7xl px-6 py-10">
              <p className="text-xs tracking-[0.25em] uppercase text-gray-400 mb-8">Community</p>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                {communityLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setCommunityOpen(false)}
                    className="group flex items-center justify-between py-3 border-b border-gray-100 hover:border-[#143D60] transition-colors duration-200"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-[#143D60] transition-colors duration-200 font-medium">
                      {link.label}
                    </span>
                    <svg
                      className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#143D60] group-hover:translate-x-0.5 transition-all duration-200"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400 tracking-wide">
                  Share trip reports, gear tips, and stories with the UFV community.
                </p>
                <Link
                  href="/community"
                  onClick={() => setCommunityOpen(false)}
                  className="text-xs font-semibold text-[#143D60] tracking-wider uppercase hover:opacity-60 transition-opacity duration-200"
                >
                  View all →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-6 py-6 flex flex-col gap-1">
            <Link href="/browse" onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-medium text-[#143D60] border-b border-gray-50">Browse gear</Link>
            <Link href="/about" onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-medium text-[#143D60] border-b border-gray-50">About</Link>
            <Link href="/community" onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-medium text-[#143D60] border-b border-gray-50">Community</Link>
            <Link href="/become-owner" onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-medium text-[#143D60] border-b border-gray-50">Become an Owner</Link>
            {user && (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                  className="py-3 text-sm font-medium text-[#143D60] border-b border-gray-50">Dashboard</Link>
                <Link href="/messages" onClick={() => setMobileOpen(false)}
                  className="py-3 text-sm font-medium text-[#143D60] border-b border-gray-50">Messages</Link>
              </>
            )}
            <div className="pt-4 flex flex-col gap-3">
              {user ? (
                <>
                  <Link href={`/profile/${user.id}`} onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-[#143D60] px-4 py-3 text-sm font-medium text-[#143D60] text-center">
                    My profile ({userInitial})
                  </Link>
                  <Link href="/account-settings" onClick={() => setMobileOpen(false)}
                    className="py-3 text-sm text-gray-500 text-center">
                    Account settings
                  </Link>
                  <button onClick={handleSignOut} className="py-3 text-sm text-red-500 text-center">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-[#143D60] px-4 py-3 text-sm font-medium text-[#143D60] text-center">
                    Join Circl
                  </Link>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                    className="py-3 text-sm text-gray-400 text-center">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}