import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import BlogPostClient from "./BlogPostClient";
import { supabasePublic } from "@/lib/supabasePublic";

// blog post bodies are saved as raw HTML, so this strips anything that
// could run script or inject markup before it ever reaches the page
function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h2", "h3", "h4", "blockquote", "img", "code", "pre", "hr",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      // force safe rel on every link - don't trust whatever was typed in
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-CA", {
    month: "long", day: "numeric", year: "numeric",
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  "Gear Reviews":   "bg-[#DDEB9D] text-[#143D60]",
  "Trip Reports":   "bg-[#A0C878]/20 text-[#27667B]",
  "Campus News":    "bg-blue-100 text-blue-700",
  "Tips & Tricks":  "bg-amber-100 text-amber-700",
  "Sustainability": "bg-emerald-100 text-emerald-700",
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = supabasePublic();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(`
      id, slug, title, excerpt, cover_image_url,
      category, created_at, read_time_minutes, content,
      users!blog_posts_author_id_fkey ( id, full_name )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !post) notFound();

  const author = Array.isArray(post.users) ? post.users[0] : post.users;

  // Fetch comments
  const { data: comments } = await supabase
    .from("blog_comments")
    .select(`
      id, content, created_at,
      users!blog_comments_user_id_fkey ( id, full_name )
    `)
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  // Fetch 3 related posts (same category, excluding current)
  const { data: related } = await supabase
    .from("blog_posts")
    .select("id, slug, title, cover_image_url, category, created_at, read_time_minutes")
    .eq("is_published", true)
    .eq("category", post.category ?? "")
    .neq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main className="min-h-screen bg-[#F9FAFB]">

      {/* ── Cover image hero ── */}
      <div className="relative h-[50vh] min-h-[360px] bg-[#143D60]">
        {post.cover_image_url && (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover opacity-60"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#143D60] via-[#143D60]/50 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-0 left-0 right-0 pt-28 pb-0 px-4 sm:px-6">
          <nav className="max-w-3xl mx-auto flex items-center gap-2 text-xs text-white/50">
            <Link href="/community" className="hover:text-white/80 transition-colors duration-200">Community</Link>
            <span>/</span>
            <Link href="/community/blog" className="hover:text-white/80 transition-colors duration-200">Blog</Link>
            <span>/</span>
            <span className="text-white/70 truncate max-w-[180px]">{post.title}</span>
          </nav>
        </div>

        {/* Post meta over image */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-3xl mx-auto">
            {post.category && (
              <span className={`inline-flex text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full mb-4 ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-600"}`}>
                {post.category}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-3 text-white/70 text-base leading-relaxed max-w-xl">
                {post.excerpt}
              </p>
            )}
            <div className="mt-4 flex items-center gap-3 text-sm text-white/50 flex-wrap">
              {author && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-xs shrink-0">
                    {author.full_name[0].toUpperCase()}
                  </div>
                  <span className="text-white/80 font-semibold text-sm">{author.full_name}</span>
                </div>
              )}
              <span className="text-white/30">·</span>
              <span>{fmtDate(post.created_at)}</span>
              {post.read_time_minutes && (
                <>
                  <span className="text-white/30">·</span>
                  <span>{post.read_time_minutes} min read</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* Article body — rendered from markdown/html stored in `body` column */}
        <article
          className="
            prose prose-sm max-w-none text-gray-700
            prose-headings:text-[#143D60] prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:mb-4
            prose-strong:text-[#143D60]
            prose-a:text-[#27667B] prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-[#143D60]
            prose-blockquote:border-l-4 prose-blockquote:border-[#DDEB9D] prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-gray-500
            prose-ul:pl-5 prose-li:mb-1.5
            prose-img:rounded-2xl
          "
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content ?? "") }}
        />

        {/* ── Comments section (client component) ── */}
        <BlogPostClient
          postId={post.id}
          initialComments={comments ?? []}
        />

      </div>

      {/* ── Related posts ── */}
      {related && related.length > 0 && (
        <div className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-6">
              More from the blog
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/community/blog/${r.slug}`}
                  className="group flex gap-3 rounded-xl border border-gray-100 bg-[#F9FAFB] hover:bg-white hover:shadow-md p-4 transition-all duration-200"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {r.cover_image_url && (
                      <Image src={r.cover_image_url} alt={r.title} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#143D60] leading-snug group-hover:text-[#27667B] transition-colors duration-200 line-clamp-2">
                      {r.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(r.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      {r.read_time_minutes ? ` · ${r.read_time_minutes} min` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}