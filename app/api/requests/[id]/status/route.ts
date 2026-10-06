import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseForRequest } from "@/lib/supabaseServer";
import { apiError } from "@/lib/apiError";
import { rateLimit } from "@/lib/rateLimit";

type Action = "accept" | "decline" | "cancel";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(req, "request-status", { max: 20, windowMs: 60_000 });
  if (limited) return limited;

  const { id } = await params;

  let supabase, user;
  try {
    ({ supabase, user } = await supabaseForRequest(req));
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const { action } = (await req.json()) as { action: Action };
    if (!["accept", "decline", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data: request, error: reqErr } = await supabase
      .from("requests")
      .select("id, status, payment_status, stripe_payment_intent_id, requester_id, listings ( user_id )")
      .eq("id", id)
      .single();

    if (reqErr || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const listing = Array.isArray(request.listings) ? request.listings[0] : request.listings;
    const ownerId = (listing as { user_id: string } | null)?.user_id;
    const isOwner = ownerId === user.id;
    const isRequester = request.requester_id === user.id;

    if (!isOwner && !isRequester) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const piId = request.stripe_payment_intent_id as string | null;

    if (action === "accept" || action === "decline") {
      if (!isOwner) {
        return NextResponse.json({ error: "Only the owner can do that" }, { status: 403 });
      }
      if (request.status !== "pending") {
        return NextResponse.json({ error: "Request is no longer pending" }, { status: 400 });
      }

      const newStatus = action === "accept" ? "accepted" : "declined";
      let newPaymentStatus = request.payment_status;

      if (piId) {
        const stripe = getStripe();
        if (action === "accept") {
          await stripe.paymentIntents.capture(piId);
          newPaymentStatus = "captured";
        } else {
          await stripe.paymentIntents.cancel(piId);
          newPaymentStatus = "canceled";
        }
      }

      const { error } = await supabase
        .from("requests")
        .update({ status: newStatus, payment_status: newPaymentStatus })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ status: newStatus, payment_status: newPaymentStatus });
    }

    // action === "cancel" — either party, while pending or accepted
    if (!["pending", "accepted"].includes(request.status)) {
      return NextResponse.json({ error: "Request can't be cancelled from its current status" }, { status: 400 });
    }

    let newPaymentStatus = request.payment_status;
    if (piId && request.payment_status === "authorized") {
      await getStripe().paymentIntents.cancel(piId);
      newPaymentStatus = "canceled";
    } else if (piId && request.payment_status === "captured") {
      await getStripe().refunds.create({ payment_intent: piId });
      newPaymentStatus = "refunded";
    }

    const { error } = await supabase
      .from("requests")
      .update({ status: "cancelled", payment_status: newPaymentStatus })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ status: "cancelled", payment_status: newPaymentStatus });
  } catch (err) {
    return apiError(err, "request status update");
  }
}
