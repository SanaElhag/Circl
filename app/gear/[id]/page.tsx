import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookingCard from "./BookingCard";
import EditButton from "./EditButton";
import PhotoGallery from "./PhotoGallery";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CONDITION_COLORS: Record<string, string> = {
  New:        "bg-[#DDEB9D] text-[#143D60]",
  "Like new": "bg-[#A0C878] text-[#143D60]",
  Good:       "bg-blue-100 text-blue-800",
  Fair:       "bg-yellow-100 text-yellow-800",
  Worn:       "bg-gray-100 text-gray-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  skiing:        "Skiing",
  snowboarding:  "Snowboarding",
  hiking:        "Hiking",
  camping:       "Camping",
  climbing:      "Climbing",
  "water-sports":"Water Sports",
  cycling:       "Cycling",
  fishing:       "Fishing",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default async function GearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`*, users(full_name, email), listing_images(id, url, position)`)
    .eq("id", id)
    .single();

  if (error || !listing) notFound();

  const owner = listing.users as { full_name: string; email: string };
  const ownerInitial = owner?.full_name?.[0]?.toUpperCase() ?? "?";
  const conditionClass = CONDITION_COLORS[listing.condition] ?? "bg-gray-100 text-gray-700";
  const rating: number | null = listing.rating ?? null;
  const categoryLabel = CATEGORY_LABELS[listing.category] ?? listing.category;

  // Sort listing_images by position; fall back to image_url if none
  const extraImages: { id: string; url: string; position: number }[] =
    (listing.listing_images ?? []).sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    );
  const photos = extraImages.length > 0
    ? extraImages
    : listing.image_url
      ? [{ id: "cover", url: listing.image_url, position: 0 }]
      : [];

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#143D60] transition-colors duration-200">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-[#143D60] transition-colors duration-200">Browse</Link>
          <span>/</span>
          <span className="text-[#143D60] font-medium truncate max-w-[200px]">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">

          {/* LEFT */}
          <div className="space-y-8">

            {/* ── 1. Title, category, condition, rating ── */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-[#143D60] leading-tight">
                  {listing.title}
                </h1>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${conditionClass}`}>
                  {listing.condition}
                </span>
              </div>

              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-3">
                {categoryLabel}
              </p>

              {/* Rating */}
              {rating !== null && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled  = star <= Math.floor(rating);
                      const partial = !filled && star === Math.ceil(rating) && rating % 1 !== 0;
                      return (
                        <span key={star} className="relative inline-block w-4 h-4">
                          <svg className="w-4 h-4 text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {(filled || partial) && (
                            <span className="absolute inset-0 overflow-hidden" style={{ width: filled ? "100%" : `${(rating % 1) * 100}%` }}>
                              <svg className="w-4 h-4 text-[#DDEB9D]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-sm font-bold text-[#143D60]">{rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">/ 5</span>
                </div>
              )}
            </div>

            {/* ── 2 + 3. Photos — cover image + optional thumbnail strip ── */}
            <PhotoGallery
              photos={photos}
              // category={categoryLabel}
              title={listing.title}
            />

            {/* ── 4. Description ── */}
            <p className="text-gray-600 leading-relaxed text-base">
              {listing.description ?? "No description provided."}
            </p>

            {/* ── 5. Availability window ── */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">
                Availability Window
              </h2>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1">From</p>
                  <p className="font-bold text-[#143D60]">
                    {listing.available_from ? formatDate(listing.available_from) : "Flexible"}
                  </p>
                </div>
                <div className="h-px flex-1 bg-gray-200" />
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Until</p>
                  <p className="font-bold text-[#143D60]">
                    {listing.available_until ? formatDate(listing.available_until) : "Flexible"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${listing.available ? "bg-[#A0C878]" : "bg-red-400"}`} />
                <span className="text-sm text-gray-500">
                  {listing.available ? "Currently available" : "Not available right now"}
                </span>
              </div>
            </div>

            {/* ── 6. Owner card ── */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">
                Listed By
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-lg flex-shrink-0">
                  {ownerInitial}
                </div>
                <div>
                  <Link href={`/profile/${listing.user_id}`} className="font-bold text-[#143D60] hover:text-[#27667B] transition-colors duration-200">
                    {owner?.full_name ?? "Circl Member"}
                  </Link>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-3.5 h-3.5 ${star <= 4 ? "text-[#DDEB9D]" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">4.8</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT — sticky booking card */}
          <div className="lg:sticky lg:top-24 h-fit space-y-3">
            <EditButton listingId={listing.id} ownerId={listing.user_id} />
            <BookingCard
              listingId={listing.id}
              ownerId={listing.user_id}
              pricePerDay={listing.price_per_day}
              available={listing.available}
              availableFrom={listing.available_from ?? null}
              availableUntil={listing.available_until ?? null}
            />
          </div>

        </div>
      </div>
    </main>
  );
}