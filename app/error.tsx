"use client";

import { useEffect } from "react";
import Link from "next/link";

// catches a page crashing so people see this instead of a blank/broken screen
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // just logs for now, hook up Sentry or similar later
    console.error("Unhandled error in route segment:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        <p className="font-display text-[96px] font-black text-[#E8DFCE] leading-none select-none">
          !
        </p>
        <h1 className="text-2xl font-bold text-[#143D60] mt-2 mb-3">
          Something went wrong.
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-10">
          That&apos;s on us, not you. Try again, or head back home — nothing you
          were doing has been lost.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-[#143D60] text-white font-bold px-7 py-3.5 rounded-xl hover:bg-[#27667B] transition-colors duration-200 text-sm"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-[#143D60] text-[#143D60] font-bold px-7 py-3.5 rounded-xl hover:bg-[#143D60] hover:text-white transition-all duration-200 text-sm"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
