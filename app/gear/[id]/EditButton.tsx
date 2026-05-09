// app/gear/[id]/EditButton.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export default function EditButton({ listingId, ownerId }: { listingId: string; ownerId: string }) {
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsOwner(session?.user?.id === ownerId);
    });
  }, [ownerId]);
  if (!isOwner) return null;
  return (
    <Link href={`/edit-gear/${listingId}`}
      className="block w-full text-center bg-[#DDEB9D] text-[#143D60] font-bold py-3.5 rounded-xl hover:bg-[#A0C878] transition-colors duration-200 mb-3">
      Edit listing
    </Link>
  );
}