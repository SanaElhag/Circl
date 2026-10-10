import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { supabaseServiceRole } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    // Stripe isn't configured — nothing to verify against. 500 so Stripe
    // retries later instead of disabling the endpoint after a 4xx.
    console.error("[api] stripe webhook: Stripe not configured:", err);
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let supabase: ReturnType<typeof supabaseServiceRole>;
  try {
    supabase = supabaseServiceRole();
  } catch (err) {
    console.error("[api] stripe webhook: service role not configured:", err);
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    switch (event.type) {
      // connected accounts are created through the v2 Accounts API now
      // (see app/api/stripe/connect/route.ts), which doesn't fire this v1
      // event - v2 uses a separate Event Destinations / Thin Events system
      // that isn't wired up here. the real-time status update instead
      // happens via the direct check in connect/status/route.ts, which
      // DashboardShell calls right when someone returns from onboarding.
      // left in case any pre-migration v1 accounts still exist.
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await supabase
          .from("users")
          .update({ stripe_charges_enabled: !!account.charges_enabled })
          .eq("stripe_account_id", account.id);
        break;
      }

      // Safety net: reconciles a hold that expired or was refunded outside our own
      // accept/decline/cancel route (e.g. Stripe auto-voids an old uncaptured hold).
      case "payment_intent.canceled":
      case "charge.refunded": {
        const object = event.data.object as Stripe.PaymentIntent | Stripe.Charge;
        const paymentIntentId =
          typeof (object as Stripe.Charge).payment_intent === "string"
            ? ((object as Stripe.Charge).payment_intent as string)
            : (object as Stripe.PaymentIntent).id;

        const newPaymentStatus = event.type === "charge.refunded" ? "refunded" : "canceled";

        const { data: existing } = await supabase
          .from("requests")
          .select("id, status, payment_status")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();

        if (existing && existing.payment_status !== newPaymentStatus) {
          const patch: Record<string, string> = { payment_status: newPaymentStatus };
          if (event.type === "payment_intent.canceled" && existing.status === "pending") {
            patch.status = "cancelled";
          }
          await supabase.from("requests").update(patch).eq("id", existing.id);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // 500 so Stripe retries the event instead of treating it as permanently
    // failed — a transient Supabase error here shouldn't silently drop it.
    console.error("[api] stripe webhook: handler failed:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
