import Link from "next/link";
import Image from "next/image";
import { supabasePublic } from "@/lib/supabasePublic";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string | null;
  created_at: string;
  read_time_minutes: number | null;
  users: { id: string; full_name: string } | { id: string; full_name: string }[];
}

function unwrapUser(u: { id: string; full_name: string } | { id: string; full_name: string }[]) {
  return Array.isArray(u) ? u[0] : u;
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

const PLACEHOLDER =
  "https://www.panoramaresort.com/assets/Tourism-Operators/images/pano-aug14-hike-yoga-lessons-29-2000__FocusFillWyIwLjAwIiwiMC4wMCIsMTgwMCwxMDgwXQ.jpg";

export default async function BlogIndexPage() {
  const supabase = supabasePublic();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select(`
      id, slug, title, excerpt, cover_image_url,
      category, created_at, read_time_minutes,
      users!blog_posts_author_id_fkey ( id, full_name )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const allPosts = (posts ?? []) as BlogPost[];
  const featured = allPosts[0] ?? null;
  const rest = allPosts.slice(1);

  return (
    <main className="min-h-screen bg-[#F9FAFB]">

      {/* ── Hero ── */}
      <section className="relative bg-[#143D60] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
        />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#27667B] opacity-30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-[300px] h-[300px] rounded-full bg-[#A0C878] opacity-20 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-36 pb-16">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D] mb-3">
                UFV Circl
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
                Creator&apos;s Blog
              </h1>
              <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-md">
                Gear reviews, trip reports, outdoor tips, and stories from the UFV community.
              </p>
            </div>
            <Link
              href="/community"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 flex items-center gap-1.5 shrink-0"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Back to community
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

        {/* ── Featured post ── */}
        {featured && (
          <div className="mb-12">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-4">
              Featured
            </p>
            <Link
              href={`/community/blog/${featured.slug}`}
              className="group grid md:grid-cols-[1fr_420px] rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="relative aspect-[16/9] md:aspect-auto overflow-hidden">
                <Image
                  src={featured.cover_image_url ?? PLACEHOLDER}
                  alt={featured.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
              <div className="p-8 flex flex-col justify-center">
                {featured.category && (
                  <span className={`inline-flex self-start text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full mb-4 ${CATEGORY_COLORS[featured.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {featured.category}
                  </span>
                )}
                <h2 className="text-2xl font-bold text-[#143D60] leading-snug tracking-tight group-hover:text-[#27667B] transition-colors duration-200">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-3">
                    {featured.excerpt}
                  </p>
                )}
                <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
                  {(() => {
                    const author = unwrapUser(featured.users);
                    return author ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-[9px]">
                          {author.full_name[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-[#143D60]">{author.full_name}</span>
                      </div>
                    ) : null;
                  })()}
                  <span className="text-gray-200">·</span>
                  <span>{fmtDate(featured.created_at)}</span>
                  {featured.read_time_minutes && (
                    <>
                      <span className="text-gray-200">·</span>
                      <span>{featured.read_time_minutes} min read</span>
                    </>
                  )}
                </div>
                <div className="mt-6">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#27667B] group-hover:gap-2.5 transition-all duration-200">
                    Read post
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ── Rest of posts ── */}
        {rest.length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-6">
              All posts
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => {
                const author = unwrapUser(post.users);
                return (
                  <Link
                    key={post.id}
                    href={`/community/blog/${post.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={post.cover_image_url ?? PLACEHOLDER}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {post.category && (
                        <span className={`absolute top-3 left-3 text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? "bg-gray-100 text-gray-600"}`}>
                          {post.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-[#143D60] leading-snug group-hover:text-[#27667B] transition-colors duration-200 text-sm">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 text-xs text-gray-400 leading-relaxed line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex-1" />
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {author && (
                            <div className="w-6 h-6 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-[9px] shrink-0">
                              {author.full_name[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs text-gray-400">{fmtDate(post.created_at)}</span>
                        </div>
                        {post.read_time_minutes && (
                          <span className="text-[10px] text-gray-300">{post.read_time_minutes} min</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {allPosts.length === 0 && (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-[#DDEB9D] flex items-center justify-center mx-auto mb-5">
              <svg className="w-6 h-6 text-[#143D60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#143D60] tracking-tight mb-2">
              First post coming soon
            </h2>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              The Circl blog is being set up. Check back for gear reviews, trip reports, and community stories.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}