"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// page the email confirmation link sends people to. supabase puts the
// login tokens in the url and it takes a moment to pick them up, so we
// wait for that instead of just checking once and bouncing them to login
export default function AuthCallbackPage() {
  const router = useRouter();
  const [state, setState] = useState<"working" | "failed">("working");

  useEffect(() => {
    let done = false;

    function finish() {
      if (done) return;
      done = true;
      router.replace("/dashboard");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish();
    });

    // if nothing shows up the link was probably already used or expired
    const timeout = setTimeout(() => {
      if (!done) setState("failed");
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-md text-center">
        {state === "working" ? (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-[#143D60]/20 border-t-[#143D60] animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-[#143D60] mb-2">Confirming your account…</h1>
            <p className="text-sm text-gray-500">This only takes a second.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#143D60] mb-3">This link didn&apos;t work</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Confirmation links expire and can only be used once. Sign in to have a
              new one sent to you.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-[#143D60] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200"
            >
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
