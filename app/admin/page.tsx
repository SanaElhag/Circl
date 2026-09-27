"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminShell from "./AdminShell";

/**
 * Admin gate.
 *
 * This used to be a server component reading the session from cookies via
 * @supabase/ssr — but the rest of the app signs in with the plain supabase-js
 * browser client, which keeps the session in localStorage and never sets a
 * cookie. The server therefore saw no session and bounced every admin to
 * /auth/login. The check runs client-side so it sees the same session
 * everything else does.
 *
 * This gate only hides the UI. What actually protects admin data is RLS on the
 * Supabase tables — make sure the write policies check the caller's role.
 */
export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/login?redirect=/admin");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role, full_name, email")
        .eq("id", session.user.id)
        .single();

      if (cancelled) return;

      if (!userData || userData.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setAdmin({ name: userData.full_name, email: userData.email });
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="w-12 h-12 rounded-full border-2 border-[#143D60]/20 border-t-[#143D60] animate-spin" />
      </div>
    );
  }

  return <AdminShell adminName={admin.name} adminEmail={admin.email} />;
}
