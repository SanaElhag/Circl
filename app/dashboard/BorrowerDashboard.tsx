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

function categoryLabel(l: { category: string; categories: string[] | null } | null | undefined) {
  if (!l) return "";
  return (l.categories?.length ? l.categories : [l.category])
    .map((c) => CATEGORY_LABELS[c] ?? c)
    .join(" · ");
}

// Rental history is grouped by this, not the raw db status — an "accepted"
// request whose end date has passed reads a lot better as "Completed"
type HistoryGroup = "pending" | "accepted" | "completed" | "declined" | "cancelled";

const GROUP_META: Record<HistoryGroup, { label: string; dot: string; defaultOpen: boolean }> = {
  pending:   { label: "Pending",   dot: "bg-yellow-400",  defaultOpen: true },
  accepted:  { label: "Accepted",  dot: "bg-[#A0C878]",   defaultOpen: true },
  completed: { label: "Completed", dot: "bg-[#27667B]",   defaultOpen: true },
  declined:  { label: "Declined",  dot: "bg-red-400",     defaultOpen: false },
  cancelled: { label: "Cancelled", dot: "bg-gray-400",    defaultOpen: false },
};

const GROUP_ORDER: HistoryGroup[] = ["pending", "accepted", "completed", "declined", "cancelled"];

function groupForRequest(r: BorrowerRequest): HistoryGroup {
  if (r.status === "accepted" || r.status === "active") {
    return r.end_date && new Date(r.end_date) < new Date() ? "completed" : "accepted";
  }
  if (r.status === "completed" || r.status === "closed") return "completed";
  return r.status;
}

