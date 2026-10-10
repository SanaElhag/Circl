"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { normalizeImageFile } from "@/lib/normalizeImageFile";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = [
  { value: "skiing",       label: "Skiing" },
  { value: "snowboarding", label: "Snowboarding" },
  { value: "hiking",       label: "Hiking" },
  { value: "camping",      label: "Camping" },
  { value: "climbing",     label: "Climbing" },
  { value: "water-sports", label: "Water Sports" },
  { value: "cycling",      label: "Cycling" },
  { value: "fishing",      label: "Fishing" },
];

const CONDITIONS = ["New", "Like new", "Good", "Fair", "Worn"];

const CONDITION_DESC: Record<string, string> = {
  New:        "Never used, original packaging",
  "Like new": "Used once or twice, no wear",
  Good:       "Normal use, fully functional",
  Fair:       "Visible wear but works great",
  Worn:       "Heavy use, works as described",
};

const MAX_PHOTOS = 5;

interface LocalPhoto {
  file: File;
  preview: string; // object URL for display
}

interface FormState {
  title: string;
  categories: string[];
  price_per_day: string;
  condition: string;
  description: string;
  available_from: string;
  available_until: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  categories: [],
  price_per_day: "",
  condition: "",
  description: "",
  available_from: "",
  available_until: "",
};

