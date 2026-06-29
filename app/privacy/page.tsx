import Link from "next/link";
import { LAST_UPDATED, CONTACT_EMAIL, PREAMBLE, sections } from "./content";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB]">

      {/* Hero */}
      <section className="relative bg-[#143D60] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#27667B] opacity-30 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-36 pb-24">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D] mb-6">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">Privacy Policy</h1>
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
                <strong>Your privacy matters to us.</strong> {PREAMBLE}
              </p>
            </div>

            {sections.map((s) => (
              <div key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-lg font-bold text-[#143D60] mb-4 pb-3 border-b border-gray-100">
                  {s.title}
                </h2>
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-3">

                  {/* Intro line */}
                  {"intro" in s && s.intro && <p>{s.intro}</p>}

                  {/* Plain paragraphs */}
                  {"paragraphs" in s && s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}

                  {/* Flat bullet list */}
                  {"items" in s && s.items && (
                    <ul className="space-y-1.5 pl-5">
                      {s.items.map((item, i) => (
                        <li key={i} className="list-disc text-gray-600">{item}</li>
                      ))}
                    </ul>
                  )}

                  {/* Subsections — heading + body paragraph OR heading + items */}
                  {"subsections" in s && s.subsections?.map((sub, i) => (
                    <div key={i}>
                      <p className="font-semibold text-[#143D60]">{sub.heading}</p>
                      {"body" in sub && sub.body && <p>{sub.body}</p>}
                      {"items" in sub && sub.items && (
                        <ul className="space-y-1.5 pl-5 mt-1">
                          {sub.items.map((item, j) => (
                            <li key={j} className="list-disc text-gray-600">{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  {/* Footer paragraph */}
                  {"footer" in s && s.footer && <p>{s.footer}</p>}

                  {/* Address block */}
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

            {/* Related links */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#27667B] mb-4">Related policies</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/terms"
                  className="text-sm font-semibold border border-[#143D60] text-[#143D60] px-4 py-2 rounded-xl hover:bg-[#143D60] hover:text-white transition-all duration-200">
                  Terms & Conditions
                </Link>
                <Link href="/contact"
                  className="text-sm font-semibold border border-gray-200 text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200">
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Footer note */}
            <div className="text-center">
              <p className="text-xs text-gray-400">
                Last updated {LAST_UPDATED} · Questions? Email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#27667B] hover:underline">{CONTACT_EMAIL}</a>
              </p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}