function sortByDateDesc<T extends { start_date?: string | null; created_at?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aDate = a.start_date ?? a.created_at ?? "";
    const bDate = b.start_date ?? b.created_at ?? "";
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
}

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
  const [gearRating,   setGearRating]   = useState(0);
  const [ownerRating,  setOwnerRating]  = useState(0);
  const [gearComment,  setGearComment]  = useState("");
  const [ownerComment, setOwnerComment] = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const listing = request.listings;
  const owner   = unwrapUser(listing?.users ?? null);

  async function handleSubmit() {
    if (!gearRating)  return setError("Please rate the gear.");
    if (!ownerRating) return setError("Please rate the gear owner.");
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
              placeholder="Condition, what was included, anything useful for the next borrower..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#143D60] transition-colors duration-200 resize-none placeholder-gray-300 bg-white"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
          <p className="text-sm font-semibold text-[#143D60]">
            How was {owner?.full_name ?? "the gear owner"}?
          </p>
          <StarPicker value={ownerRating} onChange={setOwnerRating} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Gear owner comment <span className="text-gray-300 normal-case font-normal">(optional)</span>
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

// ── History card ──────────────────────────────────────────────────────────────

function HistoryCard({ r, canRate, rated, onRate }: {
  r: BorrowerRequest;
  canRate: boolean;
  rated: boolean;
  onRate: () => void;
}) {
  const listing = r.listings;
  const owner   = unwrapUser(listing?.users ?? null);
  const days    = r.start_date && r.end_date ? diffDays(r.start_date, r.end_date) : null;
  const total   = days && listing?.price_per_day ? days * listing.price_per_day : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">
      <div className="relative w-full aspect-[4/3] bg-gray-100 shrink-0">
        {listing?.image_url
          ? <Image src={listing.image_url} alt={listing.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
          : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/gear/${listing?.id}`} className="font-bold text-[#143D60] hover:text-[#27667B] transition-colors duration-200 text-sm block truncate">
          {listing?.title ?? "Listing"}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">{categoryLabel(listing)}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {r.start_date && r.end_date && (
            <span className="text-xs text-gray-400">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</span>
          )}
          {days && <span className="text-xs text-gray-400">{days} day{days !== 1 ? "s" : ""}</span>}
        </div>
        {total && <p className="text-sm font-bold text-[#143D60] mt-1">${total.toFixed(2)}</p>}
        {owner && (
          <Link href={`/profile/${owner.id}`} className="text-xs text-[#27667B] mt-1.5 inline-block hover:underline">
            Gear owner: {owner.full_name}
          </Link>
        )}

        <div className="mt-auto pt-3 flex gap-2">
          <Link href={`/requests/${r.id}`}
            className="flex-1 text-center border border-[#143D60] text-[#143D60] font-semibold py-2 rounded-xl text-xs hover:bg-[#143D60] hover:text-white transition-all duration-200">
            View request
          </Link>
          {canRate && (
            <button onClick={onRate}
              className="flex-1 bg-[#DDEB9D] text-[#143D60] font-bold py-2 rounded-xl text-xs hover:bg-[#A0C878] transition-colors duration-200">
              Rate
            </button>
          )}
        </div>
        {!canRate && rated && (
          <p className="text-[11px] text-center text-gray-400 mt-2">Rated, thanks for your feedback</p>
        )}
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
  const [tab,         setTab]         = useState<BorrowerTab>("summary");
  const [rated,       setRated]       = useState<Set<string>>(new Set(ratedRequestIds));
  const [ratingFor,   setRatingFor]   = useState<BorrowerRequest | null>(null);
  const [openGroups,  setOpenGroups]  = useState<Set<HistoryGroup>>(
    () => new Set(GROUP_ORDER.filter((g) => GROUP_META[g].defaultOpen))
  );

  // any request that was ever accepted counts toward spend/impact, whether
  // the rental has since gone active/completed/closed or is still just
  // accepted - filtering on "accepted" alone meant these stats dropped a
  // rental as soon as it actually progressed, which is backwards
  const EARNING_STATUSES = new Set(["accepted", "active", "completed", "closed"]);
  const accepted   = requests.filter((r) => EARNING_STATUSES.has(r.status));
  const completed  = requests.filter((r) => groupForRequest(r) === "completed");
  const totalDays  = accepted.reduce((s, r) => s + (r.start_date && r.end_date ? diffDays(r.start_date, r.end_date) : 1), 0);
  const totalSpent = accepted.reduce((s, r) => s + ((r.listings?.price_per_day ?? 0) * (r.start_date && r.end_date ? diffDays(r.start_date, r.end_date) : 1)), 0);
  const moneySaved = totalSpent * 10;
  const co2Saved   = totalDays * 2.4;
  const unrated    = completed.filter((r) => !rated.has(r.id));

  function handleRated(id: string) {
    setRated((prev) => new Set([...prev, id]));
    setRatingFor(null);
  }

  function toggleGroup(g: HistoryGroup) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  }

  // Stat border helper for the unified card layout
  function statBorder(i: number) {
    if (i === 0) return "";
    if (i === 1) return "border-l border-gray-100";
    if (i === 2) return "border-t border-gray-100 lg:border-t-0 lg:border-l lg:border-gray-100";
    return "border-t border-l border-gray-100 lg:border-t-0";
  }

  const STATS = [
    { label: "Total Rentals",  value: String(accepted.length), note: "completed" },
    { label: "Days Outside",   value: `${totalDays}`,          note: "days rented" },
    { label: "Money Saved",    value: `$${moneySaved.toFixed(0)}`, note: "vs buying new" },
    { label: "CO₂ Avoided",   value: `${co2Saved.toFixed(1)} kg`, note: "est. impact" },
  ];

  return (
    <div>
      {/* Underline tab nav */}
      <div className="flex border-b border-gray-100 mb-8">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-1 pb-3 mr-7 text-sm font-semibold border-b-2 -mb-px transition-all duration-200 ${
              tab === key
                ? "border-[#143D60] text-[#143D60]"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Summary ── */}
      {tab === "summary" && (
        <div className="space-y-6">
          {/* Stats — unified card with internal dividers */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {STATS.map((stat, i) => (
                <div key={stat.label} className={`p-5 ${statBorder(i)}`}>
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#27667B] mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#143D60] leading-none mb-0.5">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Impact banner */}
          <div className="rounded-2xl bg-[#143D60] text-white p-7 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-[#DDEB9D]/10" />
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-white/50 mb-2 relative">Your impact</p>
            <p className="text-2xl font-bold mb-2 relative">
              {totalDays === 0 ? "Start renting to track your impact" : `${co2Saved.toFixed(1)} kg CO₂ avoided`}
            </p>
            <p className="text-sm text-white/70 leading-relaxed relative max-w-lg">
              {totalDays === 0
                ? "Every rental is gear that didn't need to be manufactured new. Even one rental makes a difference."
                : `Renting instead of buying for ${totalDays} day${totalDays !== 1 ? "s" : ""} kept roughly ${co2Saved.toFixed(1)} kg of CO₂ out of the atmosphere. That's like avoiding ${(co2Saved / 4.6).toFixed(1)} km of driving.`}
            </p>
          </div>

          {/* Unrated nudge */}
          {unrated.length > 0 && (
            <div className="rounded-2xl border border-[#DDEB9D] bg-linear-to-br from-[#FAFFF5] to-white p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#143D60]">
                  {unrated.length} rental{unrated.length > 1 ? "s" : ""} waiting for a rating
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Help the community by sharing your experience.</p>
              </div>
              <button onClick={() => setTab("history")}
                className="shrink-0 bg-[#DDEB9D] text-[#143D60] font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200">
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
              <p className="text-sm text-gray-400 mb-5">Your requests will appear here once you&apos;ve made them.</p>
              <Link href="/browse" className="bg-[#143D60] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#27667B] transition-colors duration-200 text-sm">
                Start browsing
              </Link>
            </div>
          )}

          {GROUP_ORDER.map((group) => {
            const items = sortByDateDesc(requests.filter((r) => groupForRequest(r) === group));
            if (items.length === 0) return null;
            const meta = GROUP_META[group];
            const isOpen = openGroups.has(group);

            return (
              <div key={group} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <span className="text-sm font-bold text-[#143D60]">{meta.label}</span>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {items.map((r) => (
                      <HistoryCard
                        key={r.id}
                        r={r}
                        canRate={groupForRequest(r) === "completed" && !rated.has(r.id)}
                        rated={rated.has(r.id)}
                        onRate={() => setRatingFor(r)}
                      />
                    ))}
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
