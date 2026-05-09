export interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const CATEGORY_ORDER = ["general", "renters", "owners", "payments", "safety", "account"];

export const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  renters: "For Renters",
  owners: "For Owners",
  payments: "Payments & Billing",
  safety: "Safety & Damage",
  account: "Account & Privacy",
};

export const FAQS: Faq[] = [
  // ── General ──────────────────────────────────────────────────────────────────
  {
    id: "g1",
    category: "general",
    question: "What is Circl?",
    answer:
      "Circl is a peer-to-peer outdoor gear rental marketplace. It connects people who own gear they're not using with people who want to try or borrow gear for their next adventure — without the cost of buying new.",
  },
  {
    id: "g2",
    category: "general",
    question: "Is Circl available across Canada?",
    answer:
      "Yes! Circl is available to users across Canada. You can browse and list gear from anywhere in the country.",
  },
  {
    id: "g3",
    category: "general",
    question: "Do I need an account to use the platform?",
    answer:
      "You need an account to rent or list gear. Browsing listings is open to everyone, but submitting a rental request or posting gear requires a free account.",
  },
  {
    id: "g4",
    category: "general",
    question: "Is it free to sign up?",
    answer:
      "Yes, creating an account is completely free. We charge small service fees on transactions, which are disclosed at the time of booking.",
  },

  // ── Renters ───────────────────────────────────────────────────────────────────
  {
    id: "r1",
    category: "renters",
    question: "How do I rent gear?",
    answer:
      "Browse listings, find the gear you need, and submit a rental request with your desired dates. The owner will review your request and accept or decline. Once accepted, you'll receive confirmation and any pickup instructions.",
  },
  {
    id: "r2",
    category: "renters",
    question: "What happens if the gear is not as described?",
    answer:
      "If the gear you receive is significantly different from what was listed, contact us immediately. We take listing accuracy seriously and will work with you to resolve the issue, which may include a refund.",
  },
  {
    id: "r3",
    category: "renters",
    question: "Can I extend my rental?",
    answer:
      "Rental extensions are subject to the owner's availability. Contact the owner directly through the platform as early as possible if you need more time. Do not hold onto gear past your agreed return date without confirmation.",
  },
  {
    id: "r4",
    category: "renters",
    question: "What if I need to cancel my rental?",
    answer:
      "Cancellations are subject to our Cancellation Policy. We recommend reviewing it before booking. In general, cancellations made well in advance are more likely to receive a refund.",
  },
  {
    id: "r5",
    category: "renters",
    question: "Am I covered if something goes wrong during my rental?",
    answer:
      "You are responsible for the gear during the rental period. We strongly recommend having appropriate personal insurance (e.g. tenant's or home insurance) that covers borrowed property. See our Safety & Damage section for more details.",
  },

  // ── Owners ────────────────────────────────────────────────────────────────────
  {
    id: "o1",
    category: "owners",
    question: "How do I list my gear?",
    answer:
      'Go to your dashboard and click "Post Gear." Fill in the title, category, condition, description, price per day, and photos. Once submitted, your listing will be live and visible to renters immediately.',
  },
  {
    id: "o2",
    category: "owners",
    question: "How do I set my price?",
    answer:
      "You set your own price per day. A good rule of thumb is to charge 5–10% of the gear's retail value per day. Check similar listings on the platform to stay competitive.",
  },
  {
    id: "o3",
    category: "owners",
    question: "Can I pause or remove my listing?",
    answer:
      "Yes. You can toggle your listing's availability on and off at any time from your dashboard. You can also permanently remove a listing — note this cannot be undone.",
  },
  {
    id: "o4",
    category: "owners",
    question: "What happens if a renter damages my gear?",
    answer:
      "Renters are responsible for returning gear in the same condition they received it. If damage occurs, document it with photos and contact us right away. We will help facilitate a resolution between you and the renter.",
  },
  {
    id: "o5",
    category: "owners",
    question: "Do I have to accept every request?",
    answer:
      "No. You review every rental request and can accept or decline at your discretion. You can also include a message to the renter when responding.",
  },

  // ── Payments ──────────────────────────────────────────────────────────────────
  {
    id: "p1",
    category: "payments",
    question: "How do I get paid as an owner?",
    answer:
      "Payments are processed securely through our payment provider. Once a rental is completed, earnings are released to you according to our payout schedule. You'll need to set up your payout details in your account settings.",
  },
  {
    id: "p2",
    category: "payments",
    question: "What fees does Circl charge?",
    answer:
      "We charge a small service fee on each transaction. The exact fee is shown at checkout before you confirm a booking. We believe in transparent pricing — no surprises.",
  },
  {
    id: "p3",
    category: "payments",
    question: "What currencies are supported?",
    answer: "All transactions are processed in Canadian dollars (CAD).",
  },
  {
    id: "p4",
    category: "payments",
    question: "Are payments secure?",
    answer:
      "Yes. All payments are processed through our certified third-party payment provider using industry-standard encryption. We never store your full card details on our servers.",
  },
  {
    id: "p5",
    category: "payments",
    question: "What is the refund policy?",
    answer:
      "Refunds depend on the circumstances of the cancellation or issue. Renters who cancel in advance may be eligible for a full or partial refund per our Cancellation Policy. If there is a dispute about gear condition, contact our support team.",
  },

  // ── Safety ────────────────────────────────────────────────────────────────────
  {
    id: "s1",
    category: "safety",
    question: "What condition should listed gear be in?",
    answer:
      "All gear must be safe, functional, and accurately described. Owners must not list gear with known safety defects. If you receive gear that appears unsafe, do not use it and contact us immediately.",
  },
  {
    id: "s2",
    category: "safety",
    question: "What happens if gear is lost or stolen?",
    answer:
      "Renters are responsible for the gear from pickup to return. If gear is lost or stolen during the rental period, the renter may be liable for the replacement cost. We recommend checking your personal insurance coverage before renting.",
  },
  {
    id: "s3",
    category: "safety",
    question: "Does Circl provide insurance?",
    answer:
      "Circl does not currently provide insurance coverage for rentals. Both owners and renters are encouraged to verify that their personal insurance (home, tenant's, or activity-specific) covers peer-to-peer gear rentals.",
  },
  {
    id: "s4",
    category: "safety",
    question: "How do I report a safety concern?",
    answer:
      "If you encounter a safety issue with a listing, a user, or a rental, please contact us immediately through the Contact page. Safety reports are treated as a priority.",
  },

  // ── Account ───────────────────────────────────────────────────────────────────
  {
    id: "a1",
    category: "account",
    question: "How do I update my profile?",
    answer:
      "You can update your name, profile photo, and other account details from your dashboard settings.",
  },
  {
    id: "a2",
    category: "account",
    question: "How do I delete my account?",
    answer:
      "To delete your account, please contact us at our support email. We will process your request and delete your personal data in accordance with our Privacy Policy, subject to any legal retention requirements.",
  },
  {
    id: "a3",
    category: "account",
    question: "Who can see my personal information?",
    answer:
      "Other users can see your public profile (name, photo, ratings, and listings). Your contact details and private messages are never shared publicly. See our Privacy Policy for full details.",
  },
  {
    id: "a4",
    category: "account",
    question: "How does Circl use my data?",
    answer:
      "We use your data to operate the platform, facilitate rentals, and improve our service. We do not sell your personal information. Full details are in our Privacy Policy.",
  },
  {
    id: "a5",
    category: "account",
    question: "How do I report another user?",
    answer:
      "You can report a user by contacting us through the Contact page. Provide as much detail as possible. All reports are reviewed by our team.",
  },
];