"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthUser } from "@/lib/useAuthUser";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const user = useAuthUser();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);

  // Already signed in — there's nothing to do on this page but leave.
  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, redirect, router]);

  if (user === undefined || user) {
    return <div className="min-h-screen bg-[#F9FAFB]" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (err) {
        if (err.message.includes("Invalid login credentials")) setError("Incorrect email or password. Please try again.");
        else if (err.message.includes("Email not confirmed"))   setError("Please verify your email before signing in.");
        else setError(err.message);
        return;
      }
      router.push(redirect);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const filled = email.trim() !== "" && password !== "";

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
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D]/70">Welcome back</p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Your gear,<br />your community.
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            Sign in to manage your rentals, messages, and listings, all in one place.
          </p>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <div className="w-9 h-9 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-sm shrink-0">C</div>
            <div>
              <p className="text-white text-sm font-semibold">UFV students &amp; staff only</p>
              <p className="text-white/40 text-xs mt-0.5">Use your @student.ufv.ca or @ufv.ca email</p>
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

          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-3">Sign in</p>
          <h2 className="text-3xl font-bold text-[#143D60] mb-8">Welcome back</h2>

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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#143D60]">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-[#27667B] hover:text-[#143D60] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
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
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
                {error.includes("verify your email") && (
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase() });
                      setError("Verification email resent. Check your inbox.");
                    }}
                    className="ml-2 underline font-semibold hover:no-underline"
                  >
                    Resend email
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!filled || loading}
              className="w-full bg-[#143D60] text-white font-bold rounded-xl py-3.5 text-sm hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-bold text-[#143D60] hover:text-[#27667B] transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB]" />}>
      <LoginForm />
    </Suspense>
  );
}
