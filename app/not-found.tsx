import Link from "next/link";

// shows up for any bad url, or when a listing/page has been deleted
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        <p className="font-display text-[96px] font-black text-[#DDEB9D] leading-none select-none">
          404
        </p>
        <h1 className="text-2xl font-bold text-[#143D60] mt-2 mb-3">
          This page wandered off.
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-10">
          The link might be broken, or whatever was here got moved or deleted.
          Let&apos;s get you back on trail.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#143D60] text-white font-bold px-7 py-3.5 rounded-xl hover:bg-[#27667B] transition-colors duration-200 text-sm"
          >
            Back to home
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center justify-center gap-2 border border-[#143D60] text-[#143D60] font-bold px-7 py-3.5 rounded-xl hover:bg-[#143D60] hover:text-white transition-all duration-200 text-sm"
          >
            Browse gear
          </Link>
        </div>
      </div>
    </main>
  );
}
