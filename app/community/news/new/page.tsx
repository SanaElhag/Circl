"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { normalizeImageFile } from "@/lib/normalizeImageFile";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_USER_IDS: string[] = [
  // "YOUR-USER-UUID-HERE",
];
const DEV_BYPASS_ADMIN = process.env.NODE_ENV === "development";

const TAGS = ["Announcements", "Events", "Partnerships", "Gear Drops", "Community"];

interface FormState {
  caption: string;
  tag: string;
  external_url: string;
  external_label: string;
  is_published: boolean;
}

const EMPTY: FormState = {
  caption: "", tag: "", external_url: "", external_label: "", is_published: false,
};

function NewsEditorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser]           = useState<User | null | undefined>(undefined);
  const [isAdmin, setIsAdmin]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [imageFile, setImageFile] = useState<{ file: File; preview: string } | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth/login?redirect=/community/news/new");
        return;
      }
      setUser(session.user);
      const admin = DEV_BYPASS_ADMIN || ADMIN_USER_IDS.includes(session.user.id);
      setIsAdmin(admin);

      if (!admin) { setLoading(false); return; }

      if (editId) {
        const { data: post } = await supabase
          .from("campus_news")
          .select("*")
          .eq("id", editId)
          .single();

        if (post) {
          setForm({
            caption:        post.caption ?? "",
            tag:            post.tag ?? "",
            external_url:   post.external_url ?? "",
            external_label: post.external_label ?? "",
            is_published:   post.is_published ?? false,
          });
          setExistingImageUrl(post.image_url ?? null);
        }
      }
      setLoading(false);
    }
    init();
  }, [editId, router]);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    const normalized = await normalizeImageFile(file);
    if (imageFile) URL.revokeObjectURL(imageFile.preview);
    setImageFile({ file: normalized, preview: URL.createObjectURL(normalized) });
  }

  async function handleSave(publish?: boolean) {
    if (!user) return;
    setError(null);
    setSuccess(null);

    if (!form.caption.trim()) return setError("Caption is required.");

    setSaving(true);
    try {
      let imageUrl = existingImageUrl;

      if (imageFile) {
        const ext = imageFile.file.name.split(".").pop();
        const path = `news/${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("gear-images")
          .upload(path, imageFile.file, { upsert: false });
        if (upErr) throw new Error(upErr.message);
        const { data: { publicUrl } } = supabase.storage.from("gear-images").getPublicUrl(path);
        imageUrl = publicUrl;
      }

      const shouldPublish = publish !== undefined ? publish : form.is_published;

      const payload = {
        author_id:      user.id,
        caption:        form.caption.trim(),
        tag:            form.tag || null,
        image_url:      imageUrl,
        external_url:   form.external_url.trim() || null,
        external_label: form.external_label.trim() || null,
        is_published:   shouldPublish,
      };

      if (editId) {
        const { error: updateErr } = await supabase
          .from("campus_news")
          .update(payload)
          .eq("id", editId);
        if (updateErr) throw new Error(updateErr.message);
        setSuccess(shouldPublish ? "Post published." : "Draft saved.");
        if (shouldPublish) router.push("/community/news");
      } else {
        const { error: insertErr } = await supabase
          .from("campus_news")
          .insert(payload);
        if (insertErr) throw new Error(insertErr.message);
        if (shouldPublish) {
          router.push("/community/news");
        } else {
          setSuccess("Draft saved.");
          setForm(EMPTY);
          setImageFile(null);
          setExistingImageUrl(null);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || user === undefined) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#143D60] mb-2">Admin access required</h1>
          <p className="text-sm text-gray-400 mb-6">Only Circl admins can post campus news.</p>
          <a href="/community/news" className="text-sm font-semibold text-[#27667B] hover:underline">
            ← Back to news
          </a>
        </div>
      </main>
    );
  }

  const imagePreview = imageFile?.preview ?? existingImageUrl ?? null;

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">Admin</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#143D60]">
              {editId ? "Edit news post" : "New news post"}
            </h1>
          </div>
          <a href="/community/news" className="mt-2 text-sm text-gray-400 hover:text-[#143D60] transition-colors duration-200">
            View news
          </a>
        </div>

        <div className="space-y-5">

          {/* Image upload — square like Instagram */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">Photo</h2>
            {imagePreview ? (
              <div className="relative aspect-square rounded-xl overflow-hidden group max-w-sm mx-auto">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                <button
                  onClick={() => { setImageFile(null); setExistingImageUrl(null); }}
                  className="absolute top-2 right-2 bg-white/90 text-[#143D60] text-xs font-bold px-3 py-1.5 rounded-xl transition-opacity duration-200 shadow"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square max-w-sm mx-auto rounded-xl border-2 border-dashed border-gray-200 hover:border-[#27667B] hover:bg-[#F0F7F4] flex flex-col items-center justify-center gap-2 transition-all duration-200 group block"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#DDEB9D] flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#143D60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 group-hover:text-[#143D60]">Upload photo</p>
                <p className="text-xs text-gray-300">Optional, post can be text only</p>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif" onChange={handleFileChange} className="hidden" />
          </section>

          {/* Caption + tag */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Content</h2>

            {/* Caption */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Caption</label>
              <textarea
                value={form.caption}
                onChange={(e) => set("caption", e.target.value)}
                rows={4}
                maxLength={600}
                placeholder="What's the news? Keep it clear and direct."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-[#143D60] transition-colors duration-200 resize-none leading-relaxed"
              />
              <p className="text-[10px] text-gray-300 text-right mt-1">{form.caption.length}/600</p>
            </div>

            {/* Tag */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-2.5">Tag</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => set("tag", form.tag === tag ? "" : tag)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                      form.tag === tag
                        ? "bg-[#143D60] text-white border-[#143D60]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#143D60] hover:text-[#143D60]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* External link */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Link</h2>
              <p className="text-xs text-gray-400 mt-1">Optional, adds a button to the post.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">URL</label>
              <input
                type="url"
                value={form.external_url}
                onChange={(e) => set("external_url", e.target.value)}
                placeholder="https://ufv.ca/... or /browse"
                className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 bg-transparent transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Button label</label>
              <input
                type="text"
                value={form.external_label}
                onChange={(e) => set("external_label", e.target.value)}
                placeholder="e.g. Register now, Learn more, Browse gear"
                maxLength={40}
                className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 bg-transparent transition-colors duration-200"
              />
            </div>
          </section>

          {/* Preview — simple inline preview */}
          {(form.caption || imagePreview) && (
            <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 px-5 pt-4 pb-2">Preview</p>
              {imagePreview && (
                <div className="relative aspect-square overflow-hidden">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  {form.tag && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full bg-[#DDEB9D] text-[#143D60]">
                      {form.tag}
                    </span>
                  )}
                </div>
              )}
              <div className="p-5">
                {form.tag && !imagePreview && (
                  <span className="inline-flex text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full bg-[#DDEB9D] text-[#143D60] mb-3">
                    {form.tag}
                  </span>
                )}
                {form.caption && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{form.caption}</p>
                )}
                {form.external_url && (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 bg-[#143D60] text-white text-xs font-bold px-4 py-2 rounded-xl">
                      {form.external_label || "Learn more"}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Error / success */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="rounded-xl bg-[#F0F7F4] border border-[#A0C878] px-4 py-3 text-sm text-[#27667B] font-semibold">{success}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className={`flex-1 border font-semibold py-3.5 rounded-xl text-sm transition-all duration-200 ${
                saving ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-[#143D60] text-[#143D60] hover:bg-gray-50"
              }`}
            >
              {saving ? "Saving..." : "Save draft"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className={`flex-1 font-bold py-3.5 rounded-xl text-sm transition-all duration-200 ${
                saving ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-[#143D60] text-white hover:bg-[#27667B]"
              }`}
            >
              {saving ? "Publishing..." : "Publish"}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function NewsEditorPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </main>
    }>
      <NewsEditorContent />
    </Suspense>
  );
}