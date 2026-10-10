"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { passwordMeetsPolicy, firstUnmetRule } from "@/lib/password";
import PasswordStrength from "@/app/components/PasswordStrength";
import { normalizeImageFile } from "@/lib/normalizeImageFile";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50">
        <h2 className="font-bold text-[#143D60]">{title}</h2>
        {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onDone }: {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
      type === "success"
        ? "bg-[#143D60] text-white"
        : "bg-red-500 text-white"
    }`}>
      {type === "success"
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
      }
      {message}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AccountSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // General
  const [fullName, setFullName]       = useState("");
  const [savingName, setSavingName]   = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]   = useState<File | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [savingPassword, setSavingPassword]     = useState(false);

  // Notifications
  const [emailRentalUpdates, setEmailRentalUpdates]     = useState(true);
  const [emailNewRequests, setEmailNewRequests]         = useState(true);
  const [emailMarketing, setEmailMarketing]             = useState(false);
  const [savingNotifs, setSavingNotifs]                 = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm]   = useState("");
  const [deleting, setDeleting]             = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
  }

  // ── Auth + load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/auth/login?redirect=/account-settings");
        return;
      }
      const u = session.user;
      setUser(u);
      setFullName(u.user_metadata?.full_name ?? "");

      // Prefer the users table (what everyone else actually sees) and fall
      // back to auth metadata for anyone who set a photo before that column existed
      const { data: userRow } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", u.id)
        .single();
      setAvatarUrl(userRow?.avatar_url ?? u.user_metadata?.avatar_url ?? null);

      // Load notification prefs from user metadata (stored there for simplicity)
      const prefs = u.user_metadata?.notification_prefs;
      if (prefs) {
        setEmailRentalUpdates(prefs.rental_updates ?? true);
        setEmailNewRequests(prefs.new_requests ?? true);
        setEmailMarketing(prefs.marketing ?? false);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleSaveName() {
    if (!fullName.trim()) return showToast("Name can't be empty.", "error");
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    // Sync to the users table too - this is what listing/profile pages
    // actually read, the auth update above only affects your own session.
    // .select() so a silently-blocked write doesn't look like it worked
    let tableSyncFailed = false;
    if (!error && user) {
      const { data: savedRows, error: tableErr } = await supabase
        .from("users")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id)
        .select("id");
      tableSyncFailed = !!tableErr || !savedRows || savedRows.length === 0;
    }

    setSavingName(false);
    if (error) showToast(error.message, "error");
    else if (tableSyncFailed) showToast("Name saved, but couldn't update your public profile. Please try again.", "error");
    else showToast("Name updated successfully.");
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    const normalized = await normalizeImageFile(file);
    setAvatarFile(normalized);
    setAvatarPreview(URL.createObjectURL(normalized));
  }

  async function handleSaveAvatar() {
    if (!avatarFile || !user) return;
    setSavingAvatar(true);
    const ext = avatarFile.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("gear-images")
      .upload(path, avatarFile, { upsert: true });
    if (upErr) { showToast(upErr.message, "error"); setSavingAvatar(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("gear-images").getPublicUrl(path);
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

    // Sync to the users table too - this is what listing/profile pages
    // actually read, the auth update above only affects your own session.
    // .select() so a silently-blocked write doesn't look like it worked
    let tableSyncFailed = false;
    if (!error) {
      const { data: savedRows, error: tableErr } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)
        .select("id");
      tableSyncFailed = !!tableErr || !savedRows || savedRows.length === 0;
    }

    if (error) showToast(error.message, "error");
    else {
      setAvatarUrl(publicUrl);
      setAvatarPreview(null);
      setAvatarFile(null);
      if (tableSyncFailed) showToast("Photo saved, but couldn't update your public profile. Please try again.", "error");
      else showToast("Profile photo updated.");
    }
    setSavingAvatar(false);
  }

  function cancelAvatarChange() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
  }

  async function handleSavePassword() {
    if (!newPassword) return showToast("Please enter a new password.", "error");
    if (!passwordMeetsPolicy(newPassword)) {
      const rule = firstUnmetRule(newPassword);
      return showToast(rule ? `Password needs ${rule.label.toLowerCase()}.` : "Please choose a stronger password.", "error");
    }
    if (newPassword !== confirmPassword) return showToast("Passwords don't match.", "error");
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) showToast(error.message, "error");
    else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed successfully.");
    }
  }

  async function handleSaveNotifications() {
    if (!user) return;
    setSavingNotifs(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        notification_prefs: {
          rental_updates: emailRentalUpdates,
          new_requests: emailNewRequests,
          marketing: emailMarketing,
        },
      },
    });
    setSavingNotifs(false);
    if (error) showToast(error.message, "error");
    else showToast("Notification preferences saved.");
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setDeleting(false); return; }

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      showToast(body.error ?? "Couldn't delete your account. Please try again.", "error");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/?deleted=true");
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading || user === undefined) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!user) return null;

  const displayAvatar = avatarPreview ?? avatarUrl;
  const displayName   = user.user_metadata?.full_name ?? user.email ?? "You";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Back button */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#143D60] transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">Your account</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#143D60]">Account Settings</h1>
          </div>
          <Link
            href={`/profile/${user.id}`}
            className="mt-2 text-sm text-gray-400 hover:text-[#143D60] transition-colors duration-200"
          >
            View profile
          </Link>
        </div>

        <div className="space-y-5">

          {/* ── General ── */}
          <Section title="General" description="Your name is shown on your public profile and listings.">
            <div className="space-y-5">

              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayAvatar}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#DDEB9D]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-xl">
                      {initials(displayName)}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#143D60] text-white flex items-center justify-center shadow hover:bg-[#27667B] transition-colors duration-200"
                    title="Change photo"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                    onChange={handleAvatarPick}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#143D60]">Profile photo</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WebP. Shown on your listings and reviews.</p>
                  {avatarFile && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSaveAvatar}
                        disabled={savingAvatar}
                        className="text-xs font-bold bg-[#143D60] text-white px-3 py-1.5 rounded-xl hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-50"
                      >
                        {savingAvatar ? "Saving…" : "Save photo"}
                      </button>
                      <button
                        onClick={cancelAvatarChange}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Full name */}
              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Full name</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={80}
                    placeholder="Your full name"
                    className="flex-1 border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || fullName.trim() === (user.user_metadata?.full_name ?? "")}
                    className="text-xs font-bold bg-[#143D60] text-white px-4 py-2 rounded-xl hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {savingName ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              {/* Email — read only */}
              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Email address</label>
                <div className="flex items-center gap-3">
                  <p className="flex-1 py-2 text-sm text-gray-500 border-b border-gray-100 truncate">
                    {user.email}
                  </p>
                  <span className="text-[10px] font-semibold bg-[#DDEB9D] text-[#143D60] px-2.5 py-1 rounded-full flex-shrink-0">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Email changes are not supported. Contact support if needed.</p>
              </div>
            </div>
          </Section>

          {/* ── Password ── */}
          <Section title="Password" description="Use a strong password of at least 8 characters.">
            <div className="space-y-4">
              {/* Current password — cosmetic only, Supabase doesn't require re-auth for updateUser */}
              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Current password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Your current password"
                    autoComplete="current-password"
                    className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 pr-12 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showCurrent ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 pr-12 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNew ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm text-gray-800 placeholder-gray-300 transition-colors duration-200 bg-transparent"
                />
              </div>

              <PasswordStrength password={newPassword} />

              <button
                onClick={handleSavePassword}
                disabled={savingPassword || !newPassword || !confirmPassword || !passwordMeetsPolicy(newPassword)}
                className="w-full bg-[#143D60] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
              >
                {savingPassword ? "Changing password…" : "Change password"}
              </button>
            </div>
          </Section>

          {/* ── Notifications ── */}
          <Section title="Notifications" description="Choose what emails you receive from Circl.">
            <div className="space-y-4">
              {[
                {
                  key: "rental_updates",
                  label: "Rental updates",
                  description: "Request accepted/declined, gear delivered, rental complete.",
                  value: emailRentalUpdates,
                  set: setEmailRentalUpdates,
                  locked: true,
                },
                {
                  key: "new_requests",
                  label: "New rental requests",
                  description: "Someone requests gear you've listed.",
                  value: emailNewRequests,
                  set: setEmailNewRequests,
                  locked: false,
                },
                {
                  key: "marketing",
                  label: "News & community highlights",
                  description: "Seasonal gear tips, new listings, and campus events.",
                  value: emailMarketing,
                  set: setEmailMarketing,
                  locked: false,
                },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#143D60]">{item.label}</p>
                      {item.locked && (
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Required</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                  <button
                    onClick={() => !item.locked && item.set(!item.value)}
                    disabled={item.locked}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none mt-0.5 ${
                      item.value ? "bg-[#A0C878]" : "bg-gray-200"
                    } ${item.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                      item.value ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              ))}

              <button
                onClick={handleSaveNotifications}
                disabled={savingNotifs}
                className="w-full border border-[#143D60] text-[#143D60] font-bold py-3 rounded-xl text-sm hover:bg-[#143D60] hover:text-white transition-all duration-200 disabled:opacity-40 mt-2"
              >
                {savingNotifs ? "Saving…" : "Save preferences"}
              </button>
            </div>
          </Section>

          {/* ── Danger zone ── */}
          <section className="rounded-2xl border border-red-100 bg-white overflow-hidden">
            <button
              onClick={() => setShowDeleteSection((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-5 text-left"
            >
              <div>
                <p className="font-bold text-red-500">Danger zone</p>
                <p className="text-sm text-gray-400 mt-0.5">Irreversible account actions.</p>
              </div>
              <svg
                className={`w-4 h-4 text-red-300 transition-transform duration-200 flex-shrink-0 ${showDeleteSection ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDeleteSection && (
              <div className="px-6 pb-6 border-t border-red-50 pt-5 space-y-4">
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-red-600">Before you delete</p>
                  <ul className="text-xs text-red-500 space-y-1">
                    <li>• All your listings will be permanently removed.</li>
                    <li>• Any active rental requests will be cancelled.</li>
                    <li>• Your reviews and community posts will be deleted.</li>
                    <li>• This cannot be undone.</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
                    Type <span className="font-bold text-red-500">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors duration-200 placeholder-gray-300"
                  />
                </div>

                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== "DELETE" || deleting}
                  className={`w-full font-bold py-3 rounded-xl text-sm transition-all duration-200 ${
                    deleteConfirm === "DELETE" && !deleting
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-100 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  {deleting ? "Deleting account…" : "Permanently delete my account"}
                </button>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </main>
  );
}