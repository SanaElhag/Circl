"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "circl_cookie_consent";

export type ConsentChoice = "accepted" | "necessary-only";

// reads back whatever the person picked, so we can check it later before
// loading anything like analytics
export function getCookieConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "accepted" || raw === "necessary-only" ? raw : null;
  } catch {
    // private browsing or storage blocked, just treat it as no choice yet
    return null;
  }
}

// banner that shows on first visit explaining we only use local storage to
// keep you signed in, nothing else yet. both buttons do the same thing for
// now since there's nothing extra to turn on/off - see /cookies

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) setVisible(true);
  }, []);

  function choose(choice: ConsentChoice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // can't save it if storage is blocked, just hide it for this visit
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      // bottom-20 on mobile so it sits above the floating nav bar, not on top of it
      className="fixed bottom-20 md:bottom-0 inset-x-0 z-[60] p-4 sm:p-6"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <div className="mx-auto max-w-3xl rounded-2xl bg-[#143D60] shadow-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-white/70 leading-relaxed flex-1">
          We use local storage to keep you signed in, that&apos;s it today, no tracking or ad
          cookies.{" "}
          <Link href="/cookies" className="text-[#DDEB9D] underline underline-offset-2 hover:text-white transition-colors duration-200">
            Read the details
          </Link>
        </p>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => choose("necessary-only")}
            className="flex-1 sm:flex-none text-xs font-semibold text-white/70 border border-white/20 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors duration-200"
          >
            Necessary only
          </button>
          <button
            onClick={() => choose("accepted")}
            className="flex-1 sm:flex-none text-xs font-bold text-[#143D60] bg-[#DDEB9D] px-4 py-2.5 rounded-xl hover:bg-[#A0C878] transition-colors duration-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
