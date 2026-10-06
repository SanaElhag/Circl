// just the pricing math, no stripe import - this file gets used in the
// browser too and the stripe package is node-only

export const PLATFORM_FEE = 0.15;
export const GST = 0.05;
export const PST = 0.07;

// renter pays subtotal + fee + tax, owner gets the full subtotal back
// (stripe takes the fee+tax out of the charge before paying the owner)
export function computeAmounts(pricePerDay: number, days: number) {
  const subtotal = pricePerDay * days;
  const platformFee = subtotal * PLATFORM_FEE;
  const taxable = subtotal + platformFee;
  const gst = taxable * GST;
  const pst = taxable * PST;
  const total = taxable + gst + pst;
  return { subtotal, platformFee, gst, pst, total };
}
