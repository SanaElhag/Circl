"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CommentUser { id: string; full_name: string }
interface BlogComment {
  id: string;
  content: string;
  created_at: string;
  users: CommentUser | CommentUser[];
}

function unwrapUser(u: CommentUser | CommentUser[]): CommentUser {
  return Array.isArray(u) ? u[0] : u;
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

interface DotMenuProps { onDelete: () => void }
function DotMenu({ onDelete }: DotMenuProps) {
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
      <button onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[100px]">
          <button onClick={() => { setOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-200 font-medium">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function BlogPostClient({
  postId,
  initialComments,
}: {
  postId: string;
  initialComments: BlogComment[];
}) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [comments, setComments] = useState<BlogComment[]>(initialComments);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  async function submitComment() {
    if (!user || !text.trim()) return;
    setPosting(true);
    setError(null);

    const { data, error: insertErr } = await supabase
      .from("blog_comments")
      .insert({ post_id: postId, user_id: user.id, content: text.trim() })
      .select("id, content, created_at, users!blog_comments_user_id_fkey ( id, full_name )")
      .single();

    if (insertErr) {
      setError("Failed to post comment. Please try again.");
    } else if (data) {
      const raw = data as { id: string; content: string; created_at: string; users: CommentUser | CommentUser[] };
      setComments((prev) => [...prev, { ...raw, users: unwrapUser(raw.users) }]);
      setText("");
    }
    setPosting(false);
  }

  async function deleteComment(commentId: string) {
    // .select() so we can tell a real delete from RLS silently blocking it
    // (Supabase reports success with zero rows affected either way)
    const { data: deletedRows, error } = await supabase
      .from("blog_comments")
      .delete()
      .eq("id", commentId)
      .select("id");

    if (error || !deletedRows || deletedRows.length === 0) {
      alert("Couldn't delete that comment. Please try again.");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div className="mt-12 pt-10 border-t border-gray-100">
      <h2 className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-6">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-4 mb-8">
          {comments.map((c) => {
            const author = unwrapUser(c.users);
            const isOwn = user?.id === author?.id;
            return (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-xs flex-shrink-0 mt-0.5">
                  {author ? initials(author.full_name) : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-[#143D60]">{author?.full_name ?? "Unknown"}</p>
                      {isOwn && <DotMenu onDelete={() => deleteComment(c.id)} />}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                      {c.content}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 ml-2">{timeAgo(c.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No comments yet */}
      {comments.length === 0 && (
        <div className="text-center py-8 rounded-2xl bg-gray-50 border border-dashed border-gray-200 mb-8">
          <p className="text-sm text-gray-400">No comments yet. Be the first to share your thoughts.</p>
        </div>
      )}

      {/* Compose — signed in */}
      {user ? (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) submitComment(); }}
            rows={3}
            maxLength={600}
            placeholder="Share your thoughts on this post..."
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-[#143D60] transition-colors duration-200 resize-none leading-relaxed bg-white"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-300">{text.length}/600</p>
            <button
              onClick={submitComment}
              disabled={posting || !text.trim()}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                text.trim() && !posting
                  ? "bg-[#143D60] text-white hover:bg-[#27667B]"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              {posting ? "Posting..." : "Post comment"}
            </button>
          </div>
        </div>
      ) : user === null ? (
        /* Signed out */
        <div className="rounded-2xl bg-[#143D60] text-white p-5 flex items-center justify-between gap-4">
          <p className="text-sm leading-relaxed text-white/80">
            Sign in with your UFV email to leave a comment.
          </p>
          <Link
            href="/auth/login"
            className="flex-shrink-0 bg-[#DDEB9D] text-[#143D60] font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200"
          >
            Sign in
          </Link>
        </div>
      ) : null}
    </div>
  );
}