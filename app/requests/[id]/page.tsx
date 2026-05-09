import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import RequestView from "./RequestView";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: request, error } = await supabase
    .from("requests")
    .select(`
      id, status, start_date, end_date, created_at,
      owner_comment, requester_note,
      owner_delivered, requester_received, received_photos,
      listings (
        id, title, category, image_url, price_per_day,
        available_from, available_until, condition,
        users!listings_user_id_fkey ( id, full_name, email )
      ),
      users!requests_requester_id_fkey ( id, full_name, email )
    `)
    .eq("id", id)
    .single();

  if (error || !request) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select(`
      id, content, created_at,
      sender_id,
      users!messages_sender_id_fkey ( id, full_name )
    `)
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  return (
    <RequestView
      request={request}
      initialMessages={messages ?? []}
    />
  );
}