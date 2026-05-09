"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import BorrowerDashboard from "./BorrowerDashboard";
import OwnerDashboard from "./OwnerDashboard";
import {
  normaliseBorrowerRequest,
  normaliseOwnerRequest,
  type BorrowerRequest,
  type OwnerRequest,
  type OwnerListing,
  type OwnerRating,
  type RawBorrowerRequest,
  type RawOwnerRequest,
} from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DashboardData {
  userId: string;
  borrowerRequests: BorrowerRequest[];
  ratedRequestIds: string[];
  listings: OwnerListing[];
  ownerRequests: OwnerRequest[];
  ownerRatings: OwnerRating[];
}

export default function DashboardShell() {
  const router = useRouter();
  const [mode, setMode]   = useState<"borrower" | "owner">("borrower");
  const [data, setData]   = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 1. Auth check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth/login?redirect=/dashboard");
        return;
      }
      const uid = session.user.id;

      // 2. Fetch all data in parallel
      const [
        { data: rawBorrower },
        { data: submittedRatings },
        { data: listings },
        { data: ownerRatings },
      ] = await Promise.all([
        supabase
          .from("requests")
          .select(`
            id, status, start_date, end_date, created_at,
            listings (
              id, title, category, image_url, price_per_day,
              users!listings_user_id_fkey ( id, full_name )
            )
          `)
          .eq("requester_id", uid)
          .order("created_at", { ascending: false }),

        supabase
          .from("ratings")
          .select("request_id")
          .eq("rater_id", uid),

        supabase
          .from("listings")
          .select("id, title, category, image_url, price_per_day, available, condition, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),

        supabase
          .from("ratings")
          .select("owner_rating")
          .eq("ratee_id", uid),
      ]);

      const ownerListings: OwnerListing[] = listings ?? [];
      const listingIds = ownerListings.map((l) => l.id);

      // 3. Fetch owner requests separately (needs listing IDs first)
      const { data: rawOwnerRequests } = listingIds.length > 0
        ? await supabase
            .from("requests")
            .select(`
              id, status, start_date, end_date, created_at, owner_comment,
              listings ( id, title, image_url, price_per_day ),
              users!requests_requester_id_fkey ( id, full_name )
            `)
            .in("listing_id", listingIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      setData({
        userId:          uid,
        borrowerRequests: (rawBorrower ?? []).map((r) => normaliseBorrowerRequest(r as RawBorrowerRequest)),
        ratedRequestIds:  (submittedRatings ?? []).map((r: { request_id: string }) => r.request_id),
        listings:         ownerListings,
        ownerRequests:    (rawOwnerRequests ?? []).map((r) => normaliseOwnerRequest(r as RawOwnerRequest)),
        ownerRatings:     (ownerRatings ?? []) as OwnerRating[],
      });
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!data) return null;

  const pendingCount = data.ownerRequests.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">Your account</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#143D60]">Dashboard</h1>
          </div>

          {/* Role toggle */}
          <div className="mt-2 flex items-center bg-white border border-gray-100 rounded-xl shadow-sm p-1">
            <button
              onClick={() => setMode("borrower")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === "borrower" ? "bg-[#143D60] text-white" : "text-gray-400 hover:text-gray-600"}`}
            >
              Borrower
            </button>
            <button
              onClick={() => setMode("owner")}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === "owner" ? "bg-[#143D60] text-white" : "text-gray-400 hover:text-gray-600"}`}
            >
              Gear Owner
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {mode === "borrower" ? (
          <BorrowerDashboard
            requests={data.borrowerRequests}
            ratedRequestIds={data.ratedRequestIds}
            userId={data.userId}
          />
        ) : (
          <OwnerDashboard
            listings={data.listings}
            requests={data.ownerRequests}
            ownerRatings={data.ownerRatings}
            userId={data.userId}
          />
        )}
      </div>
    </main>
  );
}