"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { passwordMeetsPolicy, firstUnmetRule, PASSWORD_MIN_LENGTH } from "@/lib/password";
import PasswordStrength from "@/app/components/PasswordStrength";

export default function ResetPasswordPage() {
  const router = useRouter();

  // "checking" until the recovery token in the URL hash has been exchanged for
  // a session by detectSessionInUrl; "invalid" if it never arrives.
  const [stage,    setStage]    = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    let settled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !settled) { settled = true; setStage("ready"); }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !settled) { settled = true; setStage("ready"); }
    });

    const timeout = setTimeout(() => {
      if (!settled) { settled = true; setStage("invalid"); }
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordMeetsPolicy(password)) {
      const rule = firstUnmetRule(password);
      setError(rule ? `Password needs ${rule.label.toLowerCase()}.` : "Please choose a stronger password.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) { setError(err.message); return; }
      setStage("done");
      setTimeout(() => router.replace("/dashboard"), 1800);
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
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D]/70">Almost done</p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Choose a new<br />password.
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            Pick something you don&apos;t use anywhere else. At least {PASSWORD_MIN_LENGTH} characters.
          </p>
        </div>

        <div className="relative h-6" />
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 bg-[#F9FAFB]">
        <div className="w-full max-w-md mx-auto">

          <Link href="/" className="lg:hidden block text-[#143D60] font-bold tracking-[0.25em] uppercase text-sm mb-10 hover:opacity-70 transition-opacity">
            Circl
          </Link>

          {stage === "checking" && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#143D60]/20 border-t-[#143D60] animate-spin mx-auto mb-6" />
              <p className="text-sm text-gray-500">Checking your reset link…</p>
            </div>
          )}

          {stage === "invalid" && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#143D60] mb-3">This link has expired</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                Reset links last an hour and can only be used once. Request a fresh one.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-block bg-[#143D60] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200"
              >
                Send a new link
              </Link>
            </div>
          )}

          {stage === "done" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#DDEB9D] flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#143D60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-[#143D60] mb-3">Password updated</h2>
              <p className="text-sm text-gray-500">Taking you to your dashboard…</p>
            </div>
          )}

          {stage === "ready" && (
            <>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-3">Reset password</p>
              <h2 className="text-3xl font-bold text-[#143D60] mb-8">Set a new password</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#143D60]">New password</label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-14 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#27667B] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-[#143D60] transition-colors"
                    >
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#143D60]">Confirm new password</label>
                  <input
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                  disabled={!password || !confirm || loading}
                  className="w-full bg-[#143D60] text-white font-bold rounded-xl py-3.5 text-sm hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
