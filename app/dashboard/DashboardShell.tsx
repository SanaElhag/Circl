"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import BorrowerDashboard from "./BorrowerDashboard";
import OwnerDashboard, { type OwnerTab } from "./OwnerDashboard";
import { Skeleton } from "@/app/components/Skeleton";
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
  stripeChargesEnabled: boolean;
}

export default function DashboardShell() {
  const router = useRouter();
  const [mode, setMode]       = useState<"borrower" | "owner">("borrower");
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [ownerTab, setOwnerTab] = useState<OwnerTab | undefined>(undefined);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth/login?redirect=/dashboard");
        return;
      }
      const uid = session.user.id;

      // Extract first name for greeting
      const fullName = session.user.user_metadata?.full_name as string | undefined;
      if (fullName) setUserName(fullName.split(" ")[0]);

      const [
        { data: rawBorrower },
        { data: submittedRatings },
        { data: listings },
        { data: ownerRatings },
        { data: userRow },
      ] = await Promise.all([
        supabase
          .from("requests")
          .select(`
            id, status, start_date, end_date, created_at,
            listings (
              id, title, category, categories, image_url, price_per_day,
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
          .select("id, title, category, categories, image_url, price_per_day, available, condition, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),

        supabase
          .from("ratings")
          .select("owner_rating")
          .eq("ratee_id", uid),

        supabase
          .from("users")
          .select("stripe_charges_enabled")
          .eq("id", uid)
          .single(),
      ]);

      let stripeChargesEnabled = !!userRow?.stripe_charges_enabled;

      const searchParams = new URLSearchParams(window.location.search);

      if (searchParams.get("mode") === "owner") setMode("owner");
      const tabParam = searchParams.get("tab");
      if (tabParam === "summary" || tabParam === "requests" || tabParam === "listings") {
        setOwnerTab(tabParam);
      }

      // Returning from Stripe Connect onboarding — force a fresh status check
      if (searchParams.get("stripe") === "return") {
        const res = await fetch("/api/stripe/connect/status", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const statusData = await res.json();
          stripeChargesEnabled = !!statusData.chargesEnabled;
        }
        setMode("owner");
        router.replace("/dashboard");
      }

      const ownerListings: OwnerListing[] = listings ?? [];
      const listingIds = ownerListings.map((l) => l.id);

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
        userId:           uid,
        borrowerRequests: (rawBorrower ?? []).map((r) => normaliseBorrowerRequest(r as RawBorrowerRequest)),
        ratedRequestIds:  (submittedRatings ?? []).map((r: { request_id: string }) => r.request_id),
        listings:         ownerListings,
        ownerRequests:    (rawOwnerRequests ?? []).map((r) => normaliseOwnerRequest(r as RawOwnerRequest)),
        ownerRatings:     (ownerRatings ?? []) as OwnerRating[],
        stripeChargesEnabled,
      });
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-10 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-56" />
          </div>
          <div className="flex gap-7 border-b border-gray-100 mb-8 pb-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const pendingCount = data.ownerRequests.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">Your account</p>
          <h1 className="text-4xl font-bold tracking-tight text-[#143D60]">
            {userName ? `Hey, ${userName}.` : "Dashboard"}
          </h1>
        </div>

        {/* Borrower / Owner switcher — underline tab style */}
        <div className="flex border-b border-gray-100 mb-8">
          <button
            onClick={() => setMode("borrower")}
            className={`px-1 pb-3 mr-7 text-sm font-semibold border-b-2 -mb-px transition-all duration-200 ${
              mode === "borrower"
                ? "border-[#143D60] text-[#143D60]"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
            }`}
          >
            Borrower
          </button>
          <button
            onClick={() => setMode("owner")}
            className={`relative px-1 pb-3 mr-7 text-sm font-semibold border-b-2 -mb-px transition-all duration-200 ${
              mode === "owner"
                ? "border-[#143D60] text-[#143D60]"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
            }`}
          >
            Gear Owner
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
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
            ratedRequestIds={data.ratedRequestIds}
            userId={data.userId}
            stripeChargesEnabled={data.stripeChargesEnabled}
            initialTab={ownerTab}
          />
        )}
      </div>
    </main>
  );
}
