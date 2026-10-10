export const LAST_UPDATED = "May 9, 2026";
export const COMPANY_NAME = "Circl";
export const CONTACT_EMAIL = "circl@gmail.com";

export const PREAMBLE =
  "Your privacy matters to us. This Policy explains what personal information we collect, why we collect it, and how you can control it. We comply with Canada's federal privacy law (PIPEDA) and British Columbia's Personal Information Protection Act (PIPA).";

export const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    paragraphs: [
      `${COMPANY_NAME} ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our peer-to-peer outdoor gear rental marketplace (the "Platform").`,
      `This Policy is governed by Canada's Personal Information Protection and Electronic Documents Act ("PIPEDA") and, where applicable, the Personal Information Protection Act of British Columbia ("BC PIPA"). By using the Platform, you consent to the practices described in this Policy.`,
    ],
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    intro: "We collect the following categories of personal information:",
    subsections: [
      {
        heading: "Account Information",
        items: [
          "Full name and email address when you register;",
          "Profile photo (if provided); and",
          "Password (stored in encrypted form, we never store plaintext passwords).",
        ],
      },
      {
        heading: "Listing & Transaction Information",
        items: [
          "Gear listings you create, including descriptions, photos, and pricing;",
          "Rental requests you submit or receive; and",
          "Ratings and reviews you give or receive.",
        ],
      },
      {
        heading: "Communications",
        items: [
          "Messages sent between users through the Platform; and",
          "Contact form submissions and support correspondence.",
        ],
      },
      {
        heading: "Usage & Technical Information",
        items: [
          "IP address, browser type, and device information;",
          "Pages visited, features used, and time spent on the Platform; and",
          "Cookies and similar tracking technologies (see Section 8).",
        ],
      },
      {
        heading: "Payment Information",
        items: [
          "Payment transactions are processed by our third-party payment provider. We do not store full credit card numbers or banking details on our servers.",
        ],
      },
    ],
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    intro: "We use your personal information to:",
    items: [
      "Create and manage your account;",
      "Facilitate rental transactions between Owners and Renters;",
      "Process payments and prevent fraud;",
      "Display your public profile and listings to other users;",
      "Send transactional communications (booking confirmations, status updates);",
      "Respond to your support requests and enquiries;",
      "Send optional marketing communications (only with your consent);",
      "Improve, personalize, and maintain the Platform;",
      "Comply with applicable legal obligations; and",
      "Enforce our Terms & Conditions and other policies.",
    ],
    footer:
      "We will not use your personal information for purposes other than those listed above without your consent, except as required or permitted by law.",
  },
  {
    id: "disclosure",
    title: "4. Disclosure of Your Information",
    intro: "We may share your personal information with:",
    subsections: [
      {
        heading: "Other Users",
        body: "Your public profile information (name, ratings, listings) is visible to other users of the Platform. Private communications are visible only to the parties involved.",
      },
      {
        heading: "Service Providers",
        body: "We work with trusted third-party providers to operate the Platform, including cloud hosting (Supabase) and payment processing (Stripe). These providers are contractually bound to protect your information and may only use it to perform services on our behalf. We don't currently use any analytics provider, see Section 8.",
      },
      {
        heading: "Legal Authorities",
        body: `We may disclose your information where required by law, court order, or governmental authority, or where we believe disclosure is necessary to protect the rights, property, or safety of ${COMPANY_NAME}, our users, or the public.`,
      },
      {
        heading: "Business Transfers",
        body: "In the event of a merger, acquisition, or sale of all or part of our assets, your information may be transferred as part of that transaction. We will notify you before your information becomes subject to a different privacy policy.",
      },
    ],
    footer: "We do not sell your personal information to third parties.",
  },
  {
    id: "data-retention",
    title: "5. Data Retention",
    paragraphs: [
      "We retain your personal information for as long as your account is active or as needed to provide you with the Platform's services. We also retain information as necessary to:",
    ],
    items: [
      "Comply with legal obligations;",
      "Resolve disputes; and",
      "Enforce our agreements.",
    ],
    footer:
      "When you close your account, we will delete or anonymize your personal information within a reasonable period, except where retention is required by law. Note that some information (such as transaction records) may be retained for up to seven (7) years to comply with Canadian tax and accounting requirements.",
  },
  {
    id: "your-rights",
    title: "6. Your Rights",
    intro: "Under PIPEDA and BC PIPA, you have the right to:",
    items: [
      "Access: Request a copy of the personal information we hold about you;",
      "Correction: Request that we correct inaccurate or incomplete information;",
      "Withdrawal of Consent: Withdraw consent to our use of your information at any time, subject to legal or contractual restrictions;",
      "Deletion: Request deletion of your personal information, subject to our retention obligations; and",
      "Complaint: Lodge a complaint with the Office of the Privacy Commissioner of Canada (OPC) or the BC Information and Privacy Commissioner if you believe your privacy rights have been violated.",
    ],
    footer: `To exercise any of these rights, please contact us at ${CONTACT_EMAIL}. We will respond to your request within 30 days as required by law.`,
  },
  {
    id: "data-security",
    title: "7. Data Security",
    paragraphs: [
      "We implement industry-standard technical and organizational measures to protect your personal information against unauthorized access, disclosure, alteration, or destruction. These measures include:",
    ],
    items: [
      "Encrypted data transmission (TLS/HTTPS);",
      "Encrypted password storage;",
      "Role-based access controls limiting who can access personal data; and",
      "Regular security reviews of our infrastructure.",
    ],
    footer:
      "No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security. In the event of a data breach that poses a real risk of significant harm, we will notify affected users and the Office of the Privacy Commissioner of Canada as required by law.",
  },
  {
    id: "cookies",
    title: "8. Cookies & Local Storage",
    paragraphs: [
      "We don't currently use tracking or analytics cookies. Staying signed in is handled with your browser's local storage rather than a cookie, and it's required for the Platform to function.",
      "See our Cookie Policy (linked in the footer) for the full, current picture. We'll update it, and ask again, before adding anything like analytics.",
    ],
  },
  {
    id: "third-party",
    title: "9. Third-Party Links & Services",
    paragraphs: [
      "The Platform may contain links to third-party websites or integrate with third-party services. We are not responsible for the privacy practices of those third parties. We encourage you to review the privacy policies of any third-party services you use in connection with the Platform.",
    ],
  },
  {
    id: "children",
    title: "10. Children's Privacy",
    paragraphs: [
      "The Platform is not directed at individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected information from a person under 18, please contact us immediately and we will take steps to delete it.",
    ],
  },
  {
    id: "cross-border",
    title: "11. Cross-Border Data Transfers",
    paragraphs: [
      "Some of our third-party service providers (including cloud infrastructure) may store or process your data outside of Canada, including in the United States. Where this occurs, we take steps to ensure that your information receives a comparable level of protection as it would in Canada, including through contractual safeguards. By using the Platform, you consent to this transfer.",
    ],
  },
  {
    id: "changes",
    title: "12. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. When we make material changes, we will notify you by:",
    ],
    items: [
      `Posting the updated Policy on this page with a new "Last Updated" date; and`,
      "Sending a notification to the email address associated with your account.",
    ],
    footer:
      "Your continued use of the Platform after the effective date of the revised Policy constitutes your acceptance of the changes.",
  },
  {
    id: "contact",
    title: "13. Contact & Privacy Officer",
    paragraphs: [
      "If you have questions, concerns, or requests regarding this Privacy Policy or our handling of your personal information, please contact our Privacy Officer at:",
    ],
    address: {
      name: `${COMPANY_NAME}, Privacy Officer`,
      location: "British Columbia, Canada",
      email: CONTACT_EMAIL,
    },
    footer: `If you are not satisfied with our response, you may contact the Office of the Privacy Commissioner of Canada (https://www.priv.gc.ca) or the Office of the Information & Privacy Commissioner for BC (https://www.oipc.bc.ca).`,
  },
];