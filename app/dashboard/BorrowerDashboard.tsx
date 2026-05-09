"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { BorrowerRequest, ListingUser } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_LABELS: Record<string, string> = {
  skiing: "Skiing", snowboarding: "Snowboarding", hiking: "Hiking",
  camping: "Camping", climbing: "Climbing", "water-sports": "Water Sports",
  cycling: "Cycling", fishing: "Fishing",
};

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  accepted: "bg-[#F0F7F4] text-[#27667B] border-[#A0C878]",
  declined: "bg-red-50 text-red-600 border-red-200",
};

function diffDays(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function unwrapUser(u: ListingUser | ListingUser[] | null | undefined): ListingUser | null {
  if (!u) return null;
  return Array.isArray(u) ? (u[0] ?? null) : u;
}

// ── Star picker ───────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="transition-transform duration-100 hover:scale-110"
        >
          <svg className={`w-7 h-7 ${(hover || value) >= s ? "text-[#DDEB9D]" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── Rating modal ──────────────────────────────────────────────────────────────

function RatingModal({ request, userId, onClose, onSubmit }: {
  request: BorrowerRequest;
  userId: string;
  onClose: () => void;
  onSubmit: (requestId: string) => void;
}) {
  const [gearRating,    setGearRating]    = useState(0);
  const [ownerRating,   setOwnerRating]   = useState(0);
  const [gearComment,   setGearComment]   = useState("");
  const [ownerComment,  setOwnerComment]  = useState("");
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const listing = request.listings;
  const owner   = unwrapUser(listing?.users ?? null);

  async function handleSubmit() {
    if (!gearRating)  return setError("Please rate the gear.");
    if (!ownerRating) return setError("Please rate the owner.");
    setSaving(true);

    const { error: err } = await supabase.from("ratings").insert({
      request_id:    request.id,
      rater_id:      userId,
      ratee_id:      owner?.id ?? null,
      listing_id:    listing?.id ?? null,
      gear_rating:   gearRating,
      owner_rating:  ownerRating,
      gear_comment:  gearComment.trim() || null,
      owner_comment: ownerComment.trim() || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSubmit(request.id);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="font-bold text-[#143D60] text-lg">Rate your rental</h3>
          <p className="text-sm text-gray-400 mt-0.5">{listing?.title}</p>
        </div>

        {/* Gear rating + comment */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
          <p className="text-sm font-semibold text-[#143D60]">How was the gear?</p>
          <StarPicker value={gearRating} onChange={setGearRating} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Gear comment <span className="text-gray-300 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={gearComment}
              onChange={(e) => setGearComment(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Condition, what was included, anything useful for the next renter..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#143D60] transition-colors duration-200 resize-none placeholder-gray-300 bg-white"
            />
          </div>
        </div>

        {/* Owner rating + comment */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
          <p className="text-sm font-semibold text-[#143D60]">
            How was {owner?.full_name ?? "the owner"}?
          </p>
          <StarPicker value={ownerRating} onChange={setOwnerRating} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Owner comment <span className="text-gray-300 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={ownerComment}
              onChange={(e) => setOwnerComment(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Communication, handoff experience, would you rent from them again?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#143D60] transition-colors duration-200 resize-none placeholder-gray-300 bg-white"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-500 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition-all duration-200 ${saving ? "bg-gray-100 text-gray-400" : "bg-[#143D60] text-white hover:bg-[#27667B]"}`}>
            {saving ? "Submitting..." : "Submit rating"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type BorrowerTab = "summary" | "history";

const TABS: { key: BorrowerTab; label: string }[] = [
  { key: "summary", label: "My Rental Summary" },
  { key: "history", label: "Rental History" },
];

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BorrowerDashboard({ requests, ratedRequestIds, userId }: {
  requests: BorrowerRequest[];
  ratedRequestIds: string[];
  userId: string;
}) {
  const [tab,       setTab]       = useState<BorrowerTab>("summary");
  const [rated,     setRated]     = useState<Set<string>>(new Set(ratedRequestIds));
  const [ratingFor, setRatingFor] = useState<BorrowerRequest | null>(null);

  const accepted   = requests.filter((r) => r.status === "accepted");
  const totalDays  = accepted.reduce((s, r) => s + (r.start_date && r.end_date ? diffDays(r.start_date, r.end_date) : 1), 0);
  const totalSpent = accepted.reduce((s, r) => s + ((r.listings?.price_per_day ?? 0) * (r.start_date && r.end_date ? diffDays(r.start_date, r.end_date) : 1)), 0);
  const moneySaved = totalSpent * 10;
  const co2Saved   = totalDays * 2.4;
  const unrated    = accepted.filter((r) => !rated.has(r.id));

  function handleRated(id: string) {
    setRated((prev) => new Set([...prev, id]));
    setRatingFor(null);
  }

  return (
    <div>
      {/* Full-width tabs */}
      <div className="grid grid-cols-2 gap-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-1.5 mb-8">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === key ? "bg-[#143D60] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Summary ── */}
      {tab === "summary" && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Rentals",  value: String(accepted.length), note: "completed" },
              { label: "Days Outside",   value: `${totalDays}`, note: "days rented" },
              { label: "Money Saved",    value: `$${moneySaved.toFixed(0)}`, note: "vs buying new" },
              { label: "CO₂ Avoided",   value: `${co2Saved.toFixed(1)} kg`, note: "est. impact" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-300">
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#27667B] mb-3">{stat.label}</p>
                <p className="text-3xl font-bold text-[#143D60] leading-none mb-1">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.note}</p>
              </div>
            ))}
          </div>

          {/* Impact banner */}
          <div className="rounded-2xl bg-[#143D60] text-white p-7 relative overflow-hidden">
            {/* Decorative circle */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-[#DDEB9D]/10" />
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-white/50 mb-2 relative">Your impact</p>
            <p className="text-2xl font-bold mb-2 relative">
              {totalDays === 0 ? "Start renting to track your impact" : `${co2Saved.toFixed(1)} kg CO₂ avoided`}
            </p>
            <p className="text-sm text-white/70 leading-relaxed relative max-w-lg">
              {totalDays === 0
                ? "Every rental is gear that didn't need to be manufactured new. Even one rental makes a difference."
                : `Renting instead of buying for ${totalDays} day${totalDays !== 1 ? "s" : ""} kept roughly ${co2Saved.toFixed(1)} kg of CO₂ out of the atmosphere — that's like avoiding ${(co2Saved / 4.6).toFixed(1)} km of driving.`}
            </p>
          </div>

          {/* Unrated nudge */}
          {unrated.length > 0 && (
            <div className="rounded-2xl border border-[#DDEB9D] bg-gradient-to-br from-[#FAFFF5] to-white p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#143D60]">
                  {unrated.length} rental{unrated.length > 1 ? "s" : ""} waiting for a rating
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Help the community by sharing your experience.</p>
              </div>
              <button onClick={() => setTab("history")}
                className="flex-shrink-0 bg-[#DDEB9D] text-[#143D60] font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200">
                Rate now
              </button>
            </div>
          )}

          {/* Empty state */}
          {accepted.length === 0 && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F0F7F4] flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#27667B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="font-bold text-[#143D60] mb-1">No rentals yet</p>
              <p className="text-sm text-gray-400 mb-5">Find gear for your next adventure on campus.</p>
              <Link href="/browse" className="bg-[#143D60] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#27667B] transition-colors duration-200 text-sm">
                Browse gear
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── History ── */}
      {tab === "history" && (
        <div className="space-y-4">
          {requests.length === 0 && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
              <p className="font-bold text-[#143D60] mb-1">No rental history</p>
              <p className="text-sm text-gray-400 mb-5">Your requests will appear here once youve made them.</p>
              <Link href="/browse" className="bg-[#143D60] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#27667B] transition-colors duration-200 text-sm">
                Start browsing
              </Link>
            </div>
          )}

          {requests.map((r) => {
            const listing = r.listings;
            const owner   = unwrapUser(listing?.users ?? null);
            const days    = r.start_date && r.end_date ? diffDays(r.start_date, r.end_date) : null;
            const total   = days && listing?.price_per_day ? days * listing.price_per_day : null;
            const canRate = r.status === "accepted" && !rated.has(r.id);

            return (
              <div key={r.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="flex gap-4 p-5">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {listing?.image_url
                      ? <Image src={listing.image_url} alt={listing.title} fill className="object-cover" sizes="80px" />
                      : <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/gear/${listing?.id}`} className="font-bold text-[#143D60] hover:text-[#27667B] transition-colors duration-200 text-sm block truncate">
                          {listing?.title ?? "Listing"}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{CATEGORY_LABELS[listing?.category ?? ""] ?? listing?.category}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${STATUS_STYLES[r.status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {r.start_date && r.end_date && (
                        <span className="text-xs text-gray-400">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</span>
                      )}
                      {days && <span className="text-xs text-gray-400">{days} day{days !== 1 ? "s" : ""}</span>}
                      {total && <span className="text-xs font-bold text-[#143D60]">${total.toFixed(2)}</span>}
                    </div>
                    {owner && (
                      <Link href={`/profile/${owner.id}`} className="text-xs text-[#27667B] mt-1.5 inline-block hover:underline">
                        Owner: {owner.full_name}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-4 flex gap-2">
                  <Link href={`/requests/${r.id}`}
                    className="flex-1 text-center border border-[#143D60] text-[#143D60] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#143D60] hover:text-white transition-all duration-200">
                    View request
                  </Link>
                  {canRate && (
                    <button onClick={() => setRatingFor(r)}
                      className="flex-1 bg-[#DDEB9D] text-[#143D60] font-bold py-2.5 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200">
                      Rate
                    </button>
                  )}
                </div>
                {r.status === "accepted" && rated.has(r.id) && (
                  <div className="px-5 pb-1">
                    <p className="text-xs text-center text-gray-400">Rated — thanks for your feedback</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ratingFor && (
        <RatingModal request={ratingFor} userId={userId}
          onClose={() => setRatingFor(null)} onSubmit={handleRated} />
      )}
    </div>
  );
}