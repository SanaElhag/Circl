import Link from "next/link";
import { LAST_UPDATED, COMPANY_NAME, CONTACT_EMAIL, PREAMBLE, sections } from "./content";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB]">

      {/* Hero */}
      <section className="relative bg-[#143D60] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#27667B] opacity-30 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-36 pb-24">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D] mb-6">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">Terms & Conditions</h1>
          <p className="text-white/60 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-10">

          {/* Sticky TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#27667B] mb-4">Contents</p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`}
                    className="block text-xs text-gray-500 hover:text-[#143D60] py-1 transition-colors duration-200 leading-snug">
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3 space-y-10">

            {/* Preamble */}
            <div className="rounded-2xl bg-[#FAFFF5] border border-[#DDEB9D] p-5">
              <p className="text-sm text-[#143D60] leading-relaxed">
                <strong>Please read these Terms carefully before using {COMPANY_NAME}.</strong> {PREAMBLE}
              </p>
            </div>

            {sections.map((s) => (
              <div key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-lg font-bold text-[#143D60] mb-4 pb-3 border-b border-gray-100">
                  {s.title}
                </h2>
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-3">

                  {"intro" in s && s.intro && <p>{s.intro}</p>}

                  {"paragraphs" in s && s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}

                  {"items" in s && s.items && (
                    <ul className="space-y-1.5 pl-5">
                      {s.items.map((item, i) => (
                        <li key={i} className="list-disc text-gray-600">{item}</li>
                      ))}
                    </ul>
                  )}


                  {"footer" in s && s.footer && <p>{s.footer}</p>}

                  {"address" in s && s.address && (
                    <p>
                      <strong>{s.address.name}</strong><br />
                      {s.address.location}<br />
                      <a href={`mailto:${s.address.email}`}
                        className="text-[#27667B] underline underline-offset-2 hover:text-[#143D60] transition-colors duration-200">
                        {s.address.email}
                      </a>
                    </p>
                  )}

                </div>
              </div>
            ))}

            {/* Footer note */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-400">
                These Terms & Conditions were last updated on {LAST_UPDATED}. For previous versions, please contact us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#27667B] hover:underline">{CONTACT_EMAIL}</a>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}