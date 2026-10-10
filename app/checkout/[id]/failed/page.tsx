"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function FailedContent() {
  const params = useSearchParams();

  const listingId = params.get("listing") ?? "";
  const startDate = params.get("start") ?? "";
  const endDate = params.get("end") ?? "";
  const note = params.get("note") ?? "";
  const reason = params.get("reason") ?? null;

  const retryUrl = `/checkout/${listingId}?listing=${listingId}&start=${startDate}&end=${endDate}${note ? `&note=${encodeURIComponent(note)}` : ""}`;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <header className="bg-white border-b border-gray-100 h-16 flex items-center px-6">
        <Link href="/" className="text-[#143D60] font-bold tracking-[0.2em] uppercase text-sm">CIRCL</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full">

          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-9 h-9 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-red-400 mb-2">Request Failed</p>
            <h1 className="text-3xl font-bold text-[#143D60] tracking-tight mb-3">Something went wrong</h1>
            <p className="text-gray-500 leading-relaxed">
              We weren&apos;t able to send your rental request. Your rental details have been saved, just try again below.
            </p>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-red-400 mb-2">
              {reason ? "Error Details" : "What may have happened"}
            </p>
            {reason ? (
              <p className="text-sm text-red-700">{reason}</p>
            ) : (
              <ul className="text-sm text-red-700 space-y-1">
                <li>• A temporary network issue interrupted the request.</li>
                <li>• The listing may have become unavailable.</li>
                <li>• Your session may have expired.</li>
              </ul>
            )}
          </div>

          {(startDate || endDate) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-3">Your Rental Details (Preserved)</p>
              <div className="space-y-2 text-sm">
                {startDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pick-up</span>
                    <span className="font-semibold text-[#143D60]">
                      {new Date(startDate + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
                {endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Return</span>
                    <span className="font-semibold text-[#143D60]">
                      {new Date(endDate + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
                {note && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your note</span>
                    <span className="text-gray-600 text-right max-w-[60%] text-xs">{note}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {listingId ? (
              <Link href={retryUrl} className="w-full text-center bg-[#DDEB9D] text-[#143D60] font-bold rounded-xl py-4 hover:bg-[#A0C878] transition-colors duration-200">
                Try Again
              </Link>
            ) : (
              <Link href="/browse" className="w-full text-center bg-[#DDEB9D] text-[#143D60] font-bold rounded-xl py-4 hover:bg-[#A0C878] transition-colors duration-200">
                Back to Browse
              </Link>
            )}
            {listingId && (
              <Link href={`/gear/${listingId}`} className="w-full text-center border border-[#143D60] text-[#143D60] font-semibold rounded-xl py-3 hover:bg-[#143D60] hover:text-white transition-all duration-200 text-sm">
                Back to Listing
              </Link>
            )}
            <Link href="/browse" className="w-full text-center text-sm text-gray-400 hover:text-[#27667B] py-2 transition-colors">
              Browse other gear
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#143D60] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FailedContent />
    </Suspense>
  );
}