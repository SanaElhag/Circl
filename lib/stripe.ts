import Stripe from "stripe";

// built lazily so just importing this file doesn't crash when there's no key yet
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

// server only from here down - if you just need the pricing math in a
// client component, import from "@/lib/pricing" instead
export { PLATFORM_FEE, GST, PST, computeAmounts } from "./pricing";
