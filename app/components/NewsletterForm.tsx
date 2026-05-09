"use client";

// This is the only part of the homepage that needs "use client"
// because it has useState for the email input and subscribed state.
// Extracting it here lets the rest of the homepage be a Server Component.

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // We'll wire this to Supabase later to store emails
    setSubscribed(true);
  }

  if (subscribed) {
    return (
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-8 py-8">
        <p className="font-semibold text-white text-lg">You are on the list.</p>
        <p className="mt-2 text-sm text-white/40">We will be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@student.ufv.ca"
        className="flex-1 rounded-xl bg-white/8 border border-white/15 px-5 py-3.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors duration-200"
      />
      <button
        type="submit"
        className="rounded-xl bg-[#DDEB9D] px-6 py-3.5 text-sm font-bold text-[#143D60] hover:bg-[#A0C878] transition-colors duration-200 shrink-0"
      >
        Subscribe
      </button>
    </form>
  );
}