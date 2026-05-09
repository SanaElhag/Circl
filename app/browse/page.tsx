"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { supabase } from "@/lib/supabase";

const PLACEHOLDER_IMAGE =
  "https://www.panoramaresort.com/assets/Tourism-Operators/images/c5b7661811/Chels-in-Pano-1764-of-2356__FocusFillWyIwLjAwIiwiMC4wMCIsMTgwMCwxMDgwXQ.jpg";

const PAGE_SIZE = 12;

const CATEGORIES = [
  { label: "All Gear",      slug: "" },
  { label: "Skiing",        slug: "skiing" },
  { label: "Snowboarding",  slug: "snowboarding" },
  { label: "Hiking",        slug: "hiking" },
  { label: "Camping",       slug: "camping" },
  { label: "Climbing",      slug: "climbing" },
  { label: "Water Sports",  slug: "water-sports" },
  { label: "Cycling",       slug: "cycling" },
  { label: "Fishing",       slug: "fishing" },
];

const CONDITIONS = ["New", "Like new", "Good", "Fair", "Worn"];

const conditionColor: Record<string, string> = {
  "New":      "text-green-600",
  "Like new": "text-green-600",
  "Good":     "text-[#27667B]",
  "Fair":     "text-amber-600",
  "Worn":     "text-gray-400",
};

type Listing = {
  id: string;
  title: string;
  category: string;
  price_per_day: number;
  description: string;
  available: boolean;
  condition: string | null;
  image_url: string | null;
  available_from: string | null;
  available_until: string | null;
  created_at: string;
};

function isAvailableThisWeekend(listing: Listing): boolean {
  if (!listing.available_from || !listing.available_until) return false;
  const today = new Date();
  const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSat);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  const from = new Date(listing.available_from);
  const until = new Date(listing.available_until);
  return from <= saturday && until >= sunday;
}

