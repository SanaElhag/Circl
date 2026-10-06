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
    const account = await stripe.accounts.retrieve(accountId);
    const chargesEnabled = !!account.charges_enabled;

    await supabase.from("users").update({ stripe_charges_enabled: chargesEnabled }).eq("id", user.id);

    return NextResponse.json({ chargesEnabled });
  } catch (err) {
    return apiError(err, "stripe connect status");
  }
}
