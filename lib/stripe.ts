import Stripe from "stripe";

// Lazily constructed: importing this module happens at build time (e.g. Next's
// page-data collection for route handlers), before real env vars are set, and
// the Stripe SDK throws immediately on an empty API key.
//
// This file is server-only (it imports the `stripe` Node SDK) — client
// components that just need the price math should import from "@/lib/pricing"
// instead, not re-export it from here.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export { PLATFORM_FEE, GST, PST, computeAmounts } from "./pricing";
