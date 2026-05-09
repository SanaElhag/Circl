"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: supabaseError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (supabaseError) {
        if (supabaseError.message.includes("Invalid login credentials")) {
          setError("Incorrect email or password. Please try again.");
        } else if (supabaseError.message.includes("Email not confirmed")) {
          setError("Please verify your email before signing in.");
        } else {
          setError(supabaseError.message);
        }
        return;
      }

      // Login succeeded — send them home
      router.push("/");
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const isFormFilled = formData.email.trim() !== "" && formData.password !== "";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold tracking-tight">Sign in to Circl</h1>
      <p className="mt-1 text-sm text-gray-600">
        Use your UFV email to access the platform.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            UFV email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@student.ufv.ca"
            value={formData.email}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {/* Label and forgot password link sit on the same row */}
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-gray-500 hover:text-black"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-black/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-black"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Error — with inline resend option if email isn't verified */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            {error.includes("verify your email") && (
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.resend({
                    type: "signup",
                    email: formData.email.trim().toLowerCase(),
                  });
                  setError("Verification email resent — check your inbox.");
                }}
                className="ml-2 underline hover:no-underline"
              >
                Resend email
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormFilled || loading}
          className={`mt-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity
            ${!isFormFilled || loading
              ? "bg-black opacity-40 cursor-not-allowed"
              : "bg-black hover:opacity-90"
            }`}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="font-medium text-black hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}