"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// floating "list gear" button so posting is never more than one click away,
// no matter what page you're on. desktop only — mobile already has the
// same shortcut built into the bottom nav's Post button.
export default function PostGearFab() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth") || pathname.startsWith("/post-gear")) return null;

  return (
    <Link
      href="/post-gear"
      title="List Gear"
      className="hidden md:flex fixed bottom-6 right-6 z-40 items-center justify-center w-14 h-14 rounded-full bg-[#143D60] text-white shadow-[0_8px_24px_rgba(20,61,96,0.35)] hover:bg-[#27667B] hover:shadow-[0_10px_28px_rgba(20,61,96,0.4)] hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-[#143D60] px-3 py-1.5 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        List Gear
      </span>
    </Link>
  );
}
