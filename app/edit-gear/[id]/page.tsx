"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { normalizeImageFile } from "@/lib/normalizeImageFile";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  categories: string[];
  price_per_day: string;
  condition: string;
  description: string;
  available_from: string;
  available_until: string;
  available: boolean;
}

// An image that already exists in the DB
interface ExistingImage {
  kind: "existing";
  id: string;       // listing_images.id
  url: string;
  position: number;
}

// A newly picked local file not yet uploaded
interface LocalImage {
  kind: "local";
  file: File;
  preview: string;
}

type ImageSlot = ExistingImage | LocalImage;

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditGearPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser]           = useState<User | null | undefined>(undefined);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>({
    title: "", categories: [], price_per_day: "",
    condition: "", description: "",
    available_from: "", available_until: "", available: true,
  });
  const [images, setImages]       = useState<ImageSlot[]>([]);
  // Track which existing images were removed so we can delete them on save
  // (keep the full image, not just the id, so we can also clean up its Storage file)
  const [removedImages, setRemovedImages] = useState<ExistingImage[]>([]);

  // ── Auth + fetch listing ──────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push(`/auth/login?redirect=/edit-gear/${id}`);
        return;
      }
      setUser(session.user);

      const { data: listing, error: listErr } = await supabase
        .from("listings")
        .select(`*, listing_images ( id, url, position )`)
        .eq("id", id)
        .single();

      if (listErr || !listing) { router.push("/my-gear"); return; }

      // Ownership check
      if (listing.user_id !== session.user.id) {
        router.push(`/gear/${id}`);
        return;
      }

      setForm({
        title:          listing.title ?? "",
        categories:     listing.categories ?? (listing.category ? [listing.category] : []),
        price_per_day:  String(listing.price_per_day ?? ""),
        condition:      listing.condition ?? "",
        description:    listing.description ?? "",
        available_from: listing.available_from ?? "",
        available_until:listing.available_until ?? "",
        available:      listing.available ?? true,
      });

      const sorted = (listing.listing_images ?? [])
        .sort((a: ExistingImage, b: ExistingImage) => a.position - b.position)
        .map((img: { id: string; url: string; position: number }): ExistingImage => ({
          kind: "existing", id: img.id, url: img.url, position: img.position,
        }));
      setImages(sorted);
      setLoading(false);
    }
    init();
  }, [id, router]);

  // Clean up local preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.kind === "local") URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function set(field: Exclude<keyof FormState, "categories">, value: string | boolean) {
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
    if (fileInputRef.current) fileInputRef.current.value = "";

    const remaining = MAX_PHOTOS - images.length;
    const normalized = await Promise.all(files.slice(0, remaining).map(normalizeImageFile));
    const toAdd: LocalImage[] = normalized.map((file) => ({
      kind: "local", file, preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...toAdd]);
  }

  function removeImage(index: number) {
    const slot = images[index];
    if (slot.kind === "existing") {
      setRemovedImages((prev) => [...prev, slot]);
    } else {
      URL.revokeObjectURL(slot.preview);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setError(null);
    if (!form.title.trim())   return setError("Please add a title.");
    if (form.categories.length === 0) return setError("Please select at least one category.");
    if (!form.price_per_day || isNaN(Number(form.price_per_day)) || Number(form.price_per_day) <= 0)
      return setError("Please enter a valid price per day.");
    if (!form.condition)       return setError("Please select a condition.");
    if (images.length === 0)   return setError("Please keep at least one photo.");

    setSaving(true);
    try {
      // 1. Delete removed images from the DB — .select() so we can tell a
      // real delete from RLS silently blocking it (Supabase reports success
      // with zero rows affected either way)
      for (const img of removedImages) {
        const { data: deletedRows, error: delErr } = await supabase
          .from("listing_images")
          .delete()
          .eq("id", img.id)
          .select("id");
        if (delErr || !deletedRows || deletedRows.length === 0) {
          throw new Error("Couldn't remove a photo — you may not have permission to delete it. Please try again.");
        }

        // Best-effort cleanup of the actual file in Storage.
        // URL shape: .../storage/v1/object/public/gear-images/{path}
        const path = img.url.split("/gear-images/")[1]?.split("?")[0];
        if (path) {
          await supabase.storage.from("gear-images").remove([decodeURIComponent(path)]);
        }
      }

      // 2. Upload new local images
      const newUrls: string[] = [];
      for (const slot of images) {
        if (slot.kind !== "local") continue;
        const ext = slot.file.name.split(".").pop();
        const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("gear-images")
          .upload(path, slot.file, { upsert: false });
        if (upErr) throw new Error(upErr.message);
        const { data: { publicUrl } } = supabase.storage
          .from("gear-images").getPublicUrl(path);
        newUrls.push(publicUrl);
      }

      // 3. Insert new listing_images rows
      const existingCount = images.filter((s) => s.kind === "existing").length;
      if (newUrls.length > 0) {
        const rows = newUrls.map((url, i) => ({
          listing_id: id,
          url,
          position: existingCount + i,
        }));
        const { error: imgErr } = await supabase.from("listing_images").insert(rows);
        if (imgErr) throw new Error(imgErr.message);
      }

      // 4. Update listing row — use first existing image as cover
      const firstImg = images[0];
      const coverUrl = firstImg.kind === "existing" ? firstImg.url : newUrls[0];

      const { error: updateErr } = await supabase
        .from("listings")
        .update({
          title:          form.title.trim(),
          category:       form.categories[0],
          categories:     form.categories,
          price_per_day:  Number(form.price_per_day),
          condition:      form.condition,
          description:    form.description.trim() || null,
          image_url:      coverUrl,
          available:      form.available,
          available_from: form.available_from || null,
          available_until:form.available_until || null,
        })
        .eq("id", id);

      if (updateErr) throw new Error(updateErr.message);
      router.push(`/gear/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  // ── Hard delete ───────────────────────────────────────────────────────────

  async function handleDelete() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      // don't delete out from under a live rental — check before touching anything
      const { count } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("listing_id", id)
        .in("status", ["pending", "accepted", "active"]);

      if (count && count > 0) {
        throw new Error("This listing has a pending, accepted, or active request on it, so it can't be removed yet. Decline or complete it first.");
      }

      // Delete all listing_images rows (Storage files stay but listing is gone)
      await supabase.from("listing_images").delete().eq("listing_id", id);
      // .select() so we can tell a real delete from RLS silently blocking it
      // (Supabase reports success with zero rows affected either way)
      const { data: deletedRows, error: delErr } = await supabase
        .from("listings")
        .delete()
        .eq("id", id)
        .select("id");
      if (delErr) throw new Error(delErr.message);
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error("Couldn't remove this listing. You may not have permission to delete it.");
      }
      router.push("/my-gear");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading || user === undefined) {
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
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">
              Your listing
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[#143D60]">Edit gear</h1>
          </div>
          <Link href={`/gear/${id}`}
            className="mt-2 text-sm text-gray-400 hover:text-[#143D60] transition-colors duration-200">
            View listing
          </Link>
        </div>

        <div className="space-y-6">

          {/* ── Availability toggle — top of page ── */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[#143D60]">Listing status</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {form.available
                    ? "Visible in browse, borrowers can request this gear"
                    : "Hidden from browse, no new requests will come in"}
                </p>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => set("available", !form.available)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  form.available ? "bg-[#A0C878]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                    form.available ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${form.available ? "bg-[#A0C878]" : "bg-gray-300"}`} />
              <span className={`text-xs font-semibold ${form.available ? "text-[#27667B]" : "text-gray-400"}`}>
                {form.available ? "Available" : "Unavailable"}
              </span>
            </div>
          </section>

          {/* ── Photos ── */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Photos</h2>
              <span className="text-xs text-gray-400">{images.length}/{MAX_PHOTOS}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {images.map((slot, i) => {
                const src = slot.kind === "existing" ? slot.url : slot.preview;
                return (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                    <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="160px" />
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-[#143D60] text-white px-2 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-[#143D60] font-bold text-xs flex items-center justify-center transition-opacity duration-200 shadow"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}

              {images.length < MAX_PHOTOS && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 hover:border-[#27667B] hover:bg-[#F0F7F4] transition-all duration-200 group ${
                    images.length === 0 ? "col-span-3 aspect-video" : "aspect-square"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#DDEB9D] flex items-center justify-center transition-colors duration-200">
                    <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#143D60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  {images.length === 0 && (
                    <p className="text-xs text-gray-400 group-hover:text-[#143D60]">Add photos</p>
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
            {images.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-3">First photo is the cover shown in search results.</p>
            )}
          </section>

          {/* ── Details ── */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Details</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Title</label>
              <input
                type="text"
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
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Price per day</label>
              <div className="flex items-center border-b border-gray-200 focus-within:border-[#143D60] transition-colors duration-200">
                <span className="text-gray-400 text-sm pr-2">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price_per_day}
                  onChange={(e) => set("price_per_day", e.target.value)}
                  className="flex-1 outline-none py-2 text-sm text-gray-800 bg-transparent"
                />
                <span className="text-gray-400 text-xs">CAD</span>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-2.5">Condition</label>
              <div className="grid grid-cols-1 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
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
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                maxLength={600}
                className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent resize-none leading-relaxed"
              />
              <p className="text-[11px] text-gray-300 mt-1 text-right">{form.description.length}/600</p>
            </div>
          </section>

          {/* ── Availability window ── */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Availability Window</h2>
              <p className="text-xs text-gray-400 mt-1">Leave blank if available any time.</p>
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
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full font-bold py-4 rounded-xl text-base transition-all duration-200 ${
              saving ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#143D60] text-white hover:bg-[#27667B]"
            }`}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          {/* Delete zone */}
          <div className="rounded-2xl border border-red-100 bg-white p-6">
            <h2 className="text-sm font-bold text-red-500 mb-1">Delete listing</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              This permanently removes the listing and all its photos. Active requests will be cancelled. This cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="border border-red-200 text-red-500 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors duration-200"
            >
              Delete listing
            </button>
          </div>

        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="font-bold text-[#143D60] text-lg mb-2">Delete this listing?</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              This is permanent. All photos, requests, and data for this listing will be deleted. Type <span className="font-bold text-red-500">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors duration-200 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="flex-1 border border-gray-200 text-gray-500 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  deleteConfirm === "DELETE" && !deleting
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}