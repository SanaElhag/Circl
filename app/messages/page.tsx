"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { SkeletonRow, Skeleton } from "@/app/components/Skeleton";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_LABELS: Record<string, string> = {
  skiing: "Skiing", snowboarding: "Snowboarding", hiking: "Hiking",
  camping: "Camping", climbing: "Climbing", "water-sports": "Water Sports",
  cycling: "Cycling", fishing: "Fishing",
};

function categoryLabel(convo: { listingCategory: string; listingCategories: string[] | null }) {
  return (convo.listingCategories?.length ? convo.listingCategories : [convo.listingCategory])
    .map((c) => CATEGORY_LABELS[c] ?? c)
    .join(" · ");
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  accepted:  { label: "Accepted",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  active:    { label: "Active",    color: "bg-[#F0F7F4] text-[#27667B] border-[#A0C878]" },
  completed: { label: "Completed", color: "bg-[#F0F7F4] text-[#27667B] border-[#A0C878]" },
  closed:    { label: "Closed",    color: "bg-gray-50 text-gray-400 border-gray-200" },
  declined:  { label: "Declined",  color: "bg-red-50 text-red-500 border-red-200" },
  cancelled: { label: "Cancelled", color: "bg-gray-50 text-gray-400 border-gray-200" },
};

interface Conversation {
  requestId: string;
  listingTitle: string;
  listingCategory: string;
  listingCategories: string[] | null;
  listingImage: string | null;
  listingId: string;
  otherParty: { id: string; full_name: string };
  status: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastSenderId: string | null;
  isUnread: boolean;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const router = useRouter();

  const [user,          setUser]          = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState<"all" | "unread">("all");

  const fetchConversations = useCallback(async (uid: string) => {
    const { data: requests } = await supabase
      .from("requests")
      .select(`
        id, status,
        listings!inner (
          id, title, category, categories, image_url,
          users!listings_user_id_fkey ( id, full_name )
        ),
        users!requests_requester_id_fkey ( id, full_name )
      `)
      .or(`requester_id.eq.${uid},listings.user_id.eq.${uid}`)
      .in("status", ["accepted", "active", "completed", "closed"])
      .order("created_at", { ascending: false });

    if (!requests || requests.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Single batch query for all messages across every request
    const ids = requests.map((r) => r.id);
    const { data: allMessages } = await supabase
      .from("messages")
      .select("request_id, content, created_at, sender_id")
      .in("request_id", ids)
      .order("created_at", { ascending: false });

    // Keep only the latest message per request
    const lastMsgMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
    for (const msg of allMessages ?? []) {
      if (!lastMsgMap.has(msg.request_id)) {
        lastMsgMap.set(msg.request_id, msg);
      }
    }

    const convos: Conversation[] = [];

    for (const req of requests) {
      const listing   = Array.isArray(req.listings)  ? req.listings[0]   : req.listings;
      const requester = Array.isArray(req.users)      ? req.users[0]      : req.users;
      const owner     = Array.isArray(listing?.users) ? listing.users[0]  : listing?.users;

      if (!listing || !requester || !owner) continue;

      const lastMsg = lastMsgMap.get(req.id);
      if (!lastMsg) continue;

      const isOwner    = uid === owner.id;
      const otherParty = isOwner ? requester : owner;

      // Unread: last message is from the other party and arrived after we last viewed this conversation
      const lastSeen = typeof window !== "undefined"
        ? localStorage.getItem(`msg_seen_${req.id}`)
        : null;
      const isUnread = lastMsg.sender_id !== uid &&
        (!lastSeen || new Date(lastMsg.created_at) > new Date(lastSeen));

      convos.push({
        requestId:       req.id,
        listingId:       listing.id,
        listingTitle:    listing.title,
        listingCategory: listing.category,
        listingCategories: listing.categories,
        listingImage:    listing.image_url,
        otherParty,
        status:          req.status,
        lastMessage:     lastMsg.content,
        lastMessageAt:   lastMsg.created_at,
        lastSenderId:    lastMsg.sender_id,
        isUnread,
      });
    }

    convos.sort((a, b) =>
      new Date(b.lastMessageAt!).getTime() - new Date(a.lastMessageAt!).getTime()
    );

    setConversations(convos);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth/login?redirect=/messages");
        return;
      }
      setUser(session.user);
      fetchConversations(session.user.id);
    }
    init();
  }, [router, fetchConversations]);

  // Realtime — new message updates the conversation list
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-inbox")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, () => {
        // Refetch on any new message (simple approach)
        fetchConversations(user.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const filtered = filter === "unread"
    ? conversations.filter((c) => c.isUnread)
    : conversations;

  const totalUnread = conversations.filter((c) => c.isUnread).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">Inbox</p>
          <h1 className="text-4xl font-bold tracking-tight text-[#143D60]">Messages</h1>
          <p className="text-sm text-gray-400 mt-1">
            Conversations with owners and renters about active requests.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="grid grid-cols-2 gap-1 bg-white border border-gray-100 rounded-2xl shadow-sm p-1.5 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filter === "all" ? "bg-[#143D60] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filter === "unread" ? "bg-[#143D60] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Unread {totalUnread > 0 ? `(${totalUnread})` : ""}
          </button>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F0F7F4] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#27667B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p className="font-bold text-[#143D60] mb-1">
              {filter === "unread" ? "No unread messages" : "No messages yet"}
            </p>
            <p className="text-sm text-gray-400 mb-5">
              {filter === "unread"
                ? "You're all caught up."
                : "Once a rental request is accepted, you can message the other party here."}
            </p>
            {filter === "unread" ? (
              <button
                onClick={() => setFilter("all")}
                className="text-sm font-semibold text-[#27667B] underline underline-offset-2"
              >
                View all messages
              </button>
            ) : (
              <Link
                href="/browse"
                className="inline-block bg-[#143D60] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200"
              >
                Browse gear
              </Link>
            )}
          </div>
        )}

        {/* Conversation list */}
        {filtered.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {filtered.map((convo) => {
              const statusMeta = STATUS_META[convo.status] ?? { label: convo.status, color: "bg-gray-50 text-gray-400 border-gray-200" };
              const isMe = convo.lastSenderId === user?.id;
              const hasUnread = convo.isUnread;

              return (
                <Link
                  key={convo.requestId}
                  href={`/requests/${convo.requestId}`}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/70 transition-colors duration-200 ${hasUnread ? "bg-[#FAFFF5]" : ""}`}
                >
                  {/* Listing image or avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                      {convo.listingImage ? (
                        <Image
                          src={convo.listingImage}
                          alt={convo.listingTitle}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-400">
                            {initials(convo.listingTitle)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Other party avatar overlay */}
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#DDEB9D] border-2 border-white flex items-center justify-center text-[#143D60] font-bold text-[9px]">
                      {initials(convo.otherParty.full_name)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm leading-tight truncate ${hasUnread ? "font-bold text-[#143D60]" : "font-semibold text-gray-700"}`}>
                          {convo.listingTitle}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {categoryLabel(convo)}
                          {" · "}
                          {convo.otherParty.full_name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {convo.lastMessageAt && (
                          <span className="text-[11px] text-gray-400">{timeAgo(convo.lastMessageAt)}</span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    {/* Last message preview */}
                    {convo.lastMessage && (
                      <p className={`text-sm mt-1.5 truncate leading-relaxed ${
                        hasUnread && !isMe ? "font-semibold text-[#143D60]" : "text-gray-400"
                      }`}>
                        {isMe && <span className="text-gray-400 font-normal">You: </span>}
                        {convo.lastMessage}
                      </p>
                    )}
                  </div>

                  {/* Unread dot */}
                  {hasUnread && !isMe && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27667B] flex-shrink-0 mt-2" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        {conversations.length > 0 && (
          <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed">
            Messages are only available once a request is accepted.
            Conversations remain accessible after a rental is closed.
          </p>
        )}

      </div>
    </main>
  );
}