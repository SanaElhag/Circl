import { NextRequest, NextResponse } from "next/server";
import { supabaseForRequest, supabaseServiceRole } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";
import { apiError } from "@/lib/apiError";

// "permanently delete my account" used to just sign the user out and leave
// everything in the db untouched. this actually wipes their data (via the
// delete_my_account_data() function - see supabase/account_deletion.sql)
// and then removes the login itself through the admin api.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "account-delete", { max: 3, windowMs: 60_000 });
  if (limited) return limited;

  let supabase, user;
  try {
    ({ supabase, user } = await supabaseForRequest(req));
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const { error: rpcErr } = await supabase.rpc("delete_my_account_data");
    if (rpcErr) throw new Error(rpcErr.message);

    // only the admin api can remove the auth user itself (and its sessions)
    const admin = supabaseServiceRole();
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
    if (authErr) throw new Error(authErr.message);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return apiError(err, "account delete");
  }
}
