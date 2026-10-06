import { NextResponse } from "next/server";

// common error response for api routes - log the real error, only send a
// safe message back to the client
export function apiError(err: unknown, context: string) {
  console.error(`[api] ${context}:`, err);

  if (err instanceof Error && err.message === "STRIPE_SECRET_KEY is not set") {
    return NextResponse.json(
      { error: "Payments aren't set up yet. Please try again later." },
      { status: 503 }
    );
  }

  // stripe's own error messages are fine to show to users, pass those through
  if (err && typeof err === "object" && "type" in err && String(err.type).startsWith("Stripe")) {
    const message = "message" in err && typeof err.message === "string" ? err.message : undefined;
    return NextResponse.json({ error: message ?? "Payment failed. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
