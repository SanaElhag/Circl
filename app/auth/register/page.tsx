"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { passwordMeetsPolicy, firstUnmetRule } from "@/lib/password";
import PasswordStrength from "@/app/components/PasswordStrength";

const ALLOWED_DOMAINS = ["student.ufv.ca", "ufv.ca"];

function isUFVEmail(email: string) {
  const lower = email.toLowerCase().trim();
  return ALLOWED_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}

function validate(fullName: string, email: string, password: string, confirmPassword: string): string | null {
  if (!fullName.trim())               return "Please enter your full name.";
  if (!email.trim())                  return "Please enter your email address.";
  if (!isUFVEmail(email))             return "Please use your UFV email address (@student.ufv.ca or @ufv.ca).";
  if (!password)                      return "Please enter a password.";
  if (!passwordMeetsPolicy(password)) {
    const rule = firstUnmetRule(password);
    return rule ? `Password needs ${rule.label.toLowerCase()}.` : "Please choose a stronger password.";
  }
  if (password !== confirmPassword)   return "The two passwords don't match.";
  return null;
}

export default function RegisterPage() {
  const [fullName,        setFullName]        = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [submitted,       setSubmitted]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate(fullName, email, password, confirmPassword);
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const { error: supaErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          // Without this the confirmation link points at whatever "Site URL" is
          // set in the Supabase dashboard — usually localhost.
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (supaErr) {
        if (supaErr.message.includes("already registered"))
          setError("An account with this email already exists. Try signing in instead.");
        else setError(supaErr.message);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const filled = fullName.trim() !== "" && email.trim() !== "" && password !== "" && confirmPassword !== "";

  /* ── Confirmation screen ── */
  if (submitted) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-[45%] bg-[#143D60] flex-col justify-between px-14 py-16 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#27667B]/40 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#DDEB9D]/10 blur-2xl" />
          <Link href="/" className="relative text-white font-bold tracking-[0.25em] uppercase text-base hover:opacity-70 transition-opacity">Circl</Link>
          <div className="relative space-y-4">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D]/70">Almost there</p>
            <h1 className="text-4xl font-bold text-white leading-tight">One last step.</h1>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">Check your inbox and click the confirmation link to activate your account.</p>
          </div>
          <div className="relative h-6" />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 py-16 bg-[#F9FAFB]">
          <div className="w-full max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-[#DDEB9D] flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#143D60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[#143D60] mb-3">Check your inbox</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-2">
              We sent a confirmation link to
            </p>
            <p className="font-bold text-[#143D60] mb-6">{email}</p>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Click the link in the email to activate your account. If you don&apos;t see it, check your spam folder.
            </p>
            <button
              onClick={async () => {
                await supabase.auth.resend({
                  type: "signup",
                  email: email.trim().toLowerCase(),
                  options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                });
              }}
              className="text-sm font-semibold text-[#27667B] hover:text-[#143D60] transition-colors underline underline-offset-2 mb-6 block mx-auto"
            >
              Resend confirmation email
            </button>
            <Link
              href="/auth/login"
              className="inline-block bg-[#143D60] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Registration form ── */
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
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D]/70">Join the community</p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Borrow more.<br />Own less.
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            Rent outdoor gear from fellow UFV students and staff. Free to join, easy to use.
          </p>
          <div className="space-y-3 pt-2">
            {[
              "Access hundreds of pieces of gear",
              "List your own gear and earn",
              "Build trust in your community",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#DDEB9D]/20 border border-[#DDEB9D]/30 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-[#DDEB9D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <div className="w-9 h-9 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-sm shrink-0">C</div>
            <div>
              <p className="text-white text-sm font-semibold">UFV community only</p>
              <p className="text-white/40 text-xs mt-0.5">Requires a @student.ufv.ca or @ufv.ca email</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 bg-[#F9FAFB]">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden block text-[#143D60] font-bold tracking-[0.25em] uppercase text-sm mb-10 hover:opacity-70 transition-opacity">
            Circl
          </Link>

          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-3">Create account</p>
          <h2 className="text-3xl font-bold text-[#143D60] mb-8">Join Circl</h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#143D60]">Full name</label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Alex Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#27667B] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#143D60]">UFV email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@student.ufv.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#27667B] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#143D60]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-14 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#27667B] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-[#143D60] transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#143D60]">Confirm password</label>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:border-transparent transition-all ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-300 focus:ring-red-300"
                    : "border-gray-200 focus:ring-[#27667B]"
                }`}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-red-500">Passwords don&apos;t match.</p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!filled || loading}
              className="w-full bg-[#143D60] text-white font-bold rounded-xl py-3.5 text-sm hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-bold text-[#143D60] hover:text-[#27667B] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
