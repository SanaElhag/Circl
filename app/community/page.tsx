import Link from "next/link";
import CommunityFeed from "./CommunityFeed";
import { supabasePublic } from "@/lib/supabasePublic";

export default async function CommunityPage() {
  const supabase = supabasePublic(30);

  // Fetch posts
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      id, content, media_urls, link_url, link_title, is_public, created_at,
      users!posts_user_id_fkey ( id, full_name ),
      post_likes ( user_id ),
      post_comments (
        id, content, created_at,
        users!post_comments_user_id_fkey ( id, full_name )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch top contributors — users with the most posts
  const { data: rawContributors } = await supabase
    .from("posts")
    .select("user_id, users!posts_user_id_fkey ( id, full_name )")
    .eq("is_public", true);

  // Count posts per user and pick top 5
  const countMap = new Map<string, { id: string; full_name: string; post_count: number }>();
  for (const row of rawContributors ?? []) {
    const u = Array.isArray(row.users) ? row.users[0] : row.users as { id: string; full_name: string };
    if (!u) continue;
    const existing = countMap.get(u.id);
    if (existing) existing.post_count++;
    else countMap.set(u.id, { id: u.id, full_name: u.full_name, post_count: 1 });
  }
  const contributors = [...countMap.values()]
    .sort((a, b) => b.post_count - a.post_count)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#143D60] transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">
            UFV Circl
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-[#143D60]">
            Community
          </h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            Trip reports, gear tips, and stories from the UFV outdoor community.
          </p>
        </div>

        <CommunityFeed initialPosts={posts ?? []} contributors={contributors} />
      </div>
    </main>
  );
}