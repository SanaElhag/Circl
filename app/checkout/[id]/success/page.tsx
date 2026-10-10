"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const params = useSearchParams();

  const requestId = params.get("request") ?? "";
  const ref = params.get("ref") ?? "—";
  const listingTitle = params.get("listing") ?? "Your rental";
  const days = params.get("days") ?? "—";
  const total = params.get("total") ?? "—";
  const paid = params.get("paid") !== "0";
  const startDate = params.get("start") ?? "";
  const endDate = params.get("end") ?? "";

  function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d + "T12:00:00").toLocaleDateString("en-CA", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <header className="bg-white border-b border-gray-100 h-16 flex items-center px-6">
        <Link href="/" className="text-[#143D60] font-bold tracking-[0.2em] uppercase text-sm">CIRCL</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full">

          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#DDEB9D] flex items-center justify-center">
              <svg className="w-9 h-9 text-[#143D60]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">Request Sent</p>
            <h1 className="text-3xl font-bold text-[#143D60] tracking-tight mb-3">You&apos;re all set!</h1>
            <p className="text-gray-500 leading-relaxed">
              Your rental request has been sent to the owner. You&apos;ll be notified as soon as they respond, typically within 24 hours.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">Confirmation Details</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Rental</span>
                <span className="font-semibold text-[#143D60] text-right max-w-[60%] truncate">{listingTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pick-up</span>
                <span className="font-semibold text-[#143D60]">{formatDate(startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Return</span>
                <span className="font-semibold text-[#143D60]">{formatDate(endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold text-[#143D60]">{days} {days === "1" ? "day" : "days"}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-gray-500">{paid ? "Total (incl. fees + tax)" : "Estimated cost"}</span>
                <span className="font-bold text-[#143D60]">${total} CAD</span>
              </div>
            </div>

            {!paid && (
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                Online payment isn&apos;t set up for this listing yet. This amount isn&apos;t charged through Circl. Arrange payment with the owner directly once they accept.
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Rental ID</span>
                <code className="text-xs font-mono bg-gray-50 text-[#27667B] px-2 py-1 rounded-xl border border-gray-100">
                  {requestId ? requestId.slice(0, 8).toUpperCase() : "—"}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Reference</span>
                <code className="text-xs font-mono bg-gray-50 text-[#27667B] px-2 py-1 rounded-xl border border-gray-100">
                  {ref}
                </code>
              </div>
            </div>
          </div>

          <div className="bg-[#143D60] rounded-2xl p-5 mb-6 text-white">
            <p className="text-sm leading-relaxed text-white/80">
              Once the owner accepts, head over to{" "}
              <span className="text-[#DDEB9D] font-semibold">My Rentals</span>{" "}
              to coordinate pick-up details, track your rental, and confirm receipt when you have the gear in hand.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="w-full text-center bg-[#143D60] text-white font-bold rounded-xl py-4 hover:bg-[#27667B] transition-colors duration-200">
              Go to My Rentals
            </Link>
            <Link href="/browse" className="w-full text-center border border-[#143D60] text-[#143D60] font-semibold rounded-xl py-3 hover:bg-[#143D60] hover:text-white transition-all duration-200 text-sm">
              Keep Browsing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#143D60] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}