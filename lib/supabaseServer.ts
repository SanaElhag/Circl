import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Builds a Supabase client scoped to the caller's own session (from the
 * `Authorization: Bearer <access_token>` header the client sends), so RLS
 * policies apply exactly as they do in the browser. Throws if the token is
 * missing or invalid.
 */
export async function supabaseForRequest(
  req: NextRequest
): Promise<{ supabase: SupabaseClient; user: User }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Missing Authorization header");

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid session");

  return { supabase, user: data.user };
}

/** Service-role client — bypasses RLS. Use only where RLS genuinely can't do the job (webhooks, reading another user's auth data). */
export function supabaseServiceRole(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
