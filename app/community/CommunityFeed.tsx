"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostUser { id: string; full_name: string }

interface RawComment {
  id: string; content: string; created_at: string;
  users: PostUser | PostUser[];
}

interface RawPost {
  id: string; content: string | null; media_urls: string[];
  link_url: string | null; link_title: string | null;
  is_public: boolean; created_at: string;
  users: PostUser | PostUser[];
  post_likes: { user_id: string }[];
  post_comments: RawComment[];
}

interface Comment {
  id: string; content: string; created_at: string; users: PostUser;
}

interface Post {
  id: string; content: string | null; media_urls: string[];
  link_url: string | null; link_title: string | null;
  is_public: boolean; created_at: string; users: PostUser;
  post_likes: { user_id: string }[]; post_comments: Comment[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unwrapUser(u: PostUser | PostUser[]): PostUser {
  return Array.isArray(u) ? u[0] : u;
}
function normalisePost(raw: RawPost): Post {
  return {
    ...raw,
    media_urls: raw.media_urls ?? [],
    users: unwrapUser(raw.users),
    post_comments: (raw.post_comments ?? []).map((c) => ({
      ...c, users: unwrapUser(c.users),
    })),
  };
}
function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function safeUrl(url: string): string | null {
  try {
    const p = new URL(url);
    if (p.protocol !== "https:" && p.protocol !== "http:") return null;
    return p.toString();
  } catch { return null; }
}
function isVideo(url: string) { return /\.(mp4|mov|webm)$/i.test(url); }

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${sz} rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Dot-menu (delete) ────────────────────────────────────────────────────────

function DotMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[120px]">
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-200 font-medium"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Compose box ──────────────────────────────────────────────────────────────

const MAX_MEDIA = 5;

function ComposeBox({ user, onPost }: { user: User; onPost: (post: Post) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [showLinkFields, setShowLinkFields] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string }[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview));
  }, [mediaFiles]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_MEDIA - mediaFiles.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file, preview: URL.createObjectURL(file),
    }));
    setMediaFiles((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMedia(i: number) {
    setMediaFiles((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function reset() {
    setContent(""); setLinkUrl(""); setLinkTitle("");
    setShowLinkFields(false);
    mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview));
    setMediaFiles([]); setError(null);
  }

  async function handleSubmit() {
    setError(null);
    const hasText = content.trim().length > 0;
    const hasMedia = mediaFiles.length > 0;
    const hasLink = showLinkFields && linkUrl.trim().length > 0;
    if (!hasText && !hasMedia && !hasLink)
      return setError("Add some text, a photo, a video, or a link.");
    if (hasLink && !safeUrl(linkUrl))
      return setError("That doesn't look like a valid URL.");

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const { file } of mediaFiles) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("community-media").upload(path, file, { upsert: false });
        if (upErr) throw new Error(upErr.message);
        const { data: { publicUrl } } = supabase.storage.from("community-media").getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }

      const { data: newPost, error: insertErr } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: content.trim() || null,
          media_urls: uploadedUrls,
          link_url: hasLink ? safeUrl(linkUrl) : null,
          link_title: hasLink ? (linkTitle.trim() || null) : null,
          is_public: isPublic,
          post_type: "mixed",
        })
        .select(`
          id, content, media_urls, link_url, link_title, is_public, created_at,
          users!posts_user_id_fkey ( id, full_name ),
          post_likes ( user_id ),
          post_comments ( id, content, created_at, users!post_comments_user_id_fkey ( id, full_name ) )
        `)
        .single();

      if (insertErr) throw new Error(insertErr.message);
      onPost(normalisePost(newPost as RawPost));
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 mb-6">
      <textarea
        placeholder="Share a trip report, gear tip, photo, or anything on your mind..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        rows={3}
        className="w-full outline-none text-sm text-gray-800 placeholder-gray-300 resize-none leading-relaxed bg-transparent"
      />

      {mediaFiles.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {mediaFiles.map((m, i) => (
            <div key={m.preview} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
              {isVideo(m.file.name)
                ? <video src={m.preview} className="w-full h-full object-cover" />
                : <Image src={m.preview} alt={`media ${i}`} fill className="object-cover" />}
              <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-[#143D60] font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow">&times;</button>
            </div>
          ))}
          {mediaFiles.length < MAX_MEDIA && (
            <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#27667B] flex items-center justify-center transition-colors duration-200">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          )}
        </div>
      )}

      {showLinkFields && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <input type="url" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-1.5 text-sm placeholder-gray-300 bg-transparent transition-colors duration-200" />
          <input type="text" placeholder="Link title (optional)" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} maxLength={120}
            className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-1.5 text-sm placeholder-gray-300 bg-transparent transition-colors duration-200" />
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button onClick={() => fileInputRef.current?.click()} disabled={mediaFiles.length >= MAX_MEDIA} title="Add photo or video"
            className="p-2 rounded-xl text-gray-400 hover:text-[#143D60] hover:bg-gray-50 transition-all duration-200 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
          <button onClick={() => setShowLinkFields((v) => !v)} title="Add a link"
            className={`p-2 rounded-xl transition-all duration-200 ${showLinkFields ? "text-[#143D60] bg-gray-100" : "text-gray-400 hover:text-[#143D60] hover:bg-gray-50"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </button>
          <button onClick={() => setIsPublic((v) => !v)}
            className={`ml-1 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${isPublic ? "border-[#A0C878] text-[#27667B] bg-[#F0F7F4]" : "border-gray-200 text-gray-400 bg-white"}`}>
            {isPublic ? "Public" : "Members only"}
          </button>
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${submitting ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#143D60] text-white hover:bg-[#27667B]"}`}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm" multiple onChange={handleFileChange} className="hidden" />
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUserId, onDelete }: {
  post: Post;
  currentUserId: string | null;
  onDelete: (id: string) => void;
}) {
  const [liked, setLiked] = useState(currentUserId ? post.post_likes.some((l) => l.user_id === currentUserId) : false);
  const [likeCount, setLikeCount] = useState(post.post_likes.length);
  const [comments, setComments] = useState<Comment[]>(post.post_comments);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const isOwner = currentUserId === post.users.id;

  async function toggleLike() {
    if (!currentUserId) return;
    if (liked) {
      setLiked(false); setLikeCount((n) => n - 1);
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
    } else {
      setLiked(true); setLikeCount((n) => n + 1);
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserId });
    }
  }

  async function handleDeletePost() {
    onDelete(post.id); // optimistic
    await supabase.from("posts").delete().eq("id", post.id);
  }

  async function handleDeleteComment(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId)); // optimistic
    await supabase.from("post_comments").delete().eq("id", commentId);
  }

  async function submitComment() {
    if (!currentUserId || !commentText.trim()) return;
    setPostingComment(true);
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: post.id, user_id: currentUserId, content: commentText.trim() })
      .select("id, content, created_at, users!post_comments_user_id_fkey ( id, full_name )")
      .single();
    if (!error && data) {
      const raw = data as { id: string; content: string; created_at: string; users: PostUser | PostUser[] };
      setComments((prev) => [...prev, { ...raw, users: unwrapUser(raw.users) }]);
      setCommentText("");
    }
    setPostingComment(false);
  }

  const url = post.link_url ? safeUrl(post.link_url) : null;
  const mediaCount = post.media_urls?.length ?? 0;

  return (
    <article className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Link href={`/profile/${post.users.id}`}><Avatar name={post.users.full_name} /></Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${post.users.id}`} className="text-sm font-bold text-[#143D60] hover:text-[#27667B] transition-colors duration-200">
            {post.users.full_name}
          </Link>
          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
        </div>
        {!post.is_public && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Members only</span>
        )}
        {isOwner && <DotMenu onDelete={handleDeletePost} />}
      </div>

      {post.content && (
        <p className="px-5 pb-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
      )}

      {mediaCount > 0 && (
        <div className={`grid gap-0.5 ${mediaCount === 1 ? "grid-cols-1" : mediaCount === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {post.media_urls.map((u, i) => (
            <div key={i} className={`relative bg-gray-100 ${mediaCount === 1 ? "aspect-video" : "aspect-square"}`}>
              {isVideo(u)
                ? <video src={u} controls className="w-full h-full object-cover" preload="metadata" />
                : <Image src={u} alt={`media ${i + 1}`} fill className="object-cover" />}
            </div>
          ))}
        </div>
      )}

      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="mx-5 mb-3 flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3 hover:border-[#27667B] hover:bg-[#F9FAFB] transition-all duration-200 group">
          <div className="w-8 h-8 rounded-xl bg-[#DDEB9D] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#143D60]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </div>
          <div className="min-w-0">
            {post.link_title && <p className="text-sm font-semibold text-[#143D60] group-hover:text-[#27667B] truncate">{post.link_title}</p>}
            <p className="text-xs text-gray-400 truncate">{url}</p>
          </div>
        </a>
      )}

      <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-50">
        <button onClick={toggleLike} disabled={!currentUserId}
          className={`flex items-center gap-1.5 text-sm transition-colors duration-200 ${liked ? "text-red-500" : "text-gray-400 hover:text-red-400"} ${!currentUserId ? "cursor-default" : ""}`}>
          <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#143D60] transition-colors duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          {comments.length > 0 && <span>{comments.length}</span>}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-gray-50 px-5 py-4 space-y-4">
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={c.users.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-bold text-[#143D60]">{c.users.full_name}</p>
                        {currentUserId === c.users.id && (
                          <DotMenu onDelete={() => handleDeleteComment(c.id)} />
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 ml-2">{timeAgo(c.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentUserId ? (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-[10px] flex-shrink-0 mt-0.5">Me</div>
              <div className="flex-1 flex gap-2">
                <input type="text" placeholder="Write a comment..." value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); }}}
                  maxLength={500}
                  className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none border border-transparent focus:border-[#143D60] transition-colors duration-200 placeholder-gray-300" />
                <button onClick={submitComment} disabled={postingComment || !commentText.trim()}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${commentText.trim() ? "bg-[#143D60] text-white hover:bg-[#27667B]" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
                  Post
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center text-gray-400">
              <Link href="/auth/login" className="text-[#27667B] underline">Sign in</Link> to comment
            </p>
          )}
        </div>
      )}
    </article>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface Contributor { id: string; full_name: string; post_count: number }

