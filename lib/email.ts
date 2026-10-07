import { Resend } from "resend";

// built lazily, same idea as lib/stripe.ts - importing this file shouldn't
// crash just because the key isn't set yet
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// until we verify our own domain in Resend, mail has to come from their
// shared onboarding@resend.dev address - swap EMAIL_FROM once a domain is set up
const FROM_ADDRESS = process.env.EMAIL_FROM || "Circl <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = getResend();
  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  if (error) throw new Error(error.message);
}
