import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseForRequest } from "@/lib/supabaseServer";
import { apiError } from "@/lib/apiError";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, "stripe-connect-status", { max: 20, windowMs: 60_000 });
  if (limited) return limited;

  let supabase, user;
  try {
    ({ supabase, user } = await supabaseForRequest(req));
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const { data: userRow } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    const accountId = userRow?.stripe_account_id as string | null;
    if (!accountId) {
      return NextResponse.json({ chargesEnabled: false });
    }

    const stripe = getStripe();
    const account = await stripe.v2.core.accounts.retrieve(accountId);
    // v2's equivalent of v1's charges_enabled for a recipient-only account:
    // can it actually receive transfers from us yet
    const chargesEnabled = account.configuration?.recipient?.capabilities?.stripe_balance
      ?.stripe_transfers?.status === "active";

    // .select() so a silently-blocked write (see fix_users_self_update.sql)
    // shows up in logs instead of looking like it worked - this value gates
    // whether create-payment-intent will let anyone book this owner at all,
    // so if it never actually saves, onboarding "finishing" doesn't unlock
    // real bookings even though Stripe itself is fully set up
    const { data: savedRows, error: cacheErr } = await supabase
      .from("users")
      .update({ stripe_charges_enabled: chargesEnabled })
      .eq("id", user.id)
      .select("id");
    if (cacheErr || !savedRows || savedRows.length === 0) {
      console.error("[api] stripe connect status: failed to cache stripe_charges_enabled for", user.id, cacheErr?.message);
    }

    return NextResponse.json({ chargesEnabled });
  } catch (err) {
    return apiError(err, "stripe connect status");
  }
}
