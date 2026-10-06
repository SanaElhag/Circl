"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminShell from "./AdminShell";

// checks you're an admin before showing the dashboard. has to run client
// side since logins are stored in the browser, not a cookie the server can
// read. note this just hides the page - the real protection is the RLS
// policies on the supabase tables themselves
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
