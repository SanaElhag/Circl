import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseForRequest } from "@/lib/supabaseServer";
import { apiError } from "@/lib/apiError";

export async function POST(req: NextRequest) {
  let supabase, user;
  try {
    ({ supabase, user } = await supabaseForRequest(req));
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const { data: userRow, error: fetchErr } = await supabase
      .from("users")
      .select("stripe_account_id, email")
      .eq("id", user.id)
      .single();

    if (fetchErr || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stripe = getStripe();
    let accountId = userRow.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: userRow.email ?? user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      const { error: updateErr } = await supabase
        .from("users")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);
      if (updateErr) {
        return NextResponse.json({ error: "Failed to save Stripe account" }, { status: 500 });
      }
    }

    const origin = req.nextUrl.origin;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: `${origin}/dashboard?stripe=return`,
      refresh_url: `${origin}/dashboard?stripe=refresh`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    return apiError(err, "stripe connect");
  }
}
