"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { OwnerListing, OwnerRequest, OwnerRating, ListingUser } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_LABELS: Record<string, string> = {
  skiing: "Skiing", snowboarding: "Snowboarding", hiking: "Hiking",
  camping: "Camping", climbing: "Climbing", "water-sports": "Water Sports",
  cycling: "Cycling", fishing: "Fishing",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function diffDays(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}
function initials(name: string) {
  return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
}
function unwrapUser(u: ListingUser | ListingUser[] | null | undefined): ListingUser | null {
  if (!u) return null;
  return Array.isArray(u) ? (u[0] ?? null) : u;
}

// ── Chart ─────────────────────────────────────────────────────────────────────

function EarningsChart({ monthlyData }: { monthlyData: number[] }) {
  const max  = Math.max(...monthlyData, 1);
  const barW = 24;
  const gap  = 8;
  const chartH = 80;
  const totalW = MONTHS.length * (barW + gap);
  const currentMonth = new Date().getMonth();

  return (
    <div className="overflow-x-auto pb-1">
      <svg width={totalW} height={chartH + 32} className="block">
        {monthlyData.map((val, i) => {
          const barH = Math.max(2, (val / max) * chartH);
          const x = i * (barW + gap);
          const y = chartH - barH;
          const isCurrent = i === currentMonth;
          return (
            <g key={i}>
              <rect x={x} y={0} width={barW} height={chartH} rx={4} fill="#F9FAFB" />
              <rect x={x} y={y} width={barW} height={barH} rx={4}
                fill={isCurrent ? "#143D60" : val > 0 ? "#DDEB9D" : "#F3F4F6"} />
              {val > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={8} fill="#27667B" fontWeight="600">
                  ${val}
                </text>
              )}
              <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize={9}
                fill={isCurrent ? "#143D60" : "#9CA3AF"} fontWeight={isCurrent ? "700" : "400"}>
                {MONTHS[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────

function RequestCard({ request, onStatusChange }: {
  request: OwnerRequest;
  onStatusChange: (id: string, status: "accepted" | "declined") => void;
}) {
  const [comment, setComment] = useState(request.owner_comment ?? "");
  const [saving,  setSaving]  = useState(false);

  const requester = unwrapUser(request.users);
  const listing   = request.listings;
  const days      = request.start_date && request.end_date ? diffDays(request.start_date, request.end_date) : null;
  const earning   = days && listing?.price_per_day ? days * listing.price_per_day : null;

  const STATUS_BADGE: Record<string, string> = {
    pending:  "bg-yellow-50 text-yellow-700 border-yellow-200",
    accepted: "bg-[#F0F7F4] text-[#27667B] border-[#A0C878]",
    declined: "bg-red-50 text-red-600 border-red-200",
  };

  const STATUS_ACCENT: Record<string, string> = {
    pending:  "border-l-4 border-l-yellow-300",
    accepted: "border-l-4 border-l-[#A0C878]",
    declined: "border-l-4 border-l-red-300",
  };

  async function updateStatus(status: "accepted" | "declined") {
    setSaving(true);
    const action = status === "accepted" ? "accept" : "decline";
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const res = await fetch(`/api/requests/${request.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) { setSaving(false); return; }

    await supabase.from("requests").update({ owner_comment: comment.trim() || null }).eq("id", request.id);
    onStatusChange(request.id, status);
    setSaving(false);
  }

  const accentClass = STATUS_ACCENT[request.status] ?? "border-l-4 border-l-gray-100";

  return (
    <div className={`rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 ${accentClass}`}>
      <div className="p-5">
        {request.status === "pending" && (
          <div className="flex items-center gap-2 mb-4 bg-yellow-50 rounded-xl px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
            <p className="text-xs font-semibold text-yellow-700">Awaiting your response</p>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            {listing?.image_url
              ? <Image src={listing.image_url} alt={listing.title ?? ""} fill className="object-cover" sizes="64px" />
              : <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-[#143D60] text-sm truncate">{listing?.title}</p>
                {request.start_date && request.end_date && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fmtDate(request.start_date)} – {fmtDate(request.end_date)}
                    {days && ` · ${days} day${days !== 1 ? "s" : ""}`}
                  </p>
                )}
                {earning && (
                  <p className="text-xs font-bold text-[#27667B] mt-0.5">${earning.toFixed(2)} potential</p>
                )}
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0 ${STATUS_BADGE[request.status] ?? ""}`}>
                {request.status}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-[10px] shrink-0">
                {requester ? initials(requester.full_name) : "?"}
              </div>
              <div>
                <Link href={`/profile/${requester?.id}`} className="text-xs font-bold text-[#143D60] hover:text-[#27667B] transition-colors duration-200">
                  {requester?.full_name ?? "Unknown renter"}
                </Link>
                <p className="text-[10px] text-gray-400">Requested {fmtDate(request.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#143D60] mb-1.5">
                Message to renter <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                rows={2} maxLength={300}
                placeholder="Any details or instructions for the renter..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#143D60] transition-colors duration-200 resize-none placeholder-gray-300"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => updateStatus("declined")} disabled={saving}
                className="flex-1 border border-red-200 text-red-500 font-semibold py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors duration-200 disabled:opacity-50">
                Decline
              </button>
              <button onClick={() => updateStatus("accepted")} disabled={saving}
                className="flex-1 bg-[#143D60] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-50">
                {saving ? "Saving..." : "Accept"}
              </button>
            </div>
          </div>
        )}

        {request.owner_comment && request.status !== "pending" && (
          <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5 font-semibold uppercase tracking-wider">Your message</p>
            <p className="text-sm text-gray-600">{request.owner_comment}</p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Link href={`/requests/${request.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#27667B] hover:text-[#143D60] transition-colors duration-200">
            View full request
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type OwnerTab = "summary" | "requests" | "listings";

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OwnerDashboard({ listings, requests, ownerRatings, stripeChargesEnabled }: {
  listings: OwnerListing[];
  requests: OwnerRequest[];
  ownerRatings: OwnerRating[];
  userId: string;
  stripeChargesEnabled: boolean;
}) {
  const [tab,         setTab]         = useState<OwnerTab>("summary");
  const [requestList, setRequestList] = useState<OwnerRequest[]>(requests);
  const [listingList, setListingList] = useState<OwnerListing[]>(listings);
  // stripe connect isn't live yet, see the coming soon banner below

  const accepted        = requestList.filter((r) => r.status === "accepted");
  const pendingCount    = requestList.filter((r) => r.status === "pending").length;
  const activeListings  = listingList.filter((l) => l.available).length;
  const potentialPerDay = listingList.filter((l) => l.available).reduce((s, l) => s + l.price_per_day, 0);
  const totalEarnings   = accepted.reduce((s, r) => {
    const days = r.start_date && r.end_date ? diffDays(r.start_date, r.end_date) : 1;
    return s + ((r.listings?.price_per_day ?? 0) * days);
  }, 0);
  const avgOwnerRating = ownerRatings.length
    ? ownerRatings.reduce((s, r) => s + (r.owner_rating ?? 0), 0) / ownerRatings.length
    : null;

  const currentYear = new Date().getFullYear();
  const monthlyEarnings = Array(12).fill(0) as number[];
  for (const r of accepted) {
    if (!r.start_date) continue;
    const d = new Date(r.start_date);
    if (d.getFullYear() !== currentYear) continue;
    const days = r.start_date && r.end_date ? diffDays(r.start_date, r.end_date) : 1;
    monthlyEarnings[d.getMonth()] += (r.listings?.price_per_day ?? 0) * days;
  }

  async function toggleAvailable(id: string, current: boolean) {
    setListingList((prev) => prev.map((l) => l.id === id ? { ...l, available: !current } : l));
    await supabase.from("listings").update({ available: !current }).eq("id", id);
  }

  async function removeListing(id: string) {
    if (!confirm("Remove this listing? This cannot be undone.")) return;
    setListingList((prev) => prev.filter((l) => l.id !== id));
    await supabase.from("listing_images").delete().eq("listing_id", id);
    await supabase.from("listings").delete().eq("id", id);
  }

  function handleStatusChange(id: string, status: "accepted" | "declined") {
    setRequestList((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  const TABS: { key: OwnerTab; label: string; badge?: number }[] = [
    { key: "summary",  label: "Business Summary" },
    { key: "requests", label: "Requests", badge: pendingCount },
    { key: "listings", label: "My Gear" },
  ];

  // Stat border helper for the unified card layout
  function statBorder(i: number) {
    if (i === 0) return "";
    if (i === 1) return "border-l border-gray-100";
    if (i === 2) return "border-t border-gray-100 lg:border-t-0 lg:border-l lg:border-gray-100";
    return "border-t border-l border-gray-100 lg:border-t-0";
  }

  const STATS = [
    { label: "Total Earnings",  value: `$${totalEarnings.toFixed(0)}`,                                        note: "from accepted rentals" },
    { label: "Active Listings", value: String(activeListings),                                                  note: `of ${listingList.length} total` },
    { label: "Potential/Day",   value: `$${potentialPerDay.toFixed(0)}`,                                       note: "if all rented" },
    { label: "Owner Rating",    value: avgOwnerRating ? `${avgOwnerRating.toFixed(1)} / 5` : "—",             note: avgOwnerRating ? `${ownerRatings.length} review${ownerRatings.length !== 1 ? "s" : ""}` : "No ratings yet" },
  ];

  return (
    <div>
      {/* Underline tab nav */}
      <div className="flex border-b border-gray-100 mb-8">
        {TABS.map(({ key, label, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`relative px-1 pb-3 mr-7 text-sm font-semibold border-b-2 -mb-px transition-all duration-200 ${
              tab === key
                ? "border-[#143D60] text-[#143D60]"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
            }`}>
            {label}
            {badge != null && badge > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Requests tab ── */}
      {tab === "requests" && (
        <div className="space-y-3">
          {pendingCount > 0 && (
            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              <p className="text-sm font-semibold text-yellow-800">
                {pendingCount} request{pendingCount > 1 ? "s" : ""} waiting for your response
              </p>
            </div>
          )}

          {requestList.length === 0 && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F0F7F4] flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#27667B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="font-bold text-[#143D60] mb-1">No requests yet</p>
              <p className="text-sm text-gray-400">When renters request your gear, they&apos;ll show up here.</p>
            </div>
          )}

          {[...requestList]
            .sort((a, b) => {
              const ORDER: Record<string, number> = { active: 0, accepted: 1, pending: 2, completed: 3, closed: 4, cancelled: 5, declined: 6 };
              const sd = (ORDER[a.status] ?? 7) - (ORDER[b.status] ?? 7);
              if (sd !== 0) return sd;
              const aDate = a.start_date ?? a.created_at ?? "";
              const bDate = b.start_date ?? b.created_at ?? "";
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            })
            .map((r) => (
              <RequestCard key={r.id} request={r} onStatusChange={handleStatusChange} />
            ))}
        </div>
      )}

      {/* ── My Gear / Listings tab ── */}
      {tab === "listings" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm text-gray-500">
                {listingList.length} listing{listingList.length !== 1 ? "s" : ""}
              </p>
              {potentialPerDay > 0 && (
                <p className="text-xs text-[#27667B] font-semibold mt-0.5">
                  ${potentialPerDay}/day if all rented simultaneously
                </p>
              )}
            </div>
            <Link href="/post-gear"
              className="bg-[#143D60] text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200">
              + Add gear
            </Link>
          </div>

          {listingList.length === 0 && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F0F7F4] flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#27667B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="font-bold text-[#143D60] mb-1">No listings yet</p>
              <p className="text-sm text-gray-400 mb-5">Post gear you own and start earning.</p>
              <Link href="/post-gear" className="bg-[#DDEB9D] text-[#143D60] font-bold px-6 py-3 rounded-xl hover:bg-[#A0C878] transition-colors duration-200 text-sm">
                Post your first gear
              </Link>
            </div>
          )}

          {listingList.map((l) => (
            <div key={l.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="flex gap-4 p-5">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {l.image_url
                    ? <Image src={l.image_url} alt={l.title} fill className="object-cover" sizes="80px" />
                    : <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/gear/${l.id}`} className="font-bold text-[#143D60] hover:text-[#27667B] transition-colors duration-200 text-sm block truncate">
                        {l.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {CATEGORY_LABELS[l.category] ?? l.category} · {l.condition}
                      </p>
                      <p className="text-sm font-bold text-[#143D60] mt-1">${l.price_per_day}/day</p>
                    </div>
                    {/* Availability toggle */}
                    <button
                      onClick={() => toggleAvailable(l.id, l.available)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 shrink-0 ${
                        l.available
                          ? "bg-[#F0F7F4] border-[#A0C878] text-[#27667B] hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                          : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-[#F0F7F4] hover:border-[#A0C878] hover:text-[#27667B]"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${l.available ? "bg-[#27667B]" : "bg-gray-300"}`} />
                      {l.available ? "Live" : "Paused"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Link href={`/edit-gear/${l.id}`}
                      className="text-xs font-semibold border border-[#143D60] text-[#143D60] px-3 py-1.5 rounded-xl hover:bg-[#143D60] hover:text-white transition-all duration-200">
                      Edit
                    </Link>
                    <button onClick={() => removeListing(l.id)}
                      className="text-xs font-semibold border border-red-200 text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-all duration-200">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Summary tab ── */}
      {tab === "summary" && (
        <div className="space-y-6">
          {/* Payouts status */}
          {stripeChargesEnabled ? (
            <div className="rounded-2xl bg-[#F0F7F4] border border-[#A0C878] p-5 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#27667B] shrink-0" />
              <p className="text-sm font-semibold text-[#27667B]">Payouts are active — accepted rentals pay out automatically.</p>
            </div>
          ) : (
            // no "set up payouts" button here since stripe isn't configured yet
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-amber-800">Automatic payouts are coming soon</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Until then, agree on payment with your renter directly when you accept a request.
                </p>
              </div>
              <div className="shrink-0 bg-gray-100 text-gray-400 font-bold px-4 py-2.5 rounded-xl text-sm cursor-not-allowed">
                Coming soon
              </div>
            </div>
          )}

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

          {/* Earnings chart */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-1">Earnings {currentYear}</p>
                <p className="text-2xl font-bold text-[#143D60]">${totalEarnings.toFixed(0)}</p>
              </div>
              <p className="text-sm text-gray-400">Year to date</p>
            </div>
            <EarningsChart monthlyData={monthlyEarnings.map((v) => Math.round(v))} />
            <div className="flex items-center gap-5 mt-5 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-[#DDEB9D] inline-block" /> Earnings</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-[#143D60] inline-block" /> This month</span>
            </div>
          </div>

          {/* Pending nudge */}
          {pendingCount > 0 && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                <div>
                  <p className="text-sm font-bold text-yellow-800">
                    {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-yellow-600 mt-0.5">Renters are waiting for your response.</p>
                </div>
              </div>
              <button onClick={() => setTab("requests")}
                className="shrink-0 bg-[#143D60] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200">
                Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
