import Image from "next/image";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabasePublic";

interface NewsPost {
  id: string;
  caption: string;
  image_url: string | null;
  tag: string | null;
  external_url: string | null;
  external_label: string | null;
  created_at: string;
  users: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
}

function unwrapUser(u: { id: string; full_name: string } | { id: string; full_name: string }[] | null) {
  if (!u) return null;
  return Array.isArray(u) ? u[0] : u;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

const TAG_COLORS: Record<string, string> = {
  "Announcements": "bg-[#DDEB9D] text-[#143D60]",
  "Events":        "bg-blue-100 text-blue-700",
  "Partnerships":  "bg-purple-100 text-purple-700",
  "Gear Drops":    "bg-[#A0C878]/20 text-[#27667B]",
  "Community":     "bg-amber-100 text-amber-700",
};

const TAGS = ["All", "Announcements", "Events", "Partnerships", "Gear Drops", "Community"];

export default async function CampusNewsPage() {
  const supabase = supabasePublic();
  const { data: news } = await supabase
    .from("campus_news")
    .select(`
      id, caption, image_url, tag,
      external_url, external_label, created_at,
      users!campus_news_author_id_fkey ( id, full_name )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const posts = (news ?? []) as NewsPost[];

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
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-36 pb-16">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D] mb-3">
                UFV Circl
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
                Campus News
              </h1>
              <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-sm">
                Announcements, events, partnerships, and gear drops from the Circl team.
              </p>
            </div>
            <Link
              href="/community"
              className="mt-2 text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 flex items-center gap-1.5 shrink-0"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Back to community
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Tag filter pills — client interaction handled via anchor scroll, or keep static ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          {TAGS.map((tag) => (
            <span
              key={tag}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-200 cursor-default
                ${tag === "All"
                  ? "bg-[#143D60] text-white border-[#143D60]"
                  : "bg-white text-gray-500 border-gray-200"
                }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* ── Feed ── */}
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-[#DDEB9D] flex items-center justify-center mx-auto mb-5">
              <svg className="w-6 h-6 text-[#143D60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#143D60] tracking-tight mb-2">No news yet</h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Check back soon for announcements, events, and updates from the Circl team.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const author = unwrapUser(post.users);
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  {/* Image */}
                  {post.image_url && (
                    <div className="relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden">
                      <Image
                        src={post.image_url}
                        alt={post.caption.slice(0, 80)}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 672px"
                      />
                      {/* Tag badge over image */}
                      {post.tag && (
                        <span className={`absolute top-3 left-3 text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full ${TAG_COLORS[post.tag] ?? "bg-gray-100 text-gray-600"}`}>
                          {post.tag}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    {/* Tag — shown here if no image */}
                    {post.tag && !post.image_url && (
                      <span className={`inline-flex text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full mb-3 ${TAG_COLORS[post.tag] ?? "bg-gray-100 text-gray-600"}`}>
                        {post.tag}
                      </span>
                    )}

                    {/* Caption */}
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {post.caption}
                    </p>

                    {/* External link */}
                    {post.external_url && (
                      <a
                        href={post.external_url}
                        target={post.external_url.startsWith("http") ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-4 bg-[#143D60] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#27667B] transition-colors duration-200"
                      >
                        {post.external_label ?? "Learn more"}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                      <div className="w-6 h-6 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-[9px] shrink-0">
                        {author ? author.full_name[0].toUpperCase() : "C"}
                      </div>
                      <span className="text-xs font-semibold text-[#143D60]">
                        {author?.full_name ?? "Circl Team"}
                      </span>
                      <span className="text-gray-200 text-xs">·</span>
                      <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}