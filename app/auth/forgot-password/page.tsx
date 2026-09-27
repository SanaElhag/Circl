"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      );
      // Deliberately don't surface "no such user" — that would let anyone probe
      // which UFV emails have accounts. Always show the same confirmation.
      if (err && !/user not found/i.test(err.message)) {
        setError(err.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — brand ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#143D60] flex-col justify-between px-14 py-16 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#27667B]/40 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#DDEB9D]/10 blur-2xl" />

        <Link href="/" className="relative text-white font-bold tracking-[0.25em] uppercase text-base hover:opacity-70 transition-opacity">
          Circl
        </Link>

        <div className="relative space-y-6">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D]/70">Account recovery</p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Happens to<br />everyone.
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            Enter your UFV email and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        <div className="relative h-6" />
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 bg-[#F9FAFB]">
        <div className="w-full max-w-md mx-auto">

          <Link href="/" className="lg:hidden block text-[#143D60] font-bold tracking-[0.25em] uppercase text-sm mb-10 hover:opacity-70 transition-opacity">
            Circl
          </Link>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#DDEB9D] flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#143D60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-[#143D60] mb-3">Check your inbox</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                If an account exists for
              </p>
              <p className="font-bold text-[#143D60] mb-6">{email.trim().toLowerCase()}</p>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                we&apos;ve sent a password reset link. It expires in an hour — check your
                spam folder if it doesn&apos;t show up.
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-[#143D60] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-3">Forgot password</p>
              <h2 className="text-3xl font-bold text-[#143D60] mb-3">Reset your password</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                We&apos;ll email you a link to choose a new one.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#143D60]">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@student.ufv.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#27667B] focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={email.trim() === "" || loading}
                  className="w-full bg-[#143D60] text-white font-bold rounded-xl py-3.5 text-sm hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Remembered it?{" "}
                <Link href="/auth/login" className="font-bold text-[#143D60] hover:text-[#27667B] transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
