// Pure pricing math shared by client components (checkout, request view) and
// the server-side payment-intent route. Deliberately has zero dependency on
// the `stripe` package — that SDK is Node-only, and this file gets imported
// from "use client" components, so pulling Stripe in here would mean bundling
// (or breaking) the server SDK in browser code.

export const PLATFORM_FEE = 0.15;
export const GST = 0.05;
export const PST = 0.07;

/**
 * Mirrors the price breakdown shown throughout the app (checkout, request
 * view, dashboard). The renter pays subtotal + platform fee + taxes; Stripe's
 * application_fee_amount takes the fee + taxes from that charge before
 * transferring the remainder — so the owner's payout equals `subtotal`
 * exactly, not subtotal minus the fee.
 */
export function computeAmounts(pricePerDay: number, days: number) {
  const subtotal = pricePerDay * days;
  const platformFee = subtotal * PLATFORM_FEE;
  const taxable = subtotal + platformFee;
  const gst = taxable * GST;
  const pst = taxable * PST;
  const total = taxable + gst + pst;
  return { subtotal, platformFee, gst, pst, total };
}
