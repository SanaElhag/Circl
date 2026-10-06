import { createClient } from "@supabase/supabase-js";

// supabase client for pages that just read public data (home, gear page,
// community). caches results for a bit so we're not hitting the db on
// every single page load. for anything that writes data, keep using the
// normal client from "@/lib/supabase"
export function supabasePublic(revalidateSeconds = 60) {
  const seconds = Number.isFinite(revalidateSeconds) && revalidateSeconds >= 0 ? revalidateSeconds : 60;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input, init) => fetch(input, { ...init, next: { revalidate: seconds } }),
      },
    }
  );
}
