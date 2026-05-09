"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Hardcoded admin check — replace with DB role when ready ──────────────────
// Add admin user IDs here, or check a `is_admin` column in your `users` table
const ADMIN_USER_IDS: string[] = [
  // "YOUR-USER-UUID-HERE",
];

// For dev convenience: set to true to bypass admin check
const DEV_BYPASS_ADMIN = process.env.NODE_ENV === "development";

const CATEGORIES = ["Gear Reviews", "Trip Reports", "Campus News", "Tips & Tricks", "Sustainability"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  read_time_minutes: string;
  published: boolean;
}

const EMPTY: FormState = {
  title: "", slug: "", excerpt: "", body: "",
  category: "", read_time_minutes: "", published: false,
};

function BlogEditorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit"); // ?edit=<post-id> to edit existing post
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [coverFile, setCoverFile] = useState<{ file: File; preview: string } | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);

  // Auth + admin check
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth/login?redirect=/community/blog/new");
        return;
      }
      setUser(session.user);
      const admin = DEV_BYPASS_ADMIN || ADMIN_USER_IDS.includes(session.user.id);
      setIsAdmin(admin);

      if (!admin) {
        setLoading(false);
        return;
      }

      // Load existing post if editing
      if (editId) {
        const { data: post } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", editId)
          .single();

        if (post) {
          setForm({
            title: post.title ?? "",
            slug: post.slug ?? "",
            excerpt: post.excerpt ?? "",
            body: post.body ?? "",
            category: post.category ?? "",
            read_time_minutes: post.read_time_minutes ? String(post.read_time_minutes) : "",
            published: post.published ?? false,
          });
          setExistingCoverUrl(post.cover_image_url ?? null);
        }
      }

      setLoading(false);
    }
    init();
  }, [editId, router]);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from title (only when creating, not editing)
      if (field === "title" && !editId) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverFile) URL.revokeObjectURL(coverFile.preview);
    setCoverFile({ file, preview: URL.createObjectURL(file) });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave(publish?: boolean) {
    if (!user) return;
    setError(null);
    setSuccess(null);

    if (!form.title.trim()) return setError("Title is required.");
    if (!form.slug.trim()) return setError("Slug is required.");
    if (!form.body.trim()) return setError("Body content is required.");

    setSaving(true);

    try {
      let coverUrl = existingCoverUrl;

      // Upload new cover image if selected
      if (coverFile) {
        const ext = coverFile.file.name.split(".").pop();
        const path = `blog/${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("gear-images")
          .upload(path, coverFile.file, { upsert: false });
        if (upErr) throw new Error(upErr.message);
        const { data: { publicUrl } } = supabase.storage.from("gear-images").getPublicUrl(path);
        coverUrl = publicUrl;
      }

      const payload = {
        author_id: user.id,
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || null,
        body: form.body.trim(),
        category: form.category || null,
        cover_image_url: coverUrl,
        read_time_minutes: form.read_time_minutes ? parseInt(form.read_time_minutes) : null,
        published: publish !== undefined ? publish : form.published,
        published_at: (publish || form.published) ? new Date().toISOString() : null,
      };

      if (editId) {
        const { error: updateErr } = await supabase
          .from("blog_posts")
          .update(payload)
          .eq("id", editId);
        if (updateErr) throw new Error(updateErr.message);
        setSuccess("Post updated.");
        if (publish) {
          router.push(`/community/blog/${form.slug}`);
        }
      } else {
        const { data: newPost, error: insertErr } = await supabase
          .from("blog_posts")
          .insert(payload)
          .select("slug")
          .single();
        if (insertErr) throw new Error(insertErr.message);
        if (publish || form.published) {
          router.push(`/community/blog/${newPost.slug}`);
        } else {
          setSuccess("Draft saved.");
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
      <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#143D60] mb-2">Admin access required</h1>
          <p className="text-sm text-gray-400 mb-6">Only Circl admins can create and edit blog posts.</p>
          <a href="/community/blog" className="text-sm font-semibold text-[#27667B] hover:underline">
            ← Back to blog
          </a>
        </div>
      </main>
    );
  }

  const coverPreview = coverFile?.preview ?? existingCoverUrl ?? null;

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">
              Admin
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#143D60]">
              {editId ? "Edit post" : "New blog post"}
            </h1>
          </div>
          <a href="/community/blog" className="mt-2 text-sm text-gray-400 hover:text-[#143D60] transition-colors duration-200">
            View blog
          </a>
        </div>

        <div className="space-y-6">

          {/* Cover image */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">Cover image</h2>
            {coverPreview ? (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden group">
                <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                <button
                  onClick={() => { setCoverFile(null); setExistingCoverUrl(null); }}
                  className="absolute top-2 right-2 bg-white/90 text-[#143D60] text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-gray-200 hover:border-[#27667B] hover:bg-[#F0F7F4] flex flex-col items-center justify-center gap-2 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#DDEB9D] flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#143D60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 group-hover:text-[#143D60]">Upload cover image</p>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
          </section>

          {/* Core fields */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Post details</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={120}
                placeholder="e.g. Best Budget Hiking Boots for BC Trails"
                className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 bg-transparent transition-colors duration-200"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
                Slug <span className="text-gray-400 font-normal text-xs">(URL path)</span>
              </label>
              <div className="flex items-center border-b border-gray-200 focus-within:border-[#143D60] transition-colors duration-200 gap-1">
                <span className="text-gray-300 text-xs">/community/blog/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => set("slug", slugify(e.target.value))}
                  maxLength={100}
                  className="flex-1 outline-none py-2 text-sm text-gray-800 bg-transparent"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
                Excerpt <span className="text-gray-400 font-normal">(optional — shown in card previews)</span>
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                rows={2}
                maxLength={250}
                placeholder="A brief summary of the post..."
                className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 bg-transparent resize-none transition-colors duration-200"
              />
              <p className="text-[10px] text-gray-300 text-right mt-1">{form.excerpt.length}/250</p>
            </div>

            {/* Category + read time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-700 bg-transparent transition-colors duration-200"
                >
                  <option value="">No category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Read time (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.read_time_minutes}
                  onChange={(e) => set("read_time_minutes", e.target.value)}
                  placeholder="5"
                  className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 bg-transparent transition-colors duration-200"
                />
              </div>
            </div>
          </section>

          {/* Body */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Body</h2>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">HTML supported</span>
            </div>
            <textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              rows={20}
              placeholder={`<h2>Introduction</h2>\n<p>Your content here...</p>\n\n<h2>Section two</h2>\n<p>More content...</p>`}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-[#143D60] transition-colors duration-200 resize-none font-mono leading-relaxed"
            />
            <p className="text-[10px] text-gray-300 mt-2">
              Write HTML directly. Supports headings, paragraphs, links, blockquotes, images, and lists.
            </p>
          </section>

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
              {saving ? "Saving..." : editId ? "Save changes" : "Save draft"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className={`flex-1 font-bold py-3.5 rounded-xl text-sm transition-all duration-200 ${
                saving ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-[#143D60] text-white hover:bg-[#27667B]"
              }`}
            >
              {saving ? "Publishing..." : form.published ? "Update & view" : "Publish"}
            </button>
          </div>

          {/* Published toggle */}
          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={() => set("published", !form.published)}
              className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors duration-200 ${form.published ? "bg-[#A0C878]" : "bg-gray-200"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${form.published ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className={`text-sm font-semibold ${form.published ? "text-[#27667B]" : "text-gray-400"}`}>
              {form.published ? "Published" : "Draft — not visible to readers"}
            </span>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </main>
    }>
      <BlogEditorContent />
    </Suspense>
  );
}