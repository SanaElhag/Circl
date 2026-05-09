"use client";

/**
 * DEV ONLY — SeedNotifications
 * Drop this component anywhere while logged in to seed fake notifications.
 * Remove before shipping.
 *
 * Usage in any page:
 *   import SeedNotifications from "@/components/dev/SeedNotifications";
 *   <SeedNotifications />
 */

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FAKE_NOTIFICATIONS = [
  {
    type: "request_received",
    title: "New rental request",
    body: "Alex Smith wants to rent your Black Diamond Harness for 3 days.",
  },
  {
    type: "request_accepted",
    title: "Request accepted!",
    body: "Priya K. accepted your request for the 4-person camping tent.",
  },
  {
    type: "new_message",
    title: "New message",
    body: "James T.: Hey, can I pick up the skis from the Abby campus?",
  },
  {
    type: "gear_delivered",
    title: "Gear is on its way",
    body: "Sarah M. has marked the snowboard as delivered. Confirm when you have it.",
  },
  {
    type: "request_declined",
    title: "Request declined",
    body: "The owner couldn't accept your request for the climbing harness.",
  },
  {
    type: "rental_complete",
    title: "Rental complete",
    body: "Your rental of the Osprey backpack has been marked complete. Leave a review!",
  },
];

export default function SeedNotifications() {
  const [seeding, setSeeding] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function seed() {
    setSeeding(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("Not logged in.");
      setSeeding(false);
      return;
    }

    const rows = FAKE_NOTIFICATIONS.map((n, i) => ({
      user_id:    session.user.id,
      type:       n.type,
      title:      n.title,
      body:       n.body,
      request_id: null,
      read:       i > 2, // first 3 are unread, rest are read
    }));

    const { error: err } = await supabase.from("notifications").insert(rows);
    if (err) setError(err.message);
    else setDone(true);

    setSeeding(false);
  }

  async function clear() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from("notifications").delete().eq("user_id", session.user.id);
    setDone(false);
    setError(null);
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 items-end">
      {error && (
        <p className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-xl border border-red-200">
          {error}
        </p>
      )}
      {done && (
        <p className="text-xs bg-[#F0F7F4] text-[#27667B] px-3 py-1.5 rounded-xl border border-[#A0C878]">
          ✓ Seeded 6 notifications
        </p>
      )}
      <div className="flex gap-2">
        {done && (
          <button
            onClick={clear}
            className="text-xs bg-white border border-red-200 text-red-500 font-semibold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
          >
            Clear
          </button>
        )}
        <button
          onClick={seed}
          disabled={seeding || done}
          className="text-xs bg-[#143D60] text-white font-bold px-3 py-2 rounded-xl hover:bg-[#27667B] transition-colors disabled:opacity-50 shadow-sm"
        >
          {seeding ? "Seeding…" : "🔔 Seed notifications"}
        </button>
      </div>
    </div>
  );
}