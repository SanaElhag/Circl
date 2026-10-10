import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseForRequest } from "@/lib/supabaseServer";
import { apiError } from "@/lib/apiError";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "stripe-connect", { max: 5, windowMs: 60_000 });
  if (limited) return limited;

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
    const origin = req.nextUrl.origin;
    // stripe rejects localhost as a business url, so only pass it on a real
    // deployment - onboarding just asks for it manually while testing locally
    const isPublicOrigin = !origin.includes("localhost") && !origin.includes("127.0.0.1");

    let accountId = userRow.stripe_account_id as string | null;
    let appliedConfigurations: string[];

    if (!accountId) {
      // v1 accounts.create (type: "express") is deprecated for new Connect
      // integrations - this is the v2 equivalent. owners only ever receive
      // transfers from a platform-created payment intent here (they never
      // process a charge directly), so "recipient" is the only capability
      // that's actually needed - but stripe still requires an mcc (industry
      // code) and a business url for underwriting even on recipient-only
      // accounts, so those are pre-filled here instead of asking every owner
      const account = await stripe.v2.core.accounts.create({
        contact_email: userRow.email ?? user.email ?? undefined,
        dashboard: "express",
        // Circl is UFV/BC-only for now, so Canada is a safe default here.
        // entity_type is set so onboarding skips straight to personal info
        // instead of asking "are you a business or an individual" - owners
        // here are students renting out their own gear, not registered businesses
        identity: { country: "CA", entity_type: "individual" },
        // this account only ever receives transfers, never processes its own
        // charges, so the platform (not Stripe) carries fee/loss responsibility
        defaults: {
          currency: "cad",
          responsibilities: { fees_collector: "application", losses_collector: "application" },
          profile: {
            product_description: "Peer-to-peer outdoor gear rental between UFV students via Circl",
            ...(isPublicOrigin ? { business_url: origin } : {}),
          },
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
          // mcc alone, no capabilities requested here - this isn't turning
          // the account into a merchant, just satisfying the required
          // industry classification (7394 = equipment rental & leasing)
          merchant: { mcc: "7394" },
        },
      });
      accountId = account.id;
      appliedConfigurations = account.applied_configurations;

      // .select() so we can tell a real save from RLS silently blocking it
      // (Supabase reports success with zero rows affected either way) -
      // this exact gap is why onboarding used to create a fresh Stripe
      // account on every click, the id was never actually sticking
      const { data: savedRows, error: updateErr } = await supabase
        .from("users")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id)
        .select("id");
      if (updateErr || !savedRows || savedRows.length === 0) {
        return NextResponse.json({ error: "Failed to save Stripe account" }, { status: 500 });
      }
    } else {
      // existing account (e.g. created before the mcc/merchant addition) -
      // the link's configurations has to match whatever's actually applied,
      // so look it up instead of assuming
      const existing = await stripe.v2.core.accounts.retrieve(accountId);
      appliedConfigurations = existing.applied_configurations;
    }

    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: appliedConfigurations,
          return_url: `${origin}/dashboard?stripe=return`,
          refresh_url: `${origin}/dashboard?stripe=refresh`,
        },
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    return apiError(err, "stripe connect");
  }
}
