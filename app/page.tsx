import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import NewsletterForm from "./components/NewsletterForm";


const HERO_IMAGE   = "/images/hero.jpg";      
const TRUST_IMAGE  = "/images/trust.jpg";     
const PLACEHOLDER_IMAGE = "/images/gear-placeholder.jpg";

const trustPoints = [
  {
    number: "01",
    title: "You choose who rents your gear",
    body: "Every request shows you who's asking. Accept or decline: nothing moves without your say.",
  },
  {
    number: "02",
    title: "Verified UFV community only",
    body: "Every person on Circl is a verified UFV alumni, student, or staff member. Not a stranger — a neighbour.",
  },
  {
    number: "03",
    title: "Plan Your Pickup",
    body: "Set a time and a place that works for you.",
  },
  {
    number: "04",
    title: "Clear status at every step",
    body: "Pending, accepted, declined. You always know exactly where a request stands.",
  },
  {
    number: "05",
    title: "See the bigger picture",
    body: "Track your earnings, monitor your listings, and plan your next move all from your dashboard.",
  },
];

/*We should eventually get these from the db, not hard coded */
const testimonials = [
  {
    quote: "I listed my snowboard during exams and someone rented it for a week. Easiest money I've made as a student.",
    name: "Sarah M.",
    role: "Kinesiology, Year 3",
    initial: "S",
  },
  {
    quote: "Rented a full camping kit for the weekend. Everything was exactly as described. Way better than any gear store.",
    name: "James T.",
    role: "UFV Staff, Recreation",
    initial: "J",
  },
  {
    quote: "Knowing everyone is from UFV made it feel completely safe. Already rented gear three times this semester.",
    name: "Priya K.",
    role: "Environmental Science, Year 2",
    initial: "P",
  },
];
/*Add to db to categories table to be the same in all pages*/
const conditionColors: Record<string, string> = {
  "New":       "bg-[#DDEB9D] text-[#143D60]",
  "Like new":  "bg-[#DDEB9D] text-[#143D60]",
  "Good":      "bg-[#A0C878]/20 text-[#27667B]",
  "Fair":      "bg-[#E8DFCE] text-[#6B5E4E]",
  "Worn":      "bg-[#E8DFCE] text-[#6B5E4E]",
};

async function getFeaturedListings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, category, price_per_day, condition, image_url, description")
    .eq("available", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Failed to fetch featured listings:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function HomePage() {
  const featured = await getFeaturedListings();

  return (
    <div className="bg-[#F5F0E8] text-[#1A1612]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative h-[90vh] min-h-[600px] flex items-end pb-20 overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Hiking in the BC mountains"
          fill
          className="object-cover object-center"
          priority
        />

        {/* Strong left-side overlay so text always pops regardless of image */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Subtle ring decorations */}
        <div className="absolute top-[-100px] right-[-80px] w-[500px] h-[500px] rounded-full border border-[#DDEB9D]/8 pointer-events-none" />
        <div className="absolute top-[40px] right-[60px] w-[320px] h-[320px] rounded-full border border-[#DDEB9D]/5 pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-8">
          <div className="max-w-2xl">

            {/* Eyebrow with rule */}
            <div className="flex items-center gap-7 mb-5">
              <span className="block w-7 h-px bg-[#DDEB9D]" />
              <span className="text-[12px] font-bold tracking-[0.3em] uppercase text-[#DDEB9D]">
                launching Exclusively For UFV Community
              </span>
              <span className="block w-7 h-px bg-[#DDEB9D]" />
            </div>

            <h1 className="font-display text-[clamp(60px,6vw,64px)] font-black leading-[1.06] tracking-[-0.02em] mb-5">
              <span className="text-white drop-shadow-lg">Plan The Trip</span><br />
              <em className="not-italic text-[#DDEB9D] drop-shadow-lg">We&apos;ll Handle The Rest</em>
            </h1>

            <p className="text-[18px] font-medium text-white/90 leading-relaxed max-w-[580px] mb-8 drop-shadow">
              Someone on campus already owns exactly what you need.  Skip the store, borrow from your community instead.
              
            </p>

            <div className="flex gap-3 items-center flex-wrap">
              <Link
                href="/browse/"
                className="rounded-full bg-[#DDEB9D] px-7 py-3.5 text-[15px] font-bold text-[#143D60] hover:bg-[#A0C878] transition-colors duration-200 shadow-lg"
              >
                Browse Gear
              </Link>
              {/* looks kinda weird to me but idk lets see */}
              <Link
                href="/auth/register"
                className="text-[15px] font-semibold text-white hover:text-[#DDEB9D] transition-colors duration-200 flex items-center gap-1.5"
              >
                Create an Account →
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator - do we really need this? keep remove? idk let's see */}
        {/* <div className="absolute bottom-8 right-8 z-10 flex flex-col items-center gap-2">
          <div className="h-10 w-px bg-white/40" />
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/60">Scroll</p>
        </div> */}
      </section>

      
     {/* ── STATS STRIP - Make these real numbers from the db when we have users, bas if the numbers are small balash  */}
      {/* <div className="bg-[#FAF7F2] border-b border-[#D4C9B0]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#D4C9B0]">
            {[
              { value: "55+", label: "Verified members" },
              { value: "10+",  label: "Active listings" },
              { value: "100%", label: "UFV verified" },
              { value: "Free", label: "To join" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center px-6 py-6">
                <span className="font-display text-[28px] font-bold text-[#143D60] tracking-tight leading-none">
                  {stat.value}
                </span>
                <span className="mt-1.5 text-[10px] font-medium tracking-[0.18em] uppercase text-[#6B5E4E]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* ── FEATURED TODAY - no need to edit this comes from db */}
      <section className="bg-[#F5F0E8] py-24">
        <div className="mx-auto max-w-7xl px-7 sm:px-8">

          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[#27667B]">Just listed</span>
                <span className="block w-8 h-px bg-[#27667B]" />
              </div>
              <h1 className="font-display text-[40px] font-bold tracking-tight text-[#143D60] leading-tight">
                Gear for this <em className="not-italic text-[#27667B]">Season</em>
              </h1>
              <p className="mt-2 text-[17px] text-[#6B5E4E]">
                {featured.length > 0 ? "Fresh gear from your UFV community." : "Be the first to list your gear."}
              </p>
            </div>
            <Link
              href="/browse"
              className="hidden sm:flex items-center gap-1.5 text-[17px] font-semibold text-[#27667B] hover:text-[#143D60] transition-colors duration-200 shrink-0 pb-1"
            >
              View all listings →
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-[#D4C9B0] bg-[#FAF7F2]">
              <p className="text-[#6B5E4E] text-sm mb-5">No listings yet — check back soon.</p>
              <Link
                href="/post-gear"
                className="inline-block rounded-full bg-[#143D60] px-7 py-3.5 text-[13px] font-semibold text-white hover:bg-[#27667B] transition-colors duration-200"
              >
                List your gear first
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item) => (
                <div
                  key={item.id}
                  className="group bg-[#FAF7F2] border border-[#D4C9B0] rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(20,61,96,0.12)] transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#E8DFCE]">
                    <Image
                      src={item.image_url ?? PLACEHOLDER_IMAGE}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                    {/* Category pill */}
                    <span className="absolute top-3 right-3 rounded-full bg-[#143D60]/70 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold text-white capitalize tracking-wide">
                      {item.category}
                    </span>
                    {/* Condition pill */}
                    {item.condition && (
                      <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold ${conditionColors[item.condition] ?? "bg-[#E8DFCE] text-[#6B5E4E]"}`}>
                        {item.condition}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <p className="font-semibold text-[#143D60] text-[14px] leading-snug mb-1.5">{item.title}</p>
                    {item.description && (
                      <p className="text-[12px] text-[#6B5E4E] line-clamp-2 leading-relaxed mb-4">{item.description}</p>
                    )}
                    <div className="flex-1" />
                    <div className="pt-4 border-t border-[#E8DFCE] flex items-center justify-between">
                      <span className="font-display text-[20px] font-bold text-[#143D60] leading-none">
                        ${item.price_per_day}
                        <span className="font-sans text-[12px] font-normal text-[#6B5E4E]"> / day</span>
                      </span>
                      <Link
                        href={`/gear/${item.id}`}
                        className="text-[11px] font-semibold text-[#27667B] hover:text-[#143D60] transition-colors duration-200"
                      >
                        Learn more
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#FAF7F2] py-24" id="how">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">

          <div className="mb-12">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[#27667B]">Simple by design</span>
              <span className="block w-8 h-px bg-[#27667B]" />
            </div>
            <h2 className="font-display text-[40px] font-bold tracking-tight text-[#143D60] leading-tight">
              Three steps to your <em className="not-italic text-[#27667B]">next trip.</em>
            </h2>
          </div>

          {/* Three-column bordered grid */}
          <div className="grid md:grid-cols-3 border border-[#D4C9B0] rounded-2xl overflow-hidden">
            {[
              { step: "01", title: "Create your account", body: "Sign up with your UFV email. Takes under a minute. UFV students, alumni, staff, and faculty only." },
              { step: "02", title: "Find the gear you need", body: "Browse listings by category, price, and condition. Choose your dates, and send your request." },
              { step: "03", title: "Plan your pickup", body: "Once accepted, chat with the owner, agree on a meeting spot, and pick up your gear." },
            ].map((s, i) => (
              <div key={s.step} className={`p-10 bg-[#FAF7F2] ${i < 2 ? "border-b md:border-b-0 md:border-r border-[#D4C9B0]" : ""}`}>
                <p className="font-display text-[44px] font-bold text-[#E8DFCE] leading-none mb-5">{s.step}</p>
                <h3 className="font-semibold text-[14px] text-[#143D60] mb-3 leading-snug">{s.title}</h3>
                <p className="text-[13px] text-[#6B5E4E] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/auth/register"
              className="rounded-full bg-[#143D60] px-8 py-4 text-[13px] font-semibold text-white hover:bg-[#27667B] transition-colors duration-200"
            >
              Get started for free
            </Link>
          </div>
        </div>
      </section>


      {/* ── PROMO BANNER - we can edit this now, eventually we'll add to the db and have the admin/mod edit it without access to the code */}
      <section className="bg-[#143D60] py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-0">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[12px] font-semibold tracking-[0.28em] uppercase text-[#DDEB9D]/70">Expand the Circle!</span>
                <span className="block w-6 h-px bg-[#DDEB9D]/50" />
              </div>
              <h2 className="font-display text-[32px] md:text-[38px] font-bold text-white leading-[1.12] tracking-tight whitespace-nowrap">
                Friends who borrow together, save together :) <br />
                <em className="not-italic text-[#DDEB9D]"> Invite one, get $5 off.</em>
              </h2>
              {/* <p className="mt-4 text-white/50 text-[14px] leading-relaxed max-w-sm">
                Create your account today and your first rental is automatically
                discounted. No code needed, no fine print.
              </p> */}
            </div>
            <div className="shrink-0">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#DDEB9D] px-10 py-4 text-[13px] font-bold text-[#143D60] hover:bg-[#A0C878] transition-colors duration-200"
              >
                Invite Code  →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST - this is just the laout, edit content on top*/}
      <section className="bg-[#FAF7F2] py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-start">

            {/* Left — trust points */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[#27667B]">For gear owners</span>
                <span className="block w-8 h-px bg-[#27667B]" />
              </div>
              <h2 className="font-display text-[34px] font-bold tracking-tight text-[#143D60] leading-tight mb-6">
                List with <em className="not-italic text-[#27667B]">confidence.</em>
              </h2>

              <div className="flex flex-col gap-4">
                {trustPoints.map((point) => (
                  <div key={point.number} className="flex gap-6">
                    <span className="font-display text-[25px] font-bold text-[#D4C9B0] shrink-0 min-w-[28px] pt-0.5">
                      {point.number}
                    </span>
                    <div>
                      <p className="font-semibold text-[20px] text-[#143D60] mb-2 leading-snug">{point.title}</p>
                      <p className="text-[15px] text-[#6B5E4E] leading-relaxed">{point.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/become-owner"
                className="inline-flex items-center gap-2 mt-12 rounded-full border border-[#143D60] px-7 py-3.5 text-[13px] font-semibold text-[#143D60] hover:bg-[#143D60] hover:text-white transition-all duration-200"
              >
                Start listing your gear →
              </Link>
            </div>

            {/* Right — image card with stats */}
            <div className="relative h-[520px] rounded-2xl overflow-hidden shadow-xl">
              <Image src={TRUST_IMAGE} alt="Outdoor adventure in BC" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071a2c]/85 via-[#071a2c]/30 to-transparent" />

              {/* Stats overlay at bottom -- we can remove these for now cause it's a lie lol */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { value: "55", label: "Subscribers" },
                    { value: "10+",  label: "Listings" },
                    { value: "100%", label: "Verified" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="font-display text-[26px] font-bold text-white leading-none">{stat.value}</p>
                      <p className="text-[9px] tracking-[0.2em] uppercase text-white/45 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-5">
                  <p className="text-[13px] text-white/60 leading-relaxed italic">
                    &ldquo;I listed my snowboard during exams and someone rented it for a week. Easiest money I&apos;ve made as a student.&rdquo;
                  </p>
                  <p className="text-[11px] text-white/35 mt-2 font-medium not-italic">
                    Sarah M. — Kinesiology, Year 3
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS - just layout edit content on top*/}
      {/* <section className="bg-[#F5F0E8] py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">

          <div className="mb-14">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[#27667B]">From the community</span>
              <span className="block w-8 h-px bg-[#27667B]" />
            </div>
            <h2 className="font-display text-[34px] font-bold tracking-tight text-[#143D60] leading-tight">
              Real stories <em className="not-italic text-[#27667B]">from UFV.</em>
            </h2>
            <p className="mt-2 text-[13px] text-[#6B5E4E]">Placeholder reviews — real ones on the way.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-[#FAF7F2] border border-[#D4C9B0] rounded-2xl p-8 flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
              >
      
                <span className="font-display text-[52px] text-[#DDEB9D] leading-none mb-4 block select-none">&ldquo;</span>
                <p className="text-[13px] text-[#6B5E4E] leading-[1.75] flex-1">{t.quote}</p>
                <div className="mt-8 pt-5 border-t border-[#E8DFCE] flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#143D60] flex items-center justify-center text-[12px] font-bold text-[#DDEB9D] shrink-0">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#143D60]">{t.name}</p>
                    <p className="text-[11px] text-[#6B5E4E]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── HOW IT WORKS -- we can edit this here, but we should move this up eh? do we even need this? */}
      
      {/* ── NEWSLETTER ──────────────────────────────────────────── */}
      <section className="bg-[#143D60] py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[#DDEB9D]/60 mb-4">
              Stay informed
            </p>
            <h2 className="font-display text-[30px] font-bold text-white tracking-tight mb-3">
              Join the Circl.
            </h2>
            <p className="text-white/45 text-[14px] leading-relaxed mb-8">
              New listings, seasonal guides, and campus events,  straight to your inbox. No spam, ever.
            </p>
            <NewsletterForm />
            <p className="mt-5 text-[10px] text-white/20 tracking-wide">
              By subscribing you agree to our privacy policy.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}