export default function PostGearPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth/login?redirect=/post-gear");
        return;
      }
      setUser(session.user);
    }
    initAuth();
  }, [router]);

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.preview));
  }, [photos]);

  function set(field: Exclude<keyof FormState, "categories">, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(value: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value],
    }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Reset input so same file can be re-added after removal
    if (fileInputRef.current) fileInputRef.current.value = "";

    const remaining = MAX_PHOTOS - photos.length;
    const normalized = await Promise.all(files.slice(0, remaining).map(normalizeImageFile));
    const toAdd = normalized.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...toAdd]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (!form.title.trim())         return setError("Please add a title.");
    if (form.categories.length === 0) return setError("Please select at least one category.");
    if (!form.price_per_day || isNaN(Number(form.price_per_day)) || Number(form.price_per_day) <= 0)
      return setError("Please enter a valid price per day.");
    if (!form.condition)            return setError("Please select a condition.");
    if (photos.length === 0)        return setError("Please add at least one photo.");

    setSubmitting(true);

    try {
      // 1. Upload all photos to Supabase Storage
      const uploadedUrls: string[] = [];

      for (const photo of photos) {
        const ext = photo.file.name.split(".").pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("gear-images")
          .upload(filePath, photo.file, { upsert: false });

        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from("gear-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      // 2. Insert the listing — image_url gets the first photo for backwards compat
      const { data: listing, error: insertError } = await supabase
        .from("listings")
        .insert({
          user_id:        user.id,
          title:          form.title.trim(),
          category:       form.categories[0],
          categories:     form.categories,
          price_per_day:  Number(form.price_per_day),
          condition:      form.condition,
          description:    form.description.trim() || null,
          image_url:      uploadedUrls[0],
          available:      true,
          available_from: form.available_from || null,
          available_until:form.available_until || null,
        })
        .select("id")
        .single();

      if (insertError) throw new Error(insertError.message);

      // 3. Insert all photos into listing_images table with position order
      const imageRows = uploadedUrls.map((url, i) => ({
        listing_id: listing.id,
        url,
        position: i,
      }));

      const { error: imagesError } = await supabase
        .from("listing_images")
        .insert(imageRows);

      if (imagesError) throw new Error(imagesError.message);

      router.push(`/gear/${listing.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (user === undefined) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </main>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Back button */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#143D60] transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">
            Share your gear
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-[#143D60]">
            Post your gear
          </h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            List what you have, set your price, and let your gear work for you while it sits in storage.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Photo upload */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">
                Photos
              </h2>
              <span className="text-xs text-gray-400">
                {photos.length}/{MAX_PHOTOS}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Existing photo thumbnails */}
              {photos.map((photo, i) => (
                <div key={photo.preview} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <Image
                    src={photo.preview}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  {/* First photo badge */}
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-[#143D60] text-white px-2 py-0.5 rounded-full">
                      Cover
                    </span>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-[#143D60] font-bold text-xs flex items-center justify-center transition-opacity duration-200 shadow"
                  >
                    &times;
                  </button>
                </div>
              ))}

              {/* Add more slot */}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 hover:border-[#27667B] hover:bg-[#F0F7F4] transition-all duration-200 group ${
                    photos.length === 0 ? "col-span-3 aspect-video" : ""
                  }`}
                >
                  <div className={`rounded-full bg-gray-100 group-hover:bg-[#DDEB9D] flex items-center justify-center transition-colors duration-200 ${
                    photos.length === 0 ? "w-12 h-12" : "w-8 h-8"
                  }`}>
                    <svg className={`text-gray-400 group-hover:text-[#143D60] ${photos.length === 0 ? "w-5 h-5" : "w-3.5 h-3.5"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  {photos.length === 0 && (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-500 group-hover:text-[#143D60]">Add photos</p>
                      <p className="text-xs text-gray-400 mt-0.5">Up to {MAX_PHOTOS} photos</p>
                    </div>
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {photos.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-3">
                First photo is the cover image shown in search results.
              </p>
            )}
          </section>

          {/* Basic details */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">
              Details
            </h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
                Title
              </label>
              <input
                type="text"
                placeholder="e.g. Black Diamond climbing harness"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={80}
                className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent"
              />
              <p className="text-[11px] text-gray-300 mt-1 text-right">{form.title.length}/80</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-2.5">
                Category
                <span className="text-gray-400 font-normal ml-1">(pick all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      form.categories.includes(cat.value)
                        ? "bg-[#143D60] text-white border-[#143D60]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#143D60] hover:text-[#143D60]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
                Price per day
              </label>
              <div className="flex items-center border-b border-gray-200 focus-within:border-[#143D60] transition-colors duration-200">
                <span className="text-gray-400 text-sm pr-2">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price_per_day}
                  onChange={(e) => set("price_per_day", e.target.value)}
                  className="flex-1 outline-none py-2 text-sm text-gray-800 placeholder-gray-300 bg-transparent"
                />
                <span className="text-gray-400 text-xs">CAD</span>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-2.5">
                Condition
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("condition", c)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                      form.condition === c
                        ? "bg-[#143D60] text-white border-[#143D60]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#143D60]"
                    }`}
                  >
                    <span className="text-sm font-semibold">{c}</span>
                    <span className={`text-xs ${form.condition === c ? "text-white/70" : "text-gray-400"}`}>
                      {CONDITION_DESC[c]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
                Description
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                placeholder="Describe the gear, what's included, any quirks the borrower should know..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                maxLength={600}
                className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent resize-none leading-relaxed"
              />
              <p className="text-[11px] text-gray-300 mt-1 text-right">{form.description.length}/600</p>
            </div>
          </section>

          {/* Availability */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">
                Availability
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Leave blank if your gear is available any time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">From</label>
                <input
                  type="date"
                  min={today}
                  value={form.available_from}
                  onChange={(e) => set("available_from", e.target.value)}
                  className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-700 bg-transparent transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Until</label>
                <input
                  type="date"
                  min={form.available_from || today}
                  value={form.available_until}
                  onChange={(e) => set("available_until", e.target.value)}
                  className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-700 bg-transparent transition-colors duration-200"
                />
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full font-bold py-4 rounded-xl text-base transition-all duration-200 ${
              submitting
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#143D60] text-white hover:bg-[#27667B]"
            }`}
          >
            {submitting ? "Posting your gear..." : "Post Gear"}
          </button>

          <p className="text-xs text-center text-gray-400 pb-4">
            By posting, you agree to Circls rental terms. You can edit or remove your listing any time from your dashboard.
          </p>

        </form>
      </div>
    </main>
  );
}