"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLACEHOLDER_IMAGE =
  "https://www.panoramaresort.com/assets/Tourism-Operators/images/c5b7661811/Chels-in-Pano-1764-of-2356__FocusFillWyIwLjAwIiwiMC4wMCIsMTgwMCwxMDgwXQ.jpg";

const CATEGORY_LABELS: Record<string, string> = {
  skiing: "Skiing", snowboarding: "Snowboarding", hiking: "Hiking",
  camping: "Camping", climbing: "Climbing", "water-sports": "Water Sports",
  cycling: "Cycling", fishing: "Fishing",
};

const CONDITION_COLORS: Record<string, string> = {
  "New":      "bg-[#DDEB9D] text-[#143D60]",
  "Like new": "bg-[#A0C878]/20 text-[#27667B]",
  "Good":     "bg-blue-50 text-blue-700",
  "Fair":     "bg-yellow-50 text-yellow-700",
  "Worn":     "bg-gray-100 text-gray-500",
};

interface ProfileUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface Listing {
  id: string;
  title: string;
  category: string;
  price_per_day: number;
  condition: string;
  image_url: string | null;
  available: boolean;
  description: string | null;
}

interface Rating {
  owner_rating: number | null;
  gear_rating: number | null;
  comment: string | null;
  created_at: string;
  rater: { full_name: string } | null;
  listing: { title: string } | null;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function StarRow({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(value);
        const partial = !filled && star === Math.ceil(value) && value % 1 !== 0;
        return (
          <span key={star} className={`relative inline-block ${sz}`}>
            <svg className={`${sz} text-gray-200`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {(filled || partial) && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: filled ? "100%" : `${(value % 1) * 100}%` }}>
                <svg className={`${sz} text-[#DDEB9D]`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const profileId = params.id as string;

  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      // Current user (for "is this me?" check)
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);

      // Profile user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, full_name, email, created_at")
        .eq("id", profileId)
        .single();

      if (userError || !userData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(userData);

      // Listings (only available ones for public profile)
      const { data: listingData } = await supabase
        .from("listings")
        .select("id, title, category, price_per_day, condition, image_url, available, description")
        .eq("user_id", profileId)
        .eq("available", true)
        .order("created_at", { ascending: false });

      setListings(listingData ?? []);

      // Ratings received as owner
      const { data: ratingData } = await supabase
        .from("ratings")
        .select(`
          owner_rating, gear_rating, comment, created_at,
          users!ratings_rater_id_fkey ( full_name ),
          listings!ratings_listing_id_fkey ( title )
        `)
        .eq("ratee_id", profileId)
        .order("created_at", { ascending: false });

      const normalised = (ratingData ?? []).map((r: {
        owner_rating: number | null;
        gear_rating: number | null;
        comment: string | null;
        created_at: string;
        users: { full_name: string } | { full_name: string }[] | null;
        listings: { title: string } | { title: string }[] | null;
      }) => ({
        owner_rating: r.owner_rating,
        gear_rating: r.gear_rating,
        comment: r.comment,
        created_at: r.created_at,
        rater: r.users ? (Array.isArray(r.users) ? r.users[0] : r.users) : null,
        listing: r.listings ? (Array.isArray(r.listings) ? r.listings[0] : r.listings) : null,
      }));
      setRatings(normalised);

      setLoading(false);
    }
    load();
  }, [profileId]);

  if (loading || currentUser === undefined) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">This profile doesn&apos;t exist.</p>
        <Link href="/browse" className="text-sm text-[#27667B] underline">Back to browse</Link>
      </main>
    );
  }

  const isOwnProfile = currentUser?.id === profileId;
  const avgRating = ratings.length
    ? ratings.reduce((s, r) => s + (r.owner_rating ?? 0), 0) / ratings.length
    : null;
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-CA", {
    month: "long", year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Back button */}
        <div className="mb-6">
          <Link href="/browse" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#143D60] transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Browse
          </Link>
        </div>

        {/* ── Profile header ── */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Decorative top stripe */}
          <div className="h-2 bg-gradient-to-r from-[#143D60] via-[#27667B] to-[#A0C878]" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-2xl flex-shrink-0 shadow-sm">
                {initials(profile.full_name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#143D60]">
                      {profile.full_name}
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">UFV Community Member · {memberSince}</p>
                  </div>
                  {isOwnProfile && (
                    <Link
                      href="/account-settings"
                      className="flex items-center gap-1.5 text-xs font-semibold border border-gray-200 text-gray-500 px-3 py-1.5 rounded-xl hover:border-[#143D60] hover:text-[#143D60] transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Edit profile
                    </Link>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-5 mt-4">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-[#143D60]">{listings.length}</span>
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400">
                      {listings.length === 1 ? "Listing" : "Listings"}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-[#143D60]">{ratings.length}</span>
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400">
                      {ratings.length === 1 ? "Review" : "Reviews"}
                    </span>
                  </div>
                  {avgRating !== null && (
                    <>
                      <div className="w-px h-8 bg-gray-100" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl font-bold text-[#143D60]">{avgRating.toFixed(1)}</span>
                          <StarRow value={avgRating} size="sm" />
                        </div>
                        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400">Avg rating</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="w-2 h-2 rounded-full bg-[#A0C878]" />
                    <span className="text-xs text-gray-400">Verified UFV</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Own profile quick actions ── */}
        {isOwnProfile && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <Link href="/post-gear"
              className="flex items-center gap-3 bg-[#143D60] text-white rounded-2xl px-5 py-4 hover:bg-[#27667B] transition-colors duration-200 group">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-bold">Post gear</span>
            </Link>
            <Link href="/dashboard"
              className="flex items-center gap-3 bg-white border border-gray-100 text-[#143D60] rounded-2xl px-5 py-4 hover:border-[#143D60] transition-colors duration-200 shadow-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-sm font-bold">Dashboard</span>
            </Link>
            <Link href="/browse"
              className="flex items-center gap-3 bg-white border border-gray-100 text-[#143D60] rounded-2xl px-5 py-4 hover:border-[#143D60] transition-colors duration-200 shadow-sm col-span-2 sm:col-span-1">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <span className="text-sm font-bold">Browse gear</span>
            </Link>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="grid grid-cols-2 gap-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-1.5 mb-6">
          <button
            onClick={() => setActiveTab("listings")}
            className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "listings" ? "bg-[#143D60] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Gear Listed ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "reviews" ? "bg-[#143D60] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Reviews ({ratings.length})
          </button>
        </div>

        {/* ── Listings tab ── */}
        {activeTab === "listings" && (
          <>
            {listings.length === 0 ? (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-16 text-center">
                <div className="w-14 h-14 rounded-full bg-[#F0F7F4] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#27667B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="font-bold text-[#143D60] mb-1">No active listings</p>
                <p className="text-sm text-gray-400 mb-5">
                  {isOwnProfile ? "Post your first piece of gear to start earning." : "This member hasn't listed any gear yet."}
                </p>
                {isOwnProfile && (
                  <Link href="/post-gear"
                    className="inline-block bg-[#143D60] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#27667B] transition-colors duration-200 text-sm">
                    Post gear
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={item.image_url ?? PLACEHOLDER_IMAGE}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <span className="absolute top-3 right-3 rounded-full bg-black/30 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-white capitalize">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                      {item.condition && (
                        <span className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${CONDITION_COLORS[item.condition] ?? "bg-gray-100 text-gray-600"}`}>
                          {item.condition}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-[#143D60]/0 group-hover:bg-[#143D60]/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                        <Link href={`/gear/${item.id}`}
                          className="rounded-xl bg-[#143D60] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[#27667B] transition-colors duration-200">
                          Request dates
                        </Link>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="font-bold text-[#143D60] text-sm leading-snug">{item.title}</p>
                      {item.description && (
                        <p className="mt-1 text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
                      )}
                      <div className="flex-1" />
                      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-base font-bold text-[#143D60]">
                          ${item.price_per_day}
                          <span className="text-xs font-normal text-gray-400"> / day</span>
                        </span>
                        <Link href={`/gear/${item.id}`}
                          className="text-xs font-semibold text-[#27667B] hover:text-[#143D60] transition-colors duration-200">
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Reviews tab ── */}
        {activeTab === "reviews" && (
          <>
            {/* Summary bar */}
            {ratings.length > 0 && avgRating !== null && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="text-center sm:pr-6 sm:border-r sm:border-gray-100">
                  <p className="text-5xl font-bold text-[#143D60]">{avgRating.toFixed(1)}</p>
                  <StarRow value={avgRating} size="lg" />
                  <p className="text-xs text-gray-400 mt-1">{ratings.length} review{ratings.length !== 1 ? "s" : ""}</p>
                </div>
                {/* Distribution bars */}
                <div className="flex-1 w-full space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratings.filter((r) => Math.round(r.owner_rating ?? 0) === star).length;
                    const pct = ratings.length ? (count / ratings.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-3">{star}</span>
                        <svg className="w-3 h-3 text-[#DDEB9D]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#DDEB9D] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {ratings.length === 0 ? (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-16 text-center">
                <div className="w-14 h-14 rounded-full bg-[#F0F7F4] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#27667B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="font-bold text-[#143D60] mb-1">No reviews yet</p>
                <p className="text-sm text-gray-400">
                  {isOwnProfile ? "Reviews will appear here after your first rental." : "This member hasn't received any reviews yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.map((r, i) => (
                  <div key={i} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-xs flex-shrink-0">
                          {r.rater ? initials(r.rater.full_name) : "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#143D60]">{r.rater?.full_name ?? "Circl Member"}</p>
                          {r.listing && (
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">re: {r.listing.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {r.owner_rating !== null && (
                          <StarRow value={r.owner_rating} size="sm" />
                        )}
                        <p className="text-[10px] text-gray-400">
                          {new Date(r.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                    )}
                    {!r.comment && (
                      <p className="text-xs text-gray-300 italic">No written review.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}