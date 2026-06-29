"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { supabase } from "@/lib/supabase";

interface BookingCardProps {
  listingId: string;
  ownerId: string;
  pricePerDay: number;
  available: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
}

export default function BookingCard({
  listingId,
  ownerId,
  pricePerDay,
  available,
  availableFrom,
  availableUntil,
}: BookingCardProps) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [note, setNote] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check auth client-side — server-side auth with anon key is unreliable
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setAuthLoading(false);
    });
  }, []);


  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fromDate = availableFrom ? new Date(availableFrom + "T12:00:00") : today;
  const toDate = availableUntil ? new Date(availableUntil + "T12:00:00") : undefined;

  function toYMD(d: Date) {
    return d.toISOString().split("T")[0];
  }

  const days =
    range?.from && range?.to
      ? Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86400000))
      : 0;

  const subtotal = pricePerDay * days;

  function handleCheckout() {
    if (!range?.from || !range?.to) return;

    const params = new URLSearchParams({
      listing: listingId,
      start: toYMD(range.from),
      end: toYMD(range.to),
    });
    if (note.trim()) params.set("note", note.trim());

    if (!userId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/checkout/${listingId}?${params.toString()}`)}`);
      return;
    }

    router.push(`/checkout/${listingId}?${params.toString()}`);
  }

  // Wait for auth to resolve before deciding — avoids flash of wrong state
  if (authLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center h-24">
        <div className="w-5 h-5 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Owner sees a simple "this is your listing" card
  const isOwner = userId === ownerId;
  if (isOwner) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-gray-500 text-center">This is your listing.</p>
      </div>
    );
  }

  // Gear is unavailable
  if (!available) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          <span className="text-sm font-semibold">Not available right now</span>
        </div>
        <p className="text-xs text-gray-400">The owner has marked this gear as unavailable.</p>
      </div>
    );
  }

  const isLoggedIn = !!userId;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-[#143D60]">${pricePerDay.toFixed(2)}</span>
        <span className="text-gray-400 text-sm">/ day</span>
      </div>

      {/* Date picker */}
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">
          Select Dates
        </p>
        <div className="border border-gray-100 rounded-xl overflow-hidden flex justify-center">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={[
              { before: fromDate },
              ...(toDate ? [{ after: toDate }] : []),
            ]}
            startMonth={fromDate}
          />
        </div>
      </div>

      {/* Note to owner */}
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">
          Note to Owner (optional)
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any questions or context for the owner..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#27667B] resize-none"
        />
      </div>

      {days > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{days} {days === 1 ? "day" : "days"}</span>
          <span className="font-semibold text-[#143D60]">${subtotal.toFixed(2)}</span>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={!range?.from || !range?.to}
        className="w-full bg-[#DDEB9D] text-[#143D60] font-bold rounded-xl py-4 hover:bg-[#A0C878] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoggedIn ? "Request to Rent" : "Sign In to Request"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        No charges until pick-up is confirmed.
      </p>
    </div>
  );
}