import { NextRequest, NextResponse } from "next/server";
import { supabaseForRequest, supabaseServiceRole } from "@/lib/supabaseServer";
import { rateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";

// fires right after a rental request is created, so the owner gets emailed.
// best-effort only - if resend isn't configured or the owner opted out,
// we just skip sending instead of failing the request itself.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "request-email", { max: 20, windowMs: 60_000 });
  if (limited) return limited;

  let supabase, user;
  try {
    ({ supabase, user } = await supabaseForRequest(req));
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { requestId } = await req.json();
  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  const { data: request, error: reqErr } = await supabase
    .from("requests")
    .select("id, requester_id, start_date, end_date, listings ( title, user_id )")
    .eq("id", requestId)
    .single();

  if (reqErr || !request || request.requester_id !== user.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const listing = Array.isArray(request.listings) ? request.listings[0] : request.listings;
  const ownerId = (listing as { user_id: string } | null)?.user_id;
  if (!ownerId) return NextResponse.json({ sent: false });

  try {
    // need auth.admin for the owner's email + their notification prefs,
    // which live in user_metadata - service role is the only way to read that
    const admin = supabaseServiceRole();
    const { data: ownerAuth } = await admin.auth.admin.getUserById(ownerId);
    const owner = ownerAuth?.user;
    const emailsOn = owner?.user_metadata?.notification_prefs?.new_requests ?? true;

    if (!owner?.email || !emailsOn) {
      return NextResponse.json({ sent: false });
    }

    const { data: requesterRow } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const requesterName = requesterRow?.full_name ?? user.email ?? "Someone";
    const listingTitle = (listing as { title: string } | null)?.title ?? "your gear";

    await sendEmail({
      to: owner.email,
      subject: `New rental request for "${listingTitle}"`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #143D60;">New rental request</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            <strong>${requesterName}</strong> wants to rent <strong>"${listingTitle}"</strong>
            from ${request.start_date} to ${request.end_date}.
          </p>
          <a href="${req.nextUrl.origin}/requests/${request.id}"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #143D60; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            View request
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            You're getting this because you have new-request emails turned on in Circl.
            You can turn them off anytime in Account Settings.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    // email is a nice-to-have, never let a provider hiccup look like a failure
    console.error("[api] request email:", err);
    return NextResponse.json({ sent: false });
  }
}
