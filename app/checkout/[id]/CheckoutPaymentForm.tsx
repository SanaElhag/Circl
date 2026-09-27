"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PayButton({
  onConfirmed,
  disabled,
}: {
  onConfirmed: (paymentIntentId: string) => Promise<void>;
  disabled: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your card details.");
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === "requires_capture" || paymentIntent.status === "succeeded")) {
      await onConfirmed(paymentIntent.id);
    } else {
      setError("Payment could not be authorized. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <PaymentElement />
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">{error}</div>
      )}
      <button
        onClick={handleClick}
        disabled={disabled || submitting || !stripe || !elements}
        className="w-full bg-[#DDEB9D] text-[#143D60] font-bold rounded-xl py-4 hover:bg-[#A0C878] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-base"
      >
        {submitting ? "Authorizing payment..." : "Authorize Payment & Send Request"}
      </button>
    </div>
  );
}

export default function CheckoutPaymentForm({
  clientSecret,
  onConfirmed,
  disabled,
}: {
  clientSecret: string;
  onConfirmed: (paymentIntentId: string) => Promise<void>;
  disabled?: boolean;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#143D60" } } }}
    >
      <PayButton onConfirmed={onConfirmed} disabled={!!disabled} />
    </Elements>
  );
}
