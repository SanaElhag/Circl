import Link from "next/link";

export default function BecomeOwnerPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Back button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#143D60] transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">
            Gear owners
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-[#143D60]">
            Start earning from your gear
          </h1>
          <p className="mt-3 text-gray-500 leading-relaxed max-w-xl">
            Your skis sit in storage eight months a year. Your tent hasn&apos;t seen a campsite since last summer.
            List it on Circl and let someone else enjoy it — while you earn.
          </p>
        </div>

        <div className="space-y-6">

          {/* ── SECTION 1: List gear — fully live ── */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#A0C878]" />
                <span className="text-xs font-semibold text-[#27667B] uppercase tracking-wider">Live now</span>
              </div>
              <h2 className="text-xl font-bold text-[#143D60]">List your gear</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-md">
                Post your outdoor gear in under two minutes. Set your price, upload photos, and
                start receiving rental requests from verified UFV students and staff.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { title: "You control everything", body: "Review every request before accepting. No surprises." },
                { title: "Set your own price",     body: "You decide the daily rate. Change it any time." },
                { title: "Campus pickup only",     body: "All handoffs happen on UFV campus. Safe and simple." },
              ].map((item) => (
                <div key={item.title} className="bg-[#F9FAFB] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#143D60] mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>

            <a
              href="/post-gear"
              className="inline-flex items-center gap-2 bg-[#143D60] text-white font-bold px-6 py-3.5 rounded-xl hover:bg-[#27667B] transition-colors duration-200 text-sm"
            >
              Post your first listing →
            </a>
          </div>

          {/* ── SECTION 2: Stripe payouts — coming soon ── */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 opacity-75">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Coming soon</span>
                </div>
                <h2 className="text-xl font-bold text-[#143D60]">Stripe-powered payouts</h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-md">
                  Automatic earnings deposited straight to your bank. We&apos;re finishing Stripe Connect
                  integration — once live, every completed rental pays out automatically with no chasing required.
                </p>
              </div>
              <span className="flex-shrink-0 text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-full">
                Phase 2
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { title: "Automatic payouts",    body: "Earnings land in your account after each completed rental." },
                { title: "Platform fee: 15%",    body: "We take 15% to keep the platform running. You keep the rest." },
                { title: "Full earnings history", body: "Track every rental and payout from your dashboard." },
              ].map((item) => (
                <div key={item.title} className="bg-[#F9FAFB] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#143D60] mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-[#DDEB9D] rounded-full" />
              </div>
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">65% complete</span>
            </div>
            <p className="text-xs text-gray-400">
              Want to be notified when payouts launch?{" "}
              <a href="mailto:hello@circl.ca" className="text-[#27667B] hover:underline">
                Get in touch
              </a>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}