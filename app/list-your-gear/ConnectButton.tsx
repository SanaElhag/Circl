"use client";

/**
 * Stripe payouts aren't live yet (see the "Coming soon" section on this page).
 * The working Connect flow is still here — /api/stripe/connect,
 * /api/stripe/connect/status — so this just needs to go back to calling
 * handleConnect() once Stripe is ready to turn on for real users.
 */
export default function ConnectButton() {
  return (
    <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-400 font-bold px-6 py-3.5 rounded-xl text-sm cursor-not-allowed">
      Coming soon
    </div>
  );
}
