"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";
import { computeAmounts } from "@/lib/pricing";
import CheckoutPaymentForm from "./CheckoutPaymentForm";

interface Listing {
  id: string;
  title: string;
  category: string;
  price_per_day: number;
  image_url: string | null;
  condition: string;
  user_id: string;
  users: { id: string; full_name: string } | null;
}

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();

  const listingId = params.get("listing");
  const startDate = params.get("start");
  const endDate = params.get("end");
  const note = params.get("note") ?? "";

  const [listing, setListing] = useState<Listing | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [userFullName, setUserFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  // "unavailable" covers any reason payment can't happen right now (stripe not
  // set up, owner hasn't finished onboarding, etc) - either way we just send
  // the request and let them sort out payment directly
  const [paymentState, setPaymentState] = useState<"checking" | "ready" | "unavailable">("checking");

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/auth/login?redirect=/checkout?listing=${listingId}&start=${startDate}&end=${endDate}`);
        return;
      }
      setUser({ id: session.user.id, email: session.user.email ?? "" });

      const { data: userData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", session.user.id)
        .single();
      setUserFullName(userData?.full_name ?? session.user.email ?? "Someone");

      if (!listingId) { setLoading(false); return; }

      const { data, error: fetchErr } = await supabase
        .from("listings")
        .select("id, title, category, price_per_day, image_url, condition, user_id")
        .eq("id", listingId)
        .single();

      if (fetchErr || !data) {
        setError("Gear listing not found.");
      } else {
        const { data: ownerData } = await supabase
          .from("users")
          .select("id, full_name")
          .eq("id", data.user_id)
          .single();
        setListing({ ...data, users: ownerData ?? null });

        if (startDate && endDate) {
          try {
            const res = await fetch("/api/stripe/create-payment-intent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ listingId, startDate, endDate, note }),
            });
            if (res.ok) {
              const piData = await res.json();
              setClientSecret(piData.clientSecret);
              setPaymentState("ready");
            } else {
              setPaymentState("unavailable");
            }
          } catch {
            setPaymentState("unavailable");
          }
        }
      }
      setLoading(false);
    }
    init();
  }, [listingId, startDate, endDate, note, router]);

  function daysBetween(a: string, b: string) {
    return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
  }

  const days = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const { subtotal, platformFee, gst, pst, total } = computeAmounts(listing?.price_per_day ?? 0, days);
  const fmt = (n: number) => n.toFixed(2);

  function formatDate(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString("en-CA", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  }

  // creates the request, notifies the owner, and sends them to the success
  // page. used by both the real stripe payment and the "pay directly" path
  async function submitRequest(paymentFields: {
    stripe_payment_intent_id: string | null;
    payment_status: string;
    amount_total_cents: number | null;
  }, displayTotal: number, paid: boolean) {
    if (!listing || !user || !startDate || !endDate) return;
    setSubmitting(true);
    setError(null);

    try {
      // get a fresh session so the login token is current for this insert
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession) {
        setSubmitting(false);
        router.push(`/auth/login?redirect=/checkout/${listing.id}`);
        return;
      }

      const { data: req, error: reqErr } = await supabase
        .from("requests")
        .insert({
          listing_id: listing.id,
          requester_id: user.id,
          status: "pending",
          start_date: startDate,
          end_date: endDate,
          requester_note: note || null,
          ...paymentFields,
        })
        .select("id")
        .single();

      if (reqErr || !req) throw new Error(reqErr?.message ?? "Failed to send request.");

      // Notify the gear owner
      if (listing.users) {
        await createNotification({
          userId: listing.users.id,
          type: "request_received",
          title: "New rental request",
          body: `${userFullName} wants to rent "${listing.title}"`,
          requestId: req.id,
        });
      }

      const payRef = `CRC-${req.id.slice(0, 8).toUpperCase()}`;
      router.push(
        `/checkout/${listing.id}/success?request=${req.id}&ref=${payRef}&listing=${encodeURIComponent(listing.title)}&days=${days}&total=${fmt(displayTotal)}&paid=${paid ? "1" : "0"}&start=${startDate}&end=${endDate}`
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      router.push(`/checkout/${listingId}/failed?listing=${listingId}&start=${startDate}&end=${endDate}&note=${encodeURIComponent(note)}`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirmed(paymentIntentId: string) {
    return submitRequest(
      { stripe_payment_intent_id: paymentIntentId, payment_status: "authorized", amount_total_cents: Math.round(total * 100) },
      total,
      true
    );
  }

  function handleConfirmNoPayment() {
    // no fee/tax here since nothing's actually being charged, just the gear cost
    return submitRequest(
      { stripe_payment_intent_id: null, payment_status: "unpaid", amount_total_cents: Math.round(subtotal * 100) },
      subtotal,
      false
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#143D60] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing || !startDate || !endDate) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Missing rental details. Please go back and select dates.</p>
        <Link href="/browse" className="text-[#27667B] underline text-sm">Back to Browse</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="bg-white border-b border-gray-100 h-16 flex items-center px-6">
        <Link href="/" className="text-[#143D60] font-bold tracking-[0.2em] uppercase text-sm">CIRCL</Link>
        <span className="mx-3 text-gray-300">/</span>
        <span className="text-gray-400 text-sm">Checkout</span>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

        {/* Back button */}
        <div className="lg:col-span-2 -mb-2">
          <Link
            href={`/gear/${listing.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#143D60] transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to gear
          </Link>
        </div>

        {/* LEFT */}
        <div className="space-y-6">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Rental Summary</p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {listing.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gray-200" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#27667B] mb-1">
                {listing.category.replace("-", " ")}
              </p>
              <h2 className="font-bold text-[#143D60] text-lg leading-tight">{listing.title}</h2>
              <p className="text-gray-500 text-sm mt-1">Condition: <span className="text-gray-700">{listing.condition}</span></p>
              {listing.users && <p className="text-gray-400 text-xs mt-1">Listed by {listing.users.full_name}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-[#143D60] mb-4">Rental Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">Pick-up</p>
                <p className="text-[#143D60] font-semibold">{formatDate(startDate)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">Return</p>
                <p className="text-[#143D60] font-semibold">{formatDate(endDate)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Duration: <span className="font-semibold text-[#143D60]">{days} {days === 1 ? "day" : "days"}</span></p>
            </div>
          </div>

          {note && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-[#143D60] mb-2">Your Note to the Owner</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{note}</p>
            </div>
          )}

          <div className="bg-[#143D60] rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-4">What happens next?</h3>
            <ol className="space-y-3">
              {[
                { step: "1", text: "Your request is sent to the owner for review." },
                { step: "2", text: "You'll receive a notification once they accept or decline — usually within 24 hours." },
                { step: "3", text: "Once accepted, coordinate pick-up directly with the owner." },
                { step: "4", text: "Enjoy the gear, then return it by the agreed date." },
              ].map(({ step, text }) => (
                <li key={step} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-[#DDEB9D] text-[#143D60] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step}
                  </span>
                  <p className="text-sm text-white/80 leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">
              {paymentState === "unavailable" ? "Estimated Cost" : "Price Breakdown"}
            </p>

            {paymentState === "unavailable" ? (
              // no fee breakdown here, nothing's actually being charged
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">${listing.price_per_day.toFixed(2)} × {days} {days === 1 ? "day" : "days"}</span>
                  <span className="font-semibold text-[#143D60]">${fmt(subtotal)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">${listing.price_per_day.toFixed(2)} × {days} {days === 1 ? "day" : "days"}</span>
                  <span className="font-semibold text-[#143D60]">${fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform fee (15%)</span>
                  <span className="font-semibold text-[#143D60]">${fmt(platformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST (5%)</span>
                  <span className="font-semibold text-[#143D60]">${fmt(gst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PST (7%)</span>
                  <span className="font-semibold text-[#143D60]">${fmt(pst)}</span>
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold text-[#143D60]">{paymentState === "unavailable" ? "Estimated total" : "Total"}</span>
              <span className="font-bold text-xl text-[#143D60]">${fmt(paymentState === "unavailable" ? subtotal : total)}</span>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              {paymentState === "unavailable"
                ? "Online payment isn't set up for this listing yet. You'll arrange payment with the owner directly once they accept — this isn't collected through Circl."
                : "All amounts in CAD. Your card is authorized now and only charged if the owner accepts."}
            </p>

            {error && (
              <div className="mt-4 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">{error}</div>
            )}

            <div className="mt-6">
              {submitting && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-[#143D60] border-t-transparent rounded-full animate-spin" />
                  Sending request...
                </div>
              )}

              {!submitting && paymentState === "ready" && clientSecret && (
                <CheckoutPaymentForm clientSecret={clientSecret} onConfirmed={handleConfirmed} disabled={submitting} />
              )}

              {!submitting && paymentState === "unavailable" && (
                <button
                  onClick={handleConfirmNoPayment}
                  className="w-full bg-[#143D60] text-white font-bold rounded-xl py-3.5 text-sm hover:bg-[#27667B] transition-colors duration-200"
                >
                  Send Request
                </button>
              )}

              {!submitting && paymentState === "checking" && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-[#143D60] border-t-transparent rounded-full animate-spin" />
                  Checking payment options...
                </div>
              )}
            </div>

            <Link href={`/gear/${listing.id}`} className="block text-center text-sm text-gray-400 hover:text-[#27667B] mt-4 transition-colors">
              Cancel and go back
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#143D60] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}