function Sidebar({ contributors }: { contributors: Contributor[] }) {
  return (
    <aside className="space-y-4">

      {/* Browse CTA */}
      <div className="rounded-2xl bg-[#143D60] p-5 text-white">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-white/50 mb-2">Ready to get out?</p>
        <p className="font-bold text-lg leading-tight mb-3">Find gear for your next adventure</p>
        <Link href="/browse"
          className="block text-center bg-[#DDEB9D] text-[#143D60] font-bold py-2.5 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200">
          Browse Gear
        </Link>
      </div>

      {/* Top contributors */}
      {contributors.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-4">Top Contributors</p>
          <div className="space-y-3">
            {contributors.map((c, i) => (
              <Link key={c.id} href={`/profile/${c.id}`} className="flex items-center gap-3 group">
                <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-xs flex-shrink-0">
                  {initials(c.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#143D60] group-hover:text-[#27667B] transition-colors duration-200 truncate">{c.full_name}</p>
                  <p className="text-xs text-gray-400">{c.post_count} {c.post_count === 1 ? "post" : "posts"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Post your gear nudge */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">Got gear collecting dust?</p>
        <p className="text-sm text-gray-500 leading-relaxed mb-3">List it on Circl and earn while someone else enjoys it.</p>
        <Link href="/post-gear"
          className="block text-center border border-[#143D60] text-[#143D60] font-bold py-2.5 rounded-xl text-sm hover:bg-[#143D60] hover:text-white transition-all duration-200">
          Post Your Gear
        </Link>
      </div>

    </aside>
  );
}

// ─── Guest banner ─────────────────────────────────────────────────────────────

function GuestBanner() {
  return (
    <div className="rounded-2xl bg-[#143D60] text-white p-6 mb-6 flex items-center justify-between gap-4">
      <div>
        <p className="font-bold">Join the community</p>
        <p className="text-sm text-white/70 mt-0.5">Sign in with your UFV email to post, comment, and see everything.</p>
      </div>
      <Link href="/auth/login" className="flex-shrink-0 bg-[#DDEB9D] text-[#143D60] font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200">
        Sign in
      </Link>
    </div>
  );
}

// ─── Main feed ────────────────────────────────────────────────────────────────

export default function CommunityFeed({
  initialPosts,
  contributors,
}: {
  initialPosts: RawPost[];
  contributors: Contributor[];
}) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [posts, setPosts] = useState<Post[]>(initialPosts.map(normalisePost));

  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

      {/* Feed */}
      <div>
        {user === undefined ? (
          <div className="h-40 rounded-2xl bg-white border border-gray-100 animate-pulse mb-6" />
        ) : user ? (
          <ComposeBox user={user} onPost={(p) => setPosts((prev) => [p, ...prev])} />
        ) : (
          <GuestBanner />
        )}

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No posts yet. Be the first to share something.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id ?? null}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <div className="sticky top-24">
          <Sidebar contributors={contributors} />
        </div>
      </div>

    </div>
  );
}