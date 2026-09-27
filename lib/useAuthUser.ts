"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Shared session-check hook — same pattern TopNav already used inline,
 * pulled out so other components (auth-page guards, auth-aware CTAs) don't
 * each reimplement getSession + onAuthStateChange.
 *
 * Returns `undefined` while the initial check is in flight, `null` when
 * signed out, or the User once signed in.
 */
export function useAuthUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return user;
}
