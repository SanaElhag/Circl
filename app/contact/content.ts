export const CONTACT_EMAIL = "info@circl.ca";

// ── Hero ──────────────────────────────────────────────────────────────────────
export const HERO = {
  eyebrow: "Get in touch",
  heading: "Contact us",
  subheading:
    "A question, a concern, or just want to say hi — we're a small team and we read every message.",
};

// ── Contact channels ──────────────────────────────────────────────────────────
export const CONTACT_CHANNELS = [
  {
    title: "Email us",
    detail: CONTACT_EMAIL,
    note: "We reply within 24 hours",
    href: `mailto:${CONTACT_EMAIL}`,
  },
  {
    title: "Call us",
    detail: "123-456-7890",
    note: "Mon–Fri, 9 am–5 pm PST",
    href: "tel:1234567890",
  },
  {
    title: "Find us on campus",
    detail: "UFV Abbotsford",
    note: "33844 King Rd, Abbotsford, BC",
    href: "https://maps.google.com/?q=UFV+Abbotsford",
  },
];

// ── Response time note ────────────────────────────────────────────────────────
export const RESPONSE_NOTE =
  "We aim to reply to all messages within 24 hours on weekdays. Safety concerns are prioritised and responded to as quickly as possible.";

// ── Contact form ──────────────────────────────────────────────────────────────
export const FORM = {
  eyebrow: "Send a message",
  heading: "We'd love to hear from you",
  namePlaceholder: "Alex Smith",
  emailPlaceholder: "you@student.ufv.ca",
  topicLabel: "What's this about?",
  messagePlaceholder:
    "Tell us what's on your mind. The more detail, the faster we can help.",
  submitLabel: "Send message",
  submittingLabel: "Sending…",
  privacyNote: "By submitting you agree to our Privacy Policy.",
};

// ── Topic chips ───────────────────────────────────────────────────────────────
export const TOPICS = [
  { value: "rental", label: "Rental issue" },
  { value: "listing", label: "Listing help" },
  { value: "account", label: "Account & billing" },
  { value: "safety", label: "Safety concern" },
  { value: "feedback", label: "Feedback / idea" },
  { value: "other", label: "Something else" },
];

// ── Success screen ────────────────────────────────────────────────────────────
export const SUCCESS = {
  eyebrow: "Message received",
  // {firstName} will be replaced with the user's first name at runtime
  heading: "Thanks, {firstName}!",
  // {email} will be replaced with the submitted email at runtime
  body: "We got your message and will get back to you at {email} within 24 hours.",
  primaryButton: "Back to home",
  secondaryButton: "Browse FAQs",
};

// ── FAQ nudge card ────────────────────────────────────────────────────────────
export const FAQ_NUDGE = {
  eyebrow: "Quick answers",
  heading: "Most questions are answered in our FAQs",
  cta: "Browse FAQs",
};