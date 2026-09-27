"use client";

import { useState } from "react";
import Link from "next/link";

const CONTACT_EMAIL = "circl@gmail.com";

const TOPICS = [
  { value: "rental",    label: "Rental issue" },
  { value: "listing",   label: "Listing help" },
  { value: "account",   label: "Account & billing" },
  { value: "safety",    label: "Safety concern" },
  { value: "feedback",  label: "Feedback / idea" },
  { value: "other",     label: "Something else" },
];

// Just email for now — no phone line or physical office to list yet.
const CONTACT_CHANNELS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    title: "Email us",
    detail: CONTACT_EMAIL,
    note: "We reply within 24 hours",
    href: `mailto:${CONTACT_EMAIL}`,
    cta: "Send email",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Please enter your name.");
    if (!form.email.trim()) return setError("Please enter your email.");
    if (!form.topic) return setError("Please select a topic.");
    if (!form.message.trim()) return setError("Please write a message.");

    setSubmitting(true);

    // Simulate submit — wire to Supabase or email provider later
    await new Promise((res) => setTimeout(res, 900));
    setSubmitting(false);
    setSubmitted(true);
  }

  const isFormFilled =
    form.name.trim() !== "" &&
    form.email.trim() !== "" &&
    form.topic !== "" &&
    form.message.trim() !== "";

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F9FAFB]">
        {/* Hero */}
        <section className="relative bg-[#143D60] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-36 pb-24" />
        </section>

        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#DDEB9D] flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-9 h-9 text-[#143D60]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">
            Message received
          </p>
          <h2 className="text-2xl font-bold text-[#143D60] tracking-tight mb-3">
            Thanks, {form.name.split(" ")[0]}!
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            We got your message and will get back to you at{" "}
            <span className="font-semibold text-[#143D60]">{form.email}</span>{" "}
            within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="rounded-xl bg-[#143D60] px-6 py-3 text-sm font-bold text-white hover:bg-[#27667B] transition-colors duration-200"
            >
              Back to home
            </Link>
            <Link
              href="/faqs"
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-500 hover:border-[#143D60] hover:text-[#143D60] transition-colors duration-200"
            >
              Browse FAQs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB]">
      {/* ── Hero ── */}
      <section className="relative bg-[#143D60] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#27667B] opacity-30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-[300px] h-[300px] rounded-full bg-[#A0C878] opacity-20 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-36 pb-24">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D] mb-6">
            Get in touch
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Contact us
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-md">
            A question, a concern, or just want to say hi — we&apos;re a small team and we read every message.
          </p>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-[340px_1fr] gap-10 items-start">

          {/* ── Left: contact channels + FAQ nudge ── */}
          <div className="space-y-4">
            {CONTACT_CHANNELS.map((ch) => (
              <a
                key={ch.title}
                href={ch.href}
                target={ch.href.startsWith("http") ? "_blank" : undefined}
                rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-start gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:border-[#27667B] hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-[#DDEB9D] flex items-center justify-center text-[#143D60] flex-shrink-0 group-hover:bg-[#A0C878] transition-colors duration-200">
                  {ch.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#27667B] mb-0.5">
                    {ch.title}
                  </p>
                  <p className="text-sm font-bold text-[#143D60] truncate">{ch.detail}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ch.note}</p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-300 group-hover:text-[#27667B] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}

            {/* FAQ nudge */}
            <div className="rounded-2xl bg-[#143D60] p-5 text-white">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-white/50 mb-2">
                Quick answers
              </p>
              <p className="font-bold text-base leading-snug mb-3">
                Most questions are answered in our FAQs
              </p>
              <Link
                href="/faqs"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#DDEB9D] hover:text-[#A0C878] transition-colors duration-200"
              >
                Browse FAQs
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Response time note */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#A0C878] flex-shrink-0" />
                <p className="text-xs font-semibold text-[#27667B]">Typical response time</p>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                We aim to reply to all messages within <span className="font-semibold text-[#143D60]">24 hours</span> on weekdays. Safety concerns are prioritised and responded to as quickly as possible.
              </p>
            </div>
          </div>

          {/* ── Right: contact form ── */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-7">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-1">
              Send a message
            </p>
            <h2 className="text-xl font-bold text-[#143D60] tracking-tight mb-6">
              We&apos;d love to hear from you
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name + Email row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
                    Your name
                  </label>
                  <input
                    type="text"
                    placeholder="Alex Smith"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    maxLength={80}
                    className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@student.ufv.ca"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent"
                  />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-2.5">
                  What&apos;s this about?
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("topic", t.value)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                        form.topic === t.value
                          ? "bg-[#143D60] text-white border-[#143D60]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-[#143D60] hover:text-[#143D60]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
                  Message
                </label>
                <textarea
                  placeholder="Tell us what's on your mind. The more detail, the faster we can help."
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  rows={5}
                  maxLength={1500}
                  className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent resize-none leading-relaxed"
                />
                <p className="text-[11px] text-gray-300 mt-1 text-right">
                  {form.message.length}/1500
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!isFormFilled || submitting}
                className={`w-full font-bold py-4 rounded-xl text-sm transition-all duration-200 ${
                  !isFormFilled || submitting
                    ? "bg-black opacity-40 text-white cursor-not-allowed"
                    : "bg-[#143D60] text-white hover:bg-[#27667B]"
                }`}
              >
                {submitting ? "Sending…" : "Send message"}
              </button>

              <p className="text-xs text-center text-gray-400">
                By submitting you agree to our{" "}
                <Link href="/privacy" className="text-[#27667B] hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}