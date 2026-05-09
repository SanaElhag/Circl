import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  requestId?: string;
}

/**
 * Insert an in-app notification for a user.
 * Call this client-side after any status change or message send.
 * Errors are swallowed — a failed notification should never break the main action.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await supabase.from("notifications").insert({
      user_id:    params.userId,
      type:       params.type,
      title:      params.title,
      body:       params.body,
      request_id: params.requestId ?? null,
      read:       false,
    });
  } catch {
    // Silently fail — notifications are non-critical
  }
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  request_received: "📬",
  request_accepted: "✅",
  request_declined: "❌",
  gear_delivered:   "📦",
  gear_received:    "🎒",
  rental_complete:  "🏁",
  new_message:      "💬",
};

export const NOTIFICATION_COLORS: Record<string, string> = {
  request_received: "bg-[#DDEB9D] text-[#143D60]",
  request_accepted: "bg-[#F0F7F4] text-[#27667B]",
  request_declined: "bg-red-50 text-red-500",
  gear_delivered:   "bg-blue-50 text-blue-600",
  gear_received:    "bg-[#F0F7F4] text-[#27667B]",
  rental_complete:  "bg-[#DDEB9D] text-[#143D60]",
  new_message:      "bg-gray-100 text-gray-600",
};