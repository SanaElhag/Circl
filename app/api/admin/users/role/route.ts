import { NextRequest, NextResponse } from "next/server";
import { supabaseForRequest, supabaseServiceRole } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";
import { apiError } from "@/lib/apiError";

const VALID_ROLES = ["user", "admin"];

// regular users can't write their own role column at all (see
// fix_users_self_update.sql - it's deliberately left out of their column
// grant so nobody can self-promote), so this is the only way to change one
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "admin-user-role", { max: 20, windowMs: 60_000 });
  if (limited) return limited;

  let supabase, user;
  try {
    ({ supabase, user } = await supabaseForRequest(req));
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const { data: callerRow } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (callerRow?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { userId, role } = await req.json();
    if (!userId || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const admin = supabaseServiceRole();
    const { data: updatedRows, error } = await admin
      .from("users")
      .update({ role })
      .eq("id", userId)
      .select("id");

    if (error || !updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: "Couldn't update that user's role" }, { status: 500 });
    }

    return NextResponse.json({ updated: true });
  } catch (err) {
    return apiError(err, "admin user role");
  }
}
