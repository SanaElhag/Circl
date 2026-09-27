import { NextResponse } from "next/server";

/**
 * Standard error response for API routes. Every route handler should wrap its
 * body in try/catch and funnel failures through this — otherwise an
 * unhandled throw (Stripe not configured, a network blip, a bad Supabase
 * call) turns into Next's raw default error response instead of the clean
 * JSON error shape the client-side code expects, and details end up in the
 * response that shouldn't be (env var names, internal messages, stack info).
 *
 * The real error always goes to the server log; only a safe, generic message
 * — or a specifically-allowed one — reaches the client.
 */
export function apiError(err: unknown, context: string) {
  console.error(`[api] ${context}:`, err);

  if (err instanceof Error && err.message === "STRIPE_SECRET_KEY is not set") {
    return NextResponse.json(
      { error: "Payments aren't set up yet. Please try again later." },
      { status: 503 }
    );
  }

  // Stripe's own errors are written to be shown to end users (declined card,
  // invalid account state, etc.) — safe to pass through. Anything else
  // (a generic JS/Supabase error) could contain internal details, so it gets
  // the generic message instead.
  if (err && typeof err === "object" && "type" in err && String(err.type).startsWith("Stripe")) {
    const message = "message" in err && typeof err.message === "string" ? err.message : undefined;
    return NextResponse.json({ error: message ?? "Payment failed. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
