// Shared types for dashboard components
// Supabase returns joined tables as arrays even for single-row joins.
// We use the Raw* variants for data coming from the server, then normalise.

export interface ListingUser {
  id: string;
  full_name: string;
}

// ── Raw shapes (what Supabase actually returns) ────────────────────────────

export interface RawListingBasic {
  id: string;
  title: string;
  category: string;
  categories: string[] | null;
  image_url: string | null;
  price_per_day: number;
  users: ListingUser[];          // always array from Supabase join
}

// full lifecycle a request actually goes through: pending -> accepted ->
// active -> completed -> closed, or pending/accepted -> declined/cancelled
// (see RequestStatus in requests/[id]/RequestView.tsx)
export type RequestLifecycleStatus =
  | "pending" | "accepted" | "declined"
  | "active" | "completed" | "closed" | "cancelled";

export interface RawBorrowerRequest {
  id: string;
  status: RequestLifecycleStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  listings: RawListingBasic[];   // always array from Supabase join
}

export interface RawOwnerRequest {
  id: string;
  status: RequestLifecycleStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  owner_comment: string | null;
  listings: {
    id: string;
    title: string;
    image_url: string | null;
    price_per_day: number;
  }[];                           // always array from Supabase join
  users: ListingUser[];          // always array from Supabase join
}

// ── Normalised shapes (used in UI components) ─────────────────────────────

export interface ListingBasic {
  id: string;
  title: string;
  category: string;
  categories: string[] | null;
  image_url: string | null;
  price_per_day: number;
  users: ListingUser | null;
}

export interface BorrowerRequest {
  id: string;
  status: RequestLifecycleStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  listings: ListingBasic | null;
}

export interface OwnerRequest {
  id: string;
  status: RequestLifecycleStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  owner_comment: string | null;
  listings: { id: string; title: string; image_url: string | null; price_per_day: number } | null;
  users: ListingUser | null;
}

export interface OwnerListing {
  id: string;
  title: string;
  category: string;
  categories: string[] | null;
  image_url: string | null;
  price_per_day: number;
  available: boolean;
  condition: string;
  created_at: string;
}

export interface OwnerRating {
  owner_rating: number | null;
}

// ── Normalisers ───────────────────────────────────────────────────────────

export function normaliseBorrowerRequest(r: RawBorrowerRequest): BorrowerRequest {
  const rawListing = r.listings?.[0] ?? null;
  return {
    ...r,
    listings: rawListing
      ? { ...rawListing, users: rawListing.users?.[0] ?? null }
      : null,
  };
}

export function normaliseOwnerRequest(r: RawOwnerRequest): OwnerRequest {
  return {
    ...r,
    listings: r.listings?.[0] ?? null,
    users:    r.users?.[0] ?? null,
  };
}