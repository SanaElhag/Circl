import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for public, read-only, server-rendered pages (homepage,
 * gear detail, community). Every query it makes goes through Next's fetch
 * cache with a short revalidate window, instead of hitting the database on
 * every single page load.
 *
 * Before this, these pages either baked data in at build time (stale until
 * the next deploy) or used `export const dynamic = "force-dynamic"` (fresh,
 * but a DB round trip on every request). This is the middle ground: data is
 * at most `revalidateSeconds` old, and most requests in that window are
 * served from Next's cache with no DB hit at all.
 *
 * Supabase-js issues its requests with `fetch` under the hood, and accepts a
 * custom fetch implementation — so we inject Next's cache options through it.
 * Mutations (anything owner/borrower-facing) should keep using the plain
 * browser client from "@/lib/supabase" — this is for read-only public data.
 */
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
