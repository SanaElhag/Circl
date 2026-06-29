import Link from "next/link";
import Image from "next/image";
import {
  HERO_IMAGE, STORY_IMAGE,
  HERO, PROBLEM, VALUES_SECTION, values,
  TIMELINE_SECTION, milestones,
  TEAM_SECTION, team,
  IMPACT_SECTION, impactCards,
  CTA,
} from "./content";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#143D60]">

      {/* Hero */}
<section className="bg-[#F5F0E8]">
  <div className="grid lg:grid-cols-[1fr_1.2fr] min-h-[85vh]">

    {/* Left — text */}
    <div className="flex flex-col justify-center px-12 xl:px-20 py-24">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B5E4E] hover:text-[#143D60] transition-colors duration-200 mb-8">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>
      <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#27667B] mb-6">{HERO.eyebrow}</p>
      <h1 className="text-[clamp(40px,5vw,68px)] font-bold text-[#143D60] leading-[1.05] tracking-tight mb-7">{HERO.heading}</h1>
      <p className="text-[17px] text-[#6B5E4E] max-w-md leading-relaxed mb-10">{HERO.subheading}</p>
      <div className="flex gap-3 flex-wrap">
        <Link href="/auth/register" className="rounded-full bg-[#143D60] px-7 py-3.5 text-[13px] font-semibold text-white hover:bg-[#27667B] transition-colors duration-200">
          Join Circl
        </Link>
        <Link href="/browse" className="rounded-full border border-[#143D60] px-7 py-3.5 text-[13px] font-semibold text-[#143D60] hover:bg-[#143D60] hover:text-white transition-all duration-200">
          Browse Gear
        </Link>
      </div>
    </div>

    {/* Right — image, full height */}
    <div className="relative hidden lg:block">
      <Image src={HERO_IMAGE} alt="BC mountains" fill className="object-cover object-center" priority />
      <div className="absolute inset-0 bg-gradient-to-r from-[#F5F0E8]/20 to-transparent" />
    </div>

  </div>
</section>

      {/* Problem */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-5">{PROBLEM.eyebrow}</p>
              <h2 className="text-4xl font-bold tracking-tight leading-tight mb-8">{PROBLEM.heading}</h2>
              <div className="space-y-6 text-base text-gray-600 leading-relaxed">
                {PROBLEM.paragraphs.map((p, i) => (
                  <p key={i} className={i === PROBLEM.paragraphs.length - 1 ? "font-semibold text-[#143D60]" : ""}>{p}</p>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative h-[540px] rounded-2xl overflow-hidden shadow-2xl">
                <Image src={STORY_IMAGE} alt="Outdoor gear" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#143D60]/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5">
                    <p className="text-white/50 text-xs uppercase tracking-[0.2em] font-semibold mb-1">The gap we closed</p>
                    <p className="text-white font-bold text-lg leading-snug">{PROBLEM.quoteCard}</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-[#DDEB9D] rounded-2xl p-6 shadow-xl">
                <p className="text-3xl font-bold text-[#143D60]">{PROBLEM.stat.value}</p>
                <p className="text-xs text-[#143D60]/70 font-semibold tracking-wide uppercase mt-1">{PROBLEM.stat.label}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#F9FAFB] py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">{VALUES_SECTION.eyebrow}</p>
            <h2 className="text-4xl font-bold tracking-tight">{VALUES_SECTION.heading}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* 01 Trust — navy, wide */}
            <div className="md:col-span-2 rounded-3xl bg-[#143D60] p-10 relative overflow-hidden flex flex-col justify-between min-h-[280px]">
              <span className="absolute right-0 bottom-0 text-[200px] font-black text-white/[0.04] leading-none select-none pointer-events-none translate-x-6 translate-y-8">{values[0].number}</span>
              <p className="text-[#DDEB9D] text-[10px] font-bold tracking-[0.3em] uppercase">{values[0].title}</p>
              <div>
                <p className="text-white text-2xl font-bold leading-snug max-w-xs mb-3">{values[0].hook}</p>
                <p className="text-white/40 text-sm leading-relaxed max-w-sm">{values[0].body}</p>
              </div>
            </div>

            {/* 02 Sustainability — lime, narrow */}
            <div className="rounded-3xl bg-[#DDEB9D] p-10 relative overflow-hidden flex flex-col justify-between min-h-[280px]">
              <span className="absolute right-0 bottom-0 text-[200px] font-black text-[#143D60]/[0.06] leading-none select-none pointer-events-none translate-x-6 translate-y-8">{values[1].number}</span>
              <p className="text-[#143D60]/50 text-[10px] font-bold tracking-[0.3em] uppercase">{values[1].title}</p>
              <div>
                <p className="text-[#143D60] text-xl font-bold leading-snug mb-3">{values[1].hook}</p>
                <p className="text-[#143D60]/50 text-sm leading-relaxed">{values[1].body}</p>
              </div>
            </div>

            {/* 03 Accessibility — warm off-white, narrow */}
            <div className="rounded-3xl bg-[#F5F0E8] p-10 relative overflow-hidden flex flex-col justify-between min-h-[280px]">
              <span className="absolute right-0 bottom-0 text-[200px] font-black text-[#143D60]/[0.05] leading-none select-none pointer-events-none translate-x-6 translate-y-8">{values[2].number}</span>
              <p className="text-[#27667B] text-[10px] font-bold tracking-[0.3em] uppercase">{values[2].title}</p>
              <div>
                <p className="text-[#143D60] text-xl font-bold leading-snug mb-3">{values[2].hook}</p>
                <p className="text-[#143D60]/50 text-sm leading-relaxed">{values[2].body}</p>
              </div>
            </div>

            {/* 04 Community — teal, wide */}
            <div className="md:col-span-2 rounded-3xl bg-[#27667B] p-10 relative overflow-hidden flex flex-col justify-between min-h-[280px]">
              <span className="absolute right-0 bottom-0 text-[200px] font-black text-white/[0.04] leading-none select-none pointer-events-none translate-x-6 translate-y-8">{values[3].number}</span>
              <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase">{values[3].title}</p>
              <div>
                <p className="text-white text-2xl font-bold leading-snug max-w-xs mb-3">{values[3].hook}</p>
                <p className="text-white/40 text-sm leading-relaxed max-w-sm">{values[3].body}</p>
              </div>
            </div>

            {/* 05 Empowerment — full width, navy with lime hook */}
            <div className="md:col-span-3 rounded-3xl bg-[#143D60] p-10 relative overflow-hidden">
              <span className="absolute right-0 bottom-0 text-[220px] font-black text-white/[0.03] leading-none select-none pointer-events-none translate-x-8 translate-y-10">{values[4].number}</span>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 relative">
                <div className="max-w-xl">
                  <p className="text-[#DDEB9D]/60 text-[10px] font-bold tracking-[0.3em] uppercase mb-5">{values[4].title}</p>
                  <p className="text-[#DDEB9D] text-3xl font-bold leading-snug">{values[4].hook}</p>
                </div>
                <p className="text-white/40 text-sm leading-relaxed md:max-w-xs">{values[4].body}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-[#143D60] py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#DDEB9D]/60 mb-4">{TIMELINE_SECTION.eyebrow}</p>
            <h2 className="text-4xl font-bold text-white tracking-tight">{TIMELINE_SECTION.heading}</h2>
          </div>
          <div className="relative">
            <div className="absolute top-[22px] left-0 right-0 h-px bg-white/10 hidden md:block" />
            <div className="grid md:grid-cols-5 gap-6 md:gap-0 relative">
              {milestones.map((m, i) => (
                <div key={m.year} className="relative md:pr-8">
                  <div className="flex items-center gap-3 md:block mb-3 md:mb-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10 ${
                      m.year === "Next" ? "bg-[#DDEB9D] text-[#143D60] ring-4 ring-[#DDEB9D]/30"
                      : m.year === "Now" ? "bg-[#27667B] text-white"
                      : "bg-white/10 text-white/60"
                    }`}>
                      {i + 1}
                    </div>
                  </div>
                  <p className={`text-xs font-bold tracking-[0.15em] uppercase mb-1 ${m.year === "Next" ? "text-[#DDEB9D]" : "text-white/40"}`}>
                    {m.year}
                  </p>
                  <p className="text-white font-bold leading-snug text-sm">{m.label}</p>
                  <p className="text-white/40 text-xs mt-1 leading-snug">{m.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">{TEAM_SECTION.eyebrow}</p>
            <h2 className="text-4xl font-bold tracking-tight">{TEAM_SECTION.heading}</h2>
            <p className="mt-4 text-gray-500 leading-relaxed">{TEAM_SECTION.subheading}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((person) => (
              <div key={person.name} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-[#DDEB9D] flex items-center justify-center text-2xl font-bold text-[#143D60] mb-6">
                  {person.initial}
                </div>
                <h3 className="text-lg font-bold text-[#143D60]">{person.name}</h3>
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#27667B] mt-0.5 mb-4">{person.role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{person.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="bg-[#F9FAFB] py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">{IMPACT_SECTION.eyebrow}</p>
            <h2 className="text-4xl font-bold tracking-tight">{IMPACT_SECTION.heading}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {impactCards.map((card) => (
              <div key={card.title} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <h3 className="text-lg font-bold text-[#143D60] mb-3">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#143D60] py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D]/60 mb-5">{CTA.eyebrow}</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-6">{CTA.heading}</h2>
          <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto mb-12">{CTA.subheading}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register"
              className="rounded-xl bg-[#DDEB9D] px-8 py-4 text-sm font-bold text-[#143D60] hover:bg-[#A0C878] transition-colors duration-200">
              {CTA.primaryButton}
            </Link>
            <Link href="/browse"
              className="rounded-xl border border-white/20 px-8 py-4 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200">
              {CTA.secondaryButton}
            </Link>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/30">
            <Link href="/contact" className="hover:text-white/60 transition-colors duration-200">Get in touch</Link>
            <span className="hidden sm:block">·</span>
            <Link href="/faqs" className="hover:text-white/60 transition-colors duration-200">Read the FAQs</Link>
            <span className="hidden sm:block">·</span>
            <Link href="/community" className="hover:text-white/60 transition-colors duration-200">Visit the community</Link>
          </div>
        </div>
      </section>

    </main>
  );
}