"use client";

import { useState } from "react";
import Link from "next/link";

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  general: {
    label: "General",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  renters: {
    label: "For Renters",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  owners: {
    label: "For Owners",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  payments: {
    label: "Payments & Billing",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  safety: {
    label: "Safety & Damage",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  account: {
    label: "Account & Privacy",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
};

const CATEGORY_ORDER = ["general", "renters", "owners", "payments", "safety", "account"];

const FAQS: Faq[] = [
  // General
  { id: "g1", category: "general", question: "What is Circl?", answer: "Circl is a peer-to-peer outdoor gear rental marketplace. It connects people who own gear they're not using with people who want to try or borrow gear for their next adventure, without the cost of buying new." },
  { id: "g2", category: "general", question: "Is Circl available across Canada?", answer: "Yes! Circl is available to users across Canada. You can browse and list gear from anywhere in the country." },
  { id: "g3", category: "general", question: "Do I need an account to use the platform?", answer: "You need an account to rent or list gear. Browsing listings is open to everyone, but submitting a rental request or posting gear requires a free account." },
  { id: "g4", category: "general", question: "Is it free to sign up?", answer: "Yes, creating an account is completely free. We charge small service fees on transactions, which are disclosed at the time of booking." },

  // Renters
  { id: "r1", category: "renters", question: "How do I rent gear?", answer: "Browse listings, find the gear you need, and submit a rental request with your desired dates. The owner will review your request and accept or decline. Once accepted, you'll receive confirmation and any pickup instructions." },
  { id: "r2", category: "renters", question: "What happens if the gear is not as described?", answer: "If the gear you receive is significantly different from what was listed, contact us immediately. We take listing accuracy seriously and will work with you to resolve the issue, which may include a refund." },
  { id: "r3", category: "renters", question: "Can I extend my rental?", answer: "Rental extensions are subject to the owner's availability. Contact the owner directly through the platform as early as possible if you need more time. Do not hold onto gear past your agreed return date without confirmation." },
  { id: "r4", category: "renters", question: "What if I need to cancel my rental?", answer: "Cancellations are subject to our Cancellation Policy. We recommend reviewing it before booking. In general, cancellations made well in advance are more likely to receive a refund." },
  { id: "r5", category: "renters", question: "Am I covered if something goes wrong during my rental?", answer: "You are responsible for the gear during the rental period. We strongly recommend having appropriate personal insurance (e.g. tenant's or home insurance) that covers borrowed property. See our Safety & Damage section for more details." },

  // Owners
  { id: "o1", category: "owners", question: "How do I list my gear?", answer: "Go to your dashboard and click \"Post Gear.\" Fill in the title, category, condition, description, price per day, and photos. Once submitted, your listing will be live and visible to renters immediately." },
  { id: "o2", category: "owners", question: "How do I set my price?", answer: "You set your own price per day. A good rule of thumb is to charge 5–10% of the gear's retail value per day. Check similar listings on the platform to stay competitive." },
  { id: "o3", category: "owners", question: "Can I pause or remove my listing?", answer: "Yes. You can toggle your listing's availability on and off at any time from your dashboard. You can also permanently remove a listing, but note this cannot be undone." },
  { id: "o4", category: "owners", question: "What happens if a renter damages my gear?", answer: "Renters are responsible for returning gear in the same condition they received it. If damage occurs, document it with photos and contact us right away. We will help facilitate a resolution between you and the renter." },
  { id: "o5", category: "owners", question: "Do I have to accept every request?", answer: "No. You review every rental request and can accept or decline at your discretion. You can also include a message to the renter when responding." },

  // Payments
  { id: "p1", category: "payments", question: "How do I get paid as an owner?", answer: "Payments are processed securely through our payment provider. Once a rental is completed, earnings are released to you according to our payout schedule. You'll need to set up your payout details in your account settings." },
  { id: "p2", category: "payments", question: "What fees does Circl charge?", answer: "We charge a small service fee on each transaction. The exact fee is shown at checkout before you confirm a booking. We believe in transparent pricing, no surprises." },
  { id: "p3", category: "payments", question: "What currencies are supported?", answer: "All transactions are processed in Canadian dollars (CAD)." },
  { id: "p4", category: "payments", question: "Are payments secure?", answer: "Yes. All payments are processed through our certified third-party payment provider using industry-standard encryption. We never store your full card details on our servers." },
  { id: "p5", category: "payments", question: "What is the refund policy?", answer: "Refunds depend on the circumstances of the cancellation or issue. Renters who cancel in advance may be eligible for a full or partial refund per our Cancellation Policy. If there is a dispute about gear condition, contact our support team." },

  // Safety
  { id: "s1", category: "safety", question: "What condition should listed gear be in?", answer: "All gear must be safe, functional, and accurately described. Owners must not list gear with known safety defects. If you receive gear that appears unsafe, do not use it and contact us immediately." },
  { id: "s2", category: "safety", question: "What happens if gear is lost or stolen?", answer: "Renters are responsible for the gear from pickup to return. If gear is lost or stolen during the rental period, the renter may be liable for the replacement cost. We recommend checking your personal insurance coverage before renting." },
  { id: "s3", category: "safety", question: "Does Circl provide insurance?", answer: "Circl does not currently provide insurance coverage for rentals. Both owners and renters are encouraged to verify that their personal insurance (home, tenant's, or activity-specific) covers peer-to-peer gear rentals." },
  { id: "s4", category: "safety", question: "How do I report a safety concern?", answer: "If you encounter a safety issue with a listing, a user, or a rental, please contact us immediately through the Contact page. Safety reports are treated as a priority." },

  // Account
  { id: "a1", category: "account", question: "How do I update my profile?", answer: "You can update your name, profile photo, and other account details from your dashboard settings." },
  { id: "a2", category: "account", question: "How do I delete my account?", answer: "To delete your account, please contact us at our support email. We will process your request and delete your personal data in accordance with our Privacy Policy, subject to any legal retention requirements." },
  { id: "a3", category: "account", question: "Who can see my personal information?", answer: "Other users can see your public profile (name, photo, ratings, and listings). Your contact details and private messages are never shared publicly. See our Privacy Policy for full details." },
  { id: "a4", category: "account", question: "How does Circl use my data?", answer: "We use your data to operate the platform, facilitate rentals, and improve our service. We do not sell your personal information. Full details are in our Privacy Policy." },
  { id: "a5", category: "account", question: "How do I report another user?", answer: "You can report a user by contacting us through the Contact page. Provide as much detail as possible. All reports are reviewed by our team." },
];

// ── Accordion item ─────────────────────────────────────────────────────────────

function AccordionItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${open ? "border-[#143D60] bg-white shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold text-[#143D60] text-sm leading-snug">{faq.question}</span>
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${open ? "bg-[#143D60] text-white rotate-45" : "bg-gray-100 text-gray-400"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="h-px bg-gray-100 mb-4" />
          <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = FAQS.filter((f) => {
    const matchesCategory = activeCategory === "all" || f.category === activeCategory;
    const matchesSearch   = search.trim() === "" ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const grouped = CATEGORY_ORDER.reduce<Record<string, Faq[]>>((acc, cat) => {
    const items = filtered.filter((f) => f.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#F9FAFB]">

      {/* ── Hero ── */}
      <section className="relative bg-[#143D60] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#27667B] opacity-30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-[300px] h-[300px] rounded-full bg-[#A0C878] opacity-20 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-36 pb-24 text-center">
          <div className="flex justify-start mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D] mb-6">Help centre</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
            Frequently asked questions
          </h1>
          <div className="relative max-w-md mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 transition-all duration-200"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors duration-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-10">

          {/* ── Sticky category nav ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl bg-white border border-gray-100 shadow-sm p-3">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#27667B] mb-3 px-2">Categories</p>
              <nav className="space-y-0.5">
                <button onClick={() => setActiveCategory("all")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${activeCategory === "all" ? "bg-[#143D60] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  All questions
                </button>
                {CATEGORY_ORDER.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${activeCategory === cat ? "bg-[#143D60] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                      <span className="flex-shrink-0">{meta?.icon}</span>
                      {meta?.label ?? cat}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* ── Mobile category pills ── */}
          <div className="lg:hidden -mx-4 px-4 overflow-x-auto col-span-full">
            <div className="flex gap-2 pb-2 w-max">
              <button onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeCategory === "all" ? "bg-[#143D60] text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
                All
              </button>
              {CATEGORY_ORDER.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${activeCategory === cat ? "bg-[#143D60] text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
                  {CATEGORY_META[cat]?.label ?? cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── FAQ content ── */}
          <div className="lg:col-span-3 space-y-10">
            {search && (
              <p className="text-sm text-gray-400">
                {filtered.length === 0
                  ? `No results for "${search}"`
                  : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${search}"`}
              </p>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm mb-4">No questions found.</p>
                <button onClick={() => { setSearch(""); setActiveCategory("all"); }}
                  className="text-sm font-semibold text-[#27667B] underline underline-offset-2">
                  Clear filters
                </button>
              </div>
            )}

            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                {activeCategory === "all" && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#DDEB9D] flex items-center justify-center text-[#143D60]">
                      {CATEGORY_META[cat]?.icon}
                    </div>
                    <h2 className="font-bold text-[#143D60] text-base">
                      {CATEGORY_META[cat]?.label ?? cat}
                    </h2>
                  </div>
                )}
                <div className="space-y-3">
                  {items.map((faq) => <AccordionItem key={faq.id} faq={faq} />)}
                </div>
              </div>
            ))}

            {filtered.length > 0 && (
              <div className="rounded-2xl bg-[#143D60] p-6 text-center">
                <p className="font-bold text-white mb-1">Still have questions?</p>
                <p className="text-sm text-white/60 mb-4">Our team is happy to help.</p>
                <Link href="/contact"
                  className="inline-block bg-[#DDEB9D] text-[#143D60] font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200">
                  Contact us
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}