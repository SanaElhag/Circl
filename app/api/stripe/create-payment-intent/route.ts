import { NextRequest, NextResponse } from "next/server";
import { getStripe, computeAmounts } from "@/lib/stripe";
import { supabaseForRequest } from "@/lib/supabaseServer";
import { apiError } from "@/lib/apiError";

function diffDays(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export async function POST(req: NextRequest) {
  let supabase, user;
  try {
    ({ supabase, user } = await supabaseForRequest(req));
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const { listingId, startDate, endDate, note } = await req.json();
    if (!listingId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing listing or dates" }, { status: 400 });
    }

    const { data: listing, error: listingErr } = await supabase
      .from("listings")
      .select("id, title, price_per_day, user_id")
      .eq("id", listingId)
      .single();

    if (listingErr || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.user_id === user.id) {
      return NextResponse.json({ error: "You can't book your own listing" }, { status: 400 });
    }

    const { data: owner, error: ownerErr } = await supabase
      .from("users")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", listing.user_id)
      .single();

    if (ownerErr || !owner || !owner.stripe_account_id || !owner.stripe_charges_enabled) {
      return NextResponse.json(
        { error: "This owner hasn't finished setting up payouts yet." },
        { status: 400 }
      );
    }

    const days = diffDays(startDate, endDate);
    const { subtotal, platformFee, gst, pst, total } = computeAmounts(listing.price_per_day, days);
    const totalCents = Math.round(total * 100);
    const applicationFeeCents = Math.round((platformFee + gst + pst) * 100);

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "cad",
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFeeCents,
      transfer_data: { destination: owner.stripe_account_id },
      metadata: {
        listingId: listing.id,
        listingTitle: listing.title,
        requesterId: user.id,
        ownerId: listing.user_id,
        startDate,
        endDate,
        note: (note ?? "").slice(0, 400),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amountTotalCents: totalCents,
      subtotal,
      platformFee,
      gst,
      pst,
      total,
    });
  } catch (err) {
    return apiError(err, "create payment intent");
  }
}
