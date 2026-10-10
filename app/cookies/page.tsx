import Link from "next/link";

const LAST_UPDATED = "September 27, 2026";

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB]">

      {/* Hero */}
      <section className="relative bg-[#143D60] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#27667B] opacity-30 blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-36 pb-24">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D] mb-6">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">Cookie Policy</h1>
          <p className="text-white/60 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-10">

        <div className="rounded-2xl bg-[#FAFFF5] border border-[#DDEB9D] p-5">
          <p className="text-sm text-[#143D60] leading-relaxed">
            <strong>The short version:</strong> Circl doesn&apos;t use tracking or advertising
            cookies today. This page explains exactly what we do store, and we&apos;ll update
            it, and ask again, before that changes.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#143D60] mb-4 pb-3 border-b border-gray-100">
            What we currently use
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-3">
            <p>
              Signing in keeps you signed in using your browser&apos;s <strong>local storage</strong>,
              not a tracking cookie. It holds your session token so you don&apos;t have to log in on
              every page. It&apos;s essential to the site working and can&apos;t be turned off short of
              signing out.
            </p>
            <p>
              We also save a couple of small local storage preferences, like whether you&apos;ve
              already seen the cookie banner below and dismissed it. Nothing here is used to
              track you across other sites, build an ad profile, or sold to anyone.
            </p>
            <ul className="space-y-1.5 pl-5">
              <li className="list-disc">No advertising or third-party tracking cookies.</li>
              <li className="list-disc">No analytics scripts yet (Google Analytics, Meta Pixel, etc.).</li>
              <li className="list-disc">Payments, when you use them, are handled by Stripe on Stripe&apos;s own
                domain. See their <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener noreferrer" className="text-[#27667B] underline underline-offset-2">cookie policy</a> for what they set during checkout.</li>
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#143D60] mb-4 pb-3 border-b border-gray-100">
            If that changes
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-3">
            <p>
              If we ever add analytics or anything else that isn&apos;t strictly necessary for the
              site to function, we&apos;ll update this page first and ask for your consent again
              before it loads, not bury it in a settings page you&apos;d never find.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#143D60] mb-4 pb-3 border-b border-gray-100">
            Questions
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
            <p>
              Reach us at{" "}
              <a href="mailto:circl@gmail.com" className="text-[#27667B] underline underline-offset-2">
                circl@gmail.com
              </a>
              , or see our{" "}
              <Link href="/privacy" className="text-[#27667B] underline underline-offset-2">Privacy Policy</Link>{" "}
              for how we handle the account information you give us directly.
            </p>
          </div>
        </div>

      </section>
    </main>
  );
}
