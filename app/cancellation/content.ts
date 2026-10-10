export const LAST_UPDATED = "April 6, 2026";
export const CONTACT_EMAIL = "circl@gmail.com";

export const PREAMBLE =
  "The short version: Cancel before the owner responds, no charge. Cancel after acceptance with 48+ hours notice, rental amount refunded minus the platform fee. Cancel within 48 hours, 50% refund. Once the rental is active, no refund is available. Owners who cancel accepted bookings must give renters a full refund.";

export const REFUND_TABLE = [
  {
    timing: "Pending (not yet accepted)",
    refund: "Full refund",
    who: "Renter",
    highlight: true,
  },
  {
    timing: "Accepted, 48+ hrs before start",
    refund: "Rental amount (platform fee kept)",
    who: "Renter",
    highlight: false,
  },
  {
    timing: "Accepted, within 48 hrs of start",
    refund: "50% of rental amount",
    who: "Renter",
    highlight: false,
  },
  {
    timing: "After rental starts (Active)",
    refund: "No refund",
    who: "Renter",
    highlight: false,
  },
  {
    timing: "Owner cancels accepted booking",
    refund: "Full refund to renter",
    who: "Owner",
    highlight: true,
  },
];

export const REFUND_TABLE_NOTE =
  "Platform fee (15%), GST, and PST are non-refundable once a booking is accepted, except where the owner cancels or an extenuating circumstance applies.";

export const sections = [
  {
    id: "overview",
    title: "1. Overview",
    paragraphs: [
      "This Cancellation Policy explains the rules that apply when a rental request is cancelled by either the Renter (borrower) or the Owner (lender) before or during a rental period on the Circl platform.",
      "By submitting or accepting a rental request on Circl, both parties agree to the terms set out in this Policy. Circl reserves the right to make final decisions on cancellation disputes."
    ],
  },
  {
    id: "renter-cancellations",
    title: "2. Renter Cancellations",
    intro:
      "If you are the Renter and you wish to cancel a request you have submitted, the following terms apply based on how far in advance you cancel:",
    subsections: [
      {
        heading: "Before the owner responds (status: Pending)",
        body: "You may cancel a pending request at any time with no charge. The request has not yet been accepted, so no rental commitment exists. Your request will be removed and no fees will apply.",
      },
      {
        heading: "After acceptance, more than 48 hours before the rental start date",
        body: "You will receive a full refund of any amounts paid, minus the platform service fee (15%). The platform fee is non-refundable once a request has been accepted, as it covers the cost of processing the booking.",
      },
      {
        heading: "After acceptance, within 48 hours of the rental start date",
        body: "You will receive a 50% refund of the rental amount. The platform fee (15%), GST, and PST are non-refundable. This policy exists to compensate owners for the short notice, as they may not be able to re-list their gear in time.",
      },
      {
        heading: "After the rental has started (status: Active)",
        body: "No refund is available once the gear has been handed over and the rental is marked as active. If you need to return the gear early, please contact the owner directly. Partial refunds for early returns are at the owner's discretion.",
      },
    ],
  },
  {
    id: "owner-cancellations",
    title: "3. Owner Cancellations",
    intro:
      "If you are the Owner and you need to cancel an accepted rental, Circl takes this seriously. Renters plan around their bookings, and last-minute owner cancellations cause real disruption.",
    subsections: [
      {
        heading: "Before the rental start date",
        body: "If you cancel an accepted request before the rental begins, the Renter will receive a full refund including all fees and taxes. Your listing may be temporarily hidden from search results, and repeated cancellations may result in account review or suspension.",
      },
      {
        heading: "After the rental has started",
        body: "Once gear has been handed over and the rental is active, you may not cancel the booking unilaterally. If there is a genuine emergency or the Renter has violated your rental terms, please contact Circl support immediately.",
      },
      {
        heading: "Declining a request",
        body: "Declining a pending request is not a cancellation. You are always free to decline requests before accepting them, with no penalty. We encourage owners to respond promptly so renters can make alternative arrangements.",
      },
    ],
  },
  {
    id: "no-show",
    title: "4. No-Shows",
    subsections: [
      {
        heading: "Renter no-show",
        body: "If a Renter fails to appear for the agreed pick-up without cancelling in advance, the rental is treated as a same-day cancellation. No refund will be issued for the rental amount or fees. The Owner is entitled to keep the full rental payment.",
      },
      {
        heading: "Owner no-show",
        body: "If an Owner fails to make the gear available at the agreed time without prior notice, the Renter is entitled to a full refund of all amounts paid. The Owner's listing may be flagged for review. Renters should document the no-show by contacting Circl support as soon as possible.",
      },
    ],
  },
  {
    id: "extenuating",
    title: "5. Extenuating Circumstances",
    intro:
      "In exceptional cases, Circl may override the standard cancellation policy and issue a full refund regardless of timing. Qualifying extenuating circumstances include:",
    items: [
      "Serious illness or injury affecting the Renter or an immediate family member (documentation required);",
      "Severe weather events that make travel unsafe or the planned activity impossible;",
      "Death in the immediate family;",
      "Government-declared emergencies or travel restrictions; or",
      "Documented failure of the gear to perform as described that renders it unusable.",
    ],
    footer:
      "Requests for extenuating circumstance refunds must be submitted within 48 hours of the cancellation and must include supporting documentation. Circl's decision on extenuating circumstance claims is final.",
  },
  {
    id: "refund-process",
    title: "6. Refund Processing",
    paragraphs: [
      "Approved refunds will be returned to the original payment method used at checkout. Refund timelines depend on your payment provider but typically take 5–10 business days to appear on your statement.",
      `Circl processes refunds within 2 business days of a cancellation being confirmed. If you have not received your refund after 10 business days, please contact us at ${CONTACT_EMAIL}.`,
      "Note: As Circl currently processes payments in-person at pick-up, refund mechanics may differ. In-person payment cancellations will be resolved by confirming that no payment was exchanged, or by arranging a direct return of funds. Circl will facilitate this process where needed.",
    ],
  },
  {
    id: "disputes",
    title: "7. Disputes",
    intro:
      "If you and the other party disagree about a cancellation or refund, either party may contact Circl to open a dispute. To submit a dispute:",
    items: [
      `Email us at ${CONTACT_EMAIL} with your request ID;`,
      "Describe the situation clearly and include any relevant evidence (messages, photos, timestamps); and",
      "Submit your dispute within 7 days of the cancellation event.",
    ],
    footer:
      "Circl will review the dispute and issue a decision within 5 business days. Our decision is final and binding on both parties.",
  },
  {
    id: "modifications",
    title: "8. Rental Modifications",
    paragraphs: [
      "Changes to rental dates or terms after a request has been accepted are treated as modifications, not cancellations, provided both parties agree.",
      `To modify a pending request, Renters can use the "Edit request" option on the request page. For accepted rentals, date changes require mutual agreement and should be coordinated through the in-app messaging thread. Circl is not responsible for informal agreements made outside the platform.`,
      "If a modification results in a lower rental price, the difference will be refunded (minus the platform fee). If the modification increases the price, the additional amount is due at pick-up.",
    ],
  },
  {
    id: "policy-changes",
    title: "9. Changes to This Policy",
    paragraphs: [
      `Circl may update this Cancellation Policy from time to time. When material changes are made, we will notify users by posting the updated Policy with a new "Last Updated" date and, where applicable, by sending an email notification. Your continued use of the platform after the effective date constitutes acceptance of the revised Policy.`,
    ],
  },
];