function isAvailableForDates(listing: Listing, range: DateRange): boolean {
  if (!range.from || !listing.available_from || !listing.available_until) return true;
  const from = new Date(listing.available_from);
  const until = new Date(listing.available_until);
  const rangeEnd = range.to ?? range.from;
  return from <= range.from && until >= rangeEnd;
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlCategory = searchParams.get("category") ?? "";

  const [listings, setListings] = useState<Listing[] | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [maxPrice, setMaxPrice] = useState(200);
  const [minPrice, setMinPrice] = useState(0);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // We store the current page in a ref so the IntersectionObserver
  // can read it without needing to be in its dependency array
  const pageRef = useRef(0);

  // Close date picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Main fetch effect — runs when any filter changes.
  // We define the async function inside and call it immediately.
  // This is the correct React 19 pattern — no useCallback, no setState
  // called synchronously in the effect body.
  useEffect(() => {
    // Reset to page 0 on every filter change
    pageRef.current = 0;

    async function fetchPage0() {
      // Build the query for page 0
      let query = supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (selectedCategory) query = query.eq("category", selectedCategory);
      if (selectedConditions.length > 0) query = query.in("condition", selectedConditions);
      query = query.gte("price_per_day", minPrice).lte("price_per_day", maxPrice);

      if (dateRange?.from) {
        const from_date = dateRange.from.toISOString().split("T")[0];
        const to_date = (dateRange.to ?? dateRange.from).toISOString().split("T")[0];
        query = query.lte("available_from", from_date).gte("available_until", to_date);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error.message);
        setListings([]);
      } else {
        const results = data ?? [];
        setHasMore(results.length === PAGE_SIZE);
        setListings(results);
      }
    }

    fetchPage0();
  }, [selectedCategory, selectedConditions, minPrice, maxPrice, dateRange]);

  // Separate function for loading more pages (called by IntersectionObserver).
  // This is NOT inside a useEffect so it's safe to call setState inside it.
  async function loadNextPage() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = pageRef.current + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (selectedCategory) query = query.eq("category", selectedCategory);
    if (selectedConditions.length > 0) query = query.in("condition", selectedConditions);
    query = query.gte("price_per_day", minPrice).lte("price_per_day", maxPrice);

    if (dateRange?.from) {
      const from_date = dateRange.from.toISOString().split("T")[0];
      const to_date = (dateRange.to ?? dateRange.from).toISOString().split("T")[0];
      query = query.lte("available_from", from_date).gte("available_until", to_date);
    }

    const { data, error } = await query;

    if (!error) {
      const results = data ?? [];
      pageRef.current = nextPage;
      setHasMore(results.length === PAGE_SIZE);
      setListings((prev) => [...(prev ?? []), ...results]);
    }

    setLoadingMore(false);
  }

  // IntersectionObserver watches the sentinel div at the bottom of the grid.
  // When it becomes visible, we load the next page.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && listings !== null) {
          loadNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  // loadNextPage is intentionally excluded from deps — it's a stable function
  // that reads state via closure. Adding it would cause infinite re-subscription.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, listings]);

  function handleCategoryChange(slug: string) {
    setSelectedCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    slug ? params.set("category", slug) : params.delete("category");
    router.replace(`/browse?${params.toString()}`, { scroll: false });
  }

  function toggleCondition(c: string) {
    setSelectedConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function clearFilters() {
    setSelectedCategory("");
    setMinPrice(0);
    setMaxPrice(200);
    setSelectedConditions([]);
    setSearchQuery("");
    setDateRange(undefined);
    router.replace("/browse", { scroll: false });
  }

  function formatDateRange(): string {
    if (!dateRange?.from) return "Select dates";
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
    if (!dateRange.to) return fmt(dateRange.from);
    return `${fmt(dateRange.from)} — ${fmt(dateRange.to)}`;
  }

  const visibleListings = listings?.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }) ?? null;

  const isLoading = visibleListings === null;
  const isEmpty = !isLoading && visibleListings.length === 0;
  const activeCategoryLabel =
    CATEGORIES.find((c) => c.slug === selectedCategory)?.label ?? "All Gear";
  const hasActiveFilters =
    selectedCategory || minPrice > 0 || maxPrice < 200 ||
    selectedConditions.length > 0 || searchQuery || dateRange;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">

      {/* ── SEARCH BAR ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-20 z-30">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the Circl (e.g., '4-person tent' or 'Osprey')"
                className="w-full bg-transparent border-0 border-b border-gray-100 pl-10 pr-4 py-2.5 text-sm text-[#143D60] outline-none focus:border-[#27667B] transition-colors duration-200 placeholder:text-gray-300"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setDatePickerOpen(!datePickerOpen)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-200 whitespace-nowrap ${
                  dateRange?.from
                    ? "border-[#27667B] text-[#27667B] bg-[#27667B]/5"
                    : "border-gray-200 text-gray-500 hover:border-[#27667B] hover:text-[#27667B]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDateRange()}
                {dateRange?.from && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDateRange(undefined); }}
                    className="ml-1 text-gray-300 hover:text-gray-500"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </button>

              {datePickerOpen && (
                <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    disabled={{ before: new Date() }}
                    numberOfMonths={2}
                    styles={{ root: { fontFamily: "inherit" } }}
                    classNames={{
                      selected: "bg-[#143D60] text-white rounded-full",
                      range_middle: "bg-[#27667B]/10",
                      range_start: "bg-[#143D60] text-white rounded-full",
                      range_end: "bg-[#143D60] text-white rounded-full",
                      today: "font-bold text-[#27667B]",
                      button: "hover:bg-gray-50 rounded-full transition-colors",
                    }}
                  />
                  <div className="px-5 pb-4 flex justify-end">
                    <button
                      onClick={() => setDatePickerOpen(false)}
                      className="text-xs font-semibold text-[#143D60] hover:text-[#27667B] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-gray-400 hover:text-[#143D60] transition-colors duration-200 whitespace-nowrap"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-10 items-start">

          {/* ── SIDEBAR ─────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-8 w-52 shrink-0 sticky top-40">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-4">
                Categories
              </p>
              <div className="flex flex-col space-y-1">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => handleCategoryChange(cat.slug)}
                      className={`flex items-center gap-3 py-2.5 text-sm text-left transition-colors duration-200 group ${
                        isActive ? "text-[#27667B] font-semibold" : "text-gray-500 hover:text-[#143D60]"
                      }`}
                    >
                      <span className={`h-4 w-0.5 rounded-full transition-all duration-200 shrink-0 ${
                        isActive ? "bg-[#27667B]" : "bg-transparent group-hover:bg-gray-200"
                      }`} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-4">
                Price / Day
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 mb-1 block">Min</label>
                  <input type="number" min={0} max={maxPrice} value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm text-[#143D60] outline-none focus:border-[#27667B] transition-colors" />
                </div>
                <span className="text-gray-300 text-sm mt-4">—</span>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 mb-1 block">Max</label>
                  <input type="number" min={minPrice} max={500} value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm text-[#143D60] outline-none focus:border-[#27667B] transition-colors" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-4">
                Condition
              </p>
              <div className="flex flex-col space-y-3">
                {CONDITIONS.map((cond) => (
                  <label key={cond} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={selectedConditions.includes(cond)}
                      onChange={() => toggleCondition(cond)}
                      className="h-3.5 w-3.5 rounded accent-[#27667B]" />
                    <span className="text-sm text-gray-500 group-hover:text-[#143D60] transition-colors duration-200">
                      {cond}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            <div className="flex flex-col gap-3 mb-8">
              <p className="text-xs text-gray-400 tracking-wide">
                {isLoading
                  ? "Loading..."
                  : `${visibleListings.length} listing${visibleListings.length !== 1 ? "s" : ""}${selectedCategory ? ` in ${activeCategoryLabel}` : ""}`
                }
              </p>
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button key={cat.slug} onClick={() => handleCategoryChange(cat.slug)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 ${
                      selectedCategory === cat.slug
                        ? "bg-[#143D60] text-white border-[#143D60]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#27667B] hover:text-[#27667B]"
                    }`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skeleton */}
            {isLoading && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                    <div className="p-5 flex flex-col gap-3">
                      <div className="h-2.5 bg-gray-100 rounded-full w-1/4 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                      <div className="mt-2 flex justify-between">
                        <div className="h-5 bg-gray-100 rounded-full w-16 animate-pulse" />
                        <div className="h-8 bg-gray-100 rounded-xl w-28 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {isEmpty && (
              <div className="py-24 text-center max-w-md mx-auto">
                <div className="h-12 w-12 rounded-2xl bg-[#27667B]/8 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-5 h-5 text-[#27667B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#143D60] tracking-tight">
                  {selectedCategory
                    ? `The ${activeCategoryLabel} Circl is just getting started.`
                    : "Nothing matched your search."}
                </h2>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  {selectedCategory
                    ? `No gear is listed in ${activeCategoryLabel} right now. You could be the first to earn by listing yours.`
                    : "Try adjusting your filters or search for something else."}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  {selectedCategory && (
                    <Link href="/post-gear"
                      className="rounded-xl bg-[#143D60] px-5 py-3 text-sm font-semibold text-white hover:bg-[#27667B] transition-colors duration-200">
                      List your gear
                    </Link>
                  )}
                  <button onClick={clearFilters}
                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-500 hover:border-[#143D60] hover:text-[#143D60] transition-colors duration-200">
                    Clear all filters
                  </button>
                </div>
                {selectedCategory && (
                  <div className="mt-12">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-gray-300 mb-5">
                      Suggested for you
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {CATEGORIES.filter((c) => c.slug && c.slug !== selectedCategory).slice(0, 4).map((cat) => (
                        <button key={cat.slug} onClick={() => handleCategoryChange(cat.slug)}
                          className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-[#27667B] hover:text-[#27667B] transition-colors duration-200">
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gear grid */}
            {!isLoading && !isEmpty && (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleListings.map((item) => {
                    const availWeekend = isAvailableThisWeekend(item);
                    const availForDates = dateRange ? isAvailableForDates(item, dateRange) : true;

                    return (
                      <div key={item.id}
                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">

                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={item.image_url ?? PLACEHOLDER_IMAGE}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-3 right-3 rounded-full bg-black/30 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold text-white capitalize">
                            {item.category}
                          </span>
                          {availWeekend && (
                            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-green-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              This weekend
                            </span>
                          )}
                          {!availForDates && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-400 shadow">
                                Unavailable for selected dates
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-[#143D60]/0 group-hover:bg-[#143D60]/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                            <Link href={`/gear/${item.id}`}
                              className="rounded-xl bg-[#143D60] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[#27667B] transition-colors duration-200">
                              Request dates
                            </Link>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col flex-1">
                          <p className="font-bold text-[#143D60] leading-snug text-sm">{item.title}</p>
                          {item.condition && (
                            <p className={`mt-1 text-xs ${conditionColor[item.condition] ?? "text-gray-400"}`}>
                              Condition: {item.condition}
                            </p>
                          )}
                          {item.description && (
                            <p className="mt-2 text-xs text-gray-400 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex-1" />
                          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-lg font-bold text-[#143D60]">
                              ${item.price_per_day}
                              <span className="text-xs font-normal text-gray-400"> / day</span>
                            </span>
                            <Link href={`/gear/${item.id}`}
                              className="text-xs font-semibold text-[#27667B] hover:text-[#143D60] transition-colors duration-200">
                              View details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="py-8 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading more...
                    </div>
                  )}
                  {!hasMore && !loadingMore && visibleListings.length > 0 && (
                    <p className="text-xs text-gray-300 tracking-widest uppercase">
                      You&apos;ve seen it all
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}