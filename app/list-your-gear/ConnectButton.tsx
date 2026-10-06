"use client";

// stripe payouts aren't live yet, button's just a placeholder for now.
// the real connect flow still works at /api/stripe/connect if needed
export default function ConnectButton() {
  return (
    <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-400 font-bold px-6 py-3.5 rounded-xl text-sm cursor-not-allowed">
      Coming soon
    </div>
  );
}
