"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestStatus =
  | "pending" | "accepted" | "declined"
  | "active" | "completed" | "closed" | "cancelled";

interface RequestUser { id: string; full_name: string; email: string }
interface Listing {
  id: string; title: string; category: string;
  image_url: string | null; price_per_day: number;
  available_from: string | null; available_until: string | null;
  condition: string;
  users: RequestUser | RequestUser[];
}
interface RawRequest {
  id: string;
  status: RequestStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  owner_comment: string | null;
  requester_note: string | null;
  owner_delivered: boolean;
  requester_received: boolean;
  received_photos: string[];
  listings: Listing | Listing[];
  users: RequestUser | RequestUser[];
}
interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  users: { id: string; full_name: string } | { id: string; full_name: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unwrap<T>(v: T | T[]): T {
  return Array.isArray(v) ? v[0] : v;
}
function diffDays(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const PLATFORM_FEE = 0.15;
const GST = 0.05;
const PST = 0.07;

const STATUS_META: Record<RequestStatus, { label: string; color: string; description: string }> = {
  pending:   { label: "Pending",    color: "bg-yellow-50 text-yellow-700 border-yellow-200",   description: "Waiting for the owner to respond" },
  accepted:  { label: "Accepted",   color: "bg-blue-50 text-blue-700 border-blue-200",         description: "Accepted — waiting for gear delivery" },
  declined:  { label: "Declined",   color: "bg-red-50 text-red-600 border-red-200",            description: "This request was declined" },
  active:    { label: "Active",     color: "bg-[#F0F7F4] text-[#27667B] border-[#A0C878]",    description: "Rental in progress" },
  completed: { label: "Completed",  color: "bg-[#F0F7F4] text-[#27667B] border-[#A0C878]",    description: "Gear returned — rental complete" },
  closed:    { label: "Closed",     color: "bg-gray-50 text-gray-500 border-gray-200",         description: "Rental closed" },
  cancelled: { label: "Cancelled",  color: "bg-gray-50 text-gray-500 border-gray-200",         description: "This request was cancelled" },
};

const CATEGORY_LABELS: Record<string, string> = {
  skiing: "Skiing", snowboarding: "Snowboarding", hiking: "Hiking",
  camping: "Camping", climbing: "Climbing", "water-sports": "Water Sports",
  cycling: "Cycling", fishing: "Fishing",
};

// ─── Status timeline ──────────────────────────────────────────────────────────

const STATUS_STEPS: RequestStatus[] = ["pending", "accepted", "active", "completed", "closed"];

function StatusTimeline({ status }: { status: RequestStatus }) {
  if (status === "declined" || status === "cancelled") return null;
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((s, i) => {
        const done    = i <= currentIdx;
        const current = i === currentIdx;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all duration-300 ${
              done ? "bg-[#143D60] text-white" : "bg-gray-100 text-gray-400"
            } ${current ? "ring-4 ring-[#DDEB9D]" : ""}`}>
              {done && i < currentIdx
                ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                : <span>{i + 1}</span>
              }
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 transition-colors duration-300 ${i < currentIdx ? "bg-[#143D60]" : "bg-gray-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Received modal ───────────────────────────────────────────────────────────

function ReceivedModal({ onConfirm, onClose }: {
  onConfirm: (photos: File[]) => Promise<void>;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos,    setPhotos]    = useState<{ file: File; preview: string }[]>([]);
  const [step,      setStep]      = useState<"confirm" | "photos" | "submitting">("confirm");
  const [showNudge, setShowNudge] = useState(false);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...toAdd]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    if (photos.length === 0) {
      setShowNudge(true);
      return;
    }
    setStep("submitting");
    await onConfirm(photos.map((p) => p.file));
  }

  async function handleSkip() {
    setStep("submitting");
    await onConfirm([]);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        {step === "confirm" && (
          <>
            <div>
              <h3 className="font-bold text-[#143D60] text-lg">Confirm gear received</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                By confirming, you acknowledge that youve received the gear and the rental period has started.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors duration-200">Cancel</button>
              <button onClick={() => setStep("photos")} className="flex-1 bg-[#143D60] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200">Yes, I received it</button>
            </div>
          </>
        )}

        {step === "photos" && (
          <>
            <div>
              <h3 className="font-bold text-[#143D60] text-lg">Add condition photos</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Take photos of the gear as you received it. This protects you if the owner reports damages later.
              </p>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <Image src={p.preview} alt={`photo ${i}`} fill className="object-cover" />
                    <button onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-[#143D60] font-bold text-xs flex items-center justify-center shadow">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => fileRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#27667B] hover:bg-[#F0F7F4] text-sm text-gray-400 hover:text-[#143D60] font-medium transition-all duration-200">
              {photos.length === 0 ? "Tap to add photos" : "Add more photos"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />

            {showNudge && photos.length === 0 && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-1">No photos added</p>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  Without condition photos, you wont be able to dispute damage claims from the owner. We strongly recommend adding photos.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSkip}
                className="flex-1 border border-gray-200 text-gray-400 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors duration-200">
                Skip photos
              </button>
              <button onClick={handleSubmit}
                className="flex-1 bg-[#143D60] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200">
                {photos.length === 0 ? "Confirm without photos" : `Confirm with ${photos.length} photo${photos.length > 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}

        {step === "submitting" && (
          <div className="py-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500">Confirming receipt...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit request modal ───────────────────────────────────────────────────────

function EditRequestModal({ request, onSave, onClose }: {
  request: RawRequest;
  onSave: (startDate: string, endDate: string, note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [startDate, setStartDate] = useState(request.start_date ?? "");
  const [endDate,   setEndDate]   = useState(request.end_date ?? "");
  const [note,      setNote]      = useState(request.requester_note ?? "");
  const [saving,    setSaving]    = useState(false);
  const today = new Date().toISOString().split("T")[0];

  async function handleSave() {
    setSaving(true);
    await onSave(startDate, endDate, note);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div>
          <h3 className="font-bold text-[#143D60] text-lg">Edit request</h3>
          <p className="text-sm text-gray-400 mt-0.5">You can update your dates while the request is still pending.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#143D60] mb-1.5">From</label>
            <input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm bg-transparent transition-colors duration-200" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#143D60] mb-1.5">Until</label>
            <input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full border-b border-gray-200 focus:border-[#143D60] outline-none py-2 text-sm bg-transparent transition-colors duration-200" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#143D60] mb-1.5">
            Note to owner <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300}
            placeholder="Anything the owner should know..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#143D60] transition-colors duration-200 resize-none placeholder-gray-300" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors duration-200">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition-all duration-200 ${saving ? "bg-gray-100 text-gray-400" : "bg-[#143D60] text-white hover:bg-[#27667B]"}`}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Message thread ───────────────────────────────────────────────────────────

function MessageThread({ requestId, currentUserId, initialMessages }: {
  requestId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages,  setMessages]  = useState<Message[]>(initialMessages);
  const [text,      setText]      = useState("");
  const [sending,   setSending]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${requestId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `request_id=eq.${requestId}`,
      }, async (payload) => {
        // Fetch full message with user info
        const { data } = await supabase
          .from("messages")
          .select("id, content, created_at, sender_id, users!messages_sender_id_fkey ( id, full_name )")
          .eq("id", payload.new.id)
          .single();
        if (data) setMessages((prev) => [...prev, data as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [requestId]);

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: crypto.randomUUID(),
      content: text.trim(),
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      users: { id: currentUserId, full_name: "You" },
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    await supabase.from("messages").insert({
      request_id: requestId,
      sender_id: currentUserId,
      content: optimistic.content,
    });
    setSending(false);
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Messages</p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto max-h-80 px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-center text-gray-400 py-6">No messages yet. Start the conversation.</p>
        )}
        {messages.map((m) => {
          const sender  = unwrap(m.users);
          const isMe    = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-[10px] flex-shrink-0 mt-0.5">
                {isMe ? "Me" : initials(sender?.full_name ?? "?")}
              </div>
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMe ? "bg-[#143D60] text-white rounded-tr-sm" : "bg-gray-100 text-gray-700 rounded-tl-sm"
                }`}>
                  {m.content}
                </div>
                <p className="text-[10px] text-gray-400 px-1">{fmtTime(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
          className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none border border-transparent focus:border-[#143D60] transition-colors duration-200 placeholder-gray-300"
        />
        <button onClick={sendMessage} disabled={!text.trim() || sending}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${text.trim() ? "bg-[#143D60] text-white hover:bg-[#27667B]" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
          Send
        </button>
      </div>
    </div>
  );
}

// ─── Price breakdown card ─────────────────────────────────────────────────────

function PriceBreakdown({ pricePerDay, days }: { pricePerDay: number; days: number }) {
  const subtotal    = pricePerDay * days;
  const platformFee = subtotal * PLATFORM_FEE;
  const taxable     = subtotal + platformFee;
  const gst         = taxable * GST;
  const pst         = taxable * PST;
  const total       = taxable + gst + pst;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
      <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Price Breakdown</p>
      <div className="space-y-2">
        {[
          { label: `$${pricePerDay} × ${days} day${days !== 1 ? "s" : ""}`, value: subtotal },
          { label: "Platform fee (15%)",  value: platformFee },
          { label: "GST (5%)",            value: gst },
          { label: "PST (7%)",            value: pst },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm text-gray-500">
            <span>{label}</span>
            <span>${value.toFixed(2)}</span>
          </div>
        ))}
        <div className="h-px bg-gray-100" />
        <div className="flex justify-between font-bold text-[#143D60]">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RequestView({
  request: initialRequest,
  initialMessages,
}: {
  request: RawRequest;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [user,    setUser]    = useState<User | null | undefined>(undefined);
  const [request, setRequest] = useState<RawRequest>(initialRequest);
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [showEditModal,     setShowEditModal]     = useState(false);
  const [actionLoading,     setActionLoading]     = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/auth/login?redirect=/requests/${request.id}`); return; }
      setUser(session.user);
    }
    init();
  }, [router, request.id]);

  if (user === undefined) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#143D60] border-t-transparent animate-spin" />
      </main>
    );
  }

  const listing    = unwrap(request.listings);
  const requester  = unwrap(request.users);
  const owner      = unwrap(listing?.users ?? []) as RequestUser;

  const isOwner     = user?.id === owner?.id;
  const isRequester = user?.id === requester?.id;

  if (!isOwner && !isRequester) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-24 flex items-center justify-center">
        <p className="text-gray-400">You dont have access to this request.</p>
      </main>
    );
  }

  const status = request.status;
  const meta   = STATUS_META[status];
  const days   = request.start_date && request.end_date
    ? diffDays(request.start_date, request.end_date) : 0;

  // ── Actions ────────────────────────────────────────────────────────────────

  async function updateStatus(newStatus: RequestStatus) {
    setActionLoading(newStatus);
    const { data } = await supabase
      .from("requests")
      .update({ status: newStatus })
      .eq("id", request.id)
      .select()
      .single();
    if (data) setRequest((prev) => ({ ...prev, status: newStatus }));
    setActionLoading(null);
  }

  async function handleOwnerAccept() { await updateStatus("accepted"); }
  async function handleOwnerDecline() { await updateStatus("declined"); }

  async function handleOwnerDelivered() {
    setActionLoading("delivered");
    await supabase.from("requests").update({ owner_delivered: true }).eq("id", request.id);
    setRequest((prev) => ({ ...prev, owner_delivered: true }));
    setActionLoading(null);
  }

  async function handleRequesterReceived(photos: File[]) {
    const uploadedUrls: string[] = [];
    for (const file of photos) {
      const ext  = file.name.split(".").pop();
      const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("gear-images").upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("gear-images").getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }
    }
    await supabase.from("requests").update({
      requester_received: true,
      received_photos: uploadedUrls,
      status: "active",
    }).eq("id", request.id);
    setRequest((prev) => ({
      ...prev,
      requester_received: true,
      received_photos: uploadedUrls,
      status: "active",
    }));
    setShowReceivedModal(false);
  }

  async function handleCancel() {
    if (!confirm("Cancel this request?")) return;
    await updateStatus("cancelled");
  }

  async function handleEditSave(startDate: string, endDate: string, note: string) {
    await supabase.from("requests").update({
      start_date: startDate || null,
      end_date: endDate || null,
      requester_note: note || null,
    }).eq("id", request.id);
    setRequest((prev) => ({
      ...prev,
      start_date: startDate || null,
      end_date: endDate || null,
      requester_note: note || null,
    }));
    setShowEditModal(false);
  }

  async function handleMarkCompleted() { await updateStatus("completed"); }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-[#143D60] transition-colors duration-200">Dashboard</Link>
          <span>/</span>
          <span className="text-[#143D60] font-medium truncate max-w-[200px]">{listing?.title}</span>
        </nav>

        {/* Status header */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-1">
                {isOwner ? "Incoming request" : "Your request"}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-[#143D60]">{listing?.title}</h1>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${meta.color}`}>
              {meta.label}
            </span>
          </div>

          {/* Timeline */}
          <div className="mb-4">
            <StatusTimeline status={status} />
          </div>

          <p className="text-sm text-gray-500">{meta.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* LEFT */}
          <div className="space-y-5">

            {/* Listing card */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex gap-4 p-5">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {listing?.image_url
                    ? <Image src={listing.image_url} alt={listing.title} fill className="object-cover" sizes="96px" />
                    : <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/gear/${listing?.id}`} className="font-bold text-[#143D60] hover:text-[#27667B] transition-colors duration-200">
                    {listing?.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{CATEGORY_LABELS[listing?.category ?? ""] ?? listing?.category} · {listing?.condition}</p>
                  <p className="text-sm font-bold text-[#143D60] mt-1">${listing?.price_per_day}/day</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                    {request.start_date && <span>From {fmtDate(request.start_date)}</span>}
                    {request.end_date   && <span>Until {fmtDate(request.end_date)}</span>}
                    {days > 0           && <span className="font-semibold text-[#143D60]">{days} day{days !== 1 ? "s" : ""}</span>}
                  </div>
                </div>
              </div>

              {/* Requester note */}
              {request.requester_note && (
                <div className="px-5 pb-5">
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Note from requester</p>
                    <p className="text-sm text-gray-600">{request.requester_note}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Parties */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">
                {isOwner ? "Requester" : "Owner"}
              </p>
              {(() => {
                const person = isOwner ? requester : owner;
                return person ? (
                  <Link href={`/profile/${person.id}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full bg-[#DDEB9D] flex items-center justify-center text-[#143D60] font-bold text-sm flex-shrink-0">
                      {initials(person.full_name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#143D60] group-hover:text-[#27667B] transition-colors duration-200">{person.full_name}</p>
                      <p className="text-xs text-gray-400">{person.email}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-[#27667B] ml-auto transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : null;
              })()}
            </div>

            {/* Owner comment */}
            {request.owner_comment && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-2">Owner&apos;s message</p>
                <p className="text-sm text-gray-600 leading-relaxed">{request.owner_comment}</p>
              </div>
            )}

            {/* Received photos */}
            {request.received_photos && request.received_photos.length > 0 && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-3">Condition photos at handoff</p>
                <div className="grid grid-cols-3 gap-2">
                  {request.received_photos.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <Image src={url} alt={`condition photo ${i + 1}`} fill className="object-cover" sizes="120px" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {user && (status === "accepted" || status === "active" || status === "completed" || status === "closed") && (
              <MessageThread
                requestId={request.id}
                currentUserId={user.id}
                initialMessages={initialMessages}
              />
            )}
          </div>

          {/* RIGHT — actions + price */}
          <div className="space-y-4">

            {/* Price breakdown */}
            {days > 0 && listing && (
              <PriceBreakdown pricePerDay={listing.price_per_day} days={days} />
            )}

            {/* ── OWNER ACTIONS ── */}
            {isOwner && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Actions</p>

                {status === "pending" && (
                  <>
                    <button onClick={handleOwnerAccept} disabled={!!actionLoading}
                      className="w-full bg-[#143D60] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-50">
                      {actionLoading === "accepted" ? "Accepting..." : "Accept request"}
                    </button>
                    <button onClick={handleOwnerDecline} disabled={!!actionLoading}
                      className="w-full border border-red-200 text-red-500 font-semibold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors duration-200 disabled:opacity-50">
                      {actionLoading === "declined" ? "Declining..." : "Decline request"}
                    </button>
                  </>
                )}

                {status === "accepted" && !request.owner_delivered && (
                  <button onClick={handleOwnerDelivered} disabled={!!actionLoading}
                    className="w-full bg-[#DDEB9D] text-[#143D60] font-bold py-3 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200 disabled:opacity-50">
                    {actionLoading === "delivered" ? "Confirming..." : "Mark as delivered"}
                  </button>
                )}

                {status === "accepted" && request.owner_delivered && !request.requester_received && (
                  <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-center">
                    <p className="text-xs font-semibold text-yellow-700">Delivered — waiting for renter to confirm receipt</p>
                  </div>
                )}

                {status === "active" && (
                  <button onClick={handleMarkCompleted} disabled={!!actionLoading}
                    className="w-full bg-[#143D60] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#27667B] transition-colors duration-200 disabled:opacity-50">
                    Mark rental complete
                  </button>
                )}

                {(status === "pending" || status === "accepted") && (
                  <button onClick={handleCancel} disabled={!!actionLoading}
                    className="w-full text-sm text-gray-400 hover:text-red-500 transition-colors duration-200 py-2">
                    Cancel request
                  </button>
                )}
              </div>
            )}

            {/* ── REQUESTER ACTIONS ── */}
            {isRequester && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B]">Actions</p>

                {status === "pending" && (
                  <>
                    <button onClick={() => setShowEditModal(true)}
                      className="w-full border border-[#143D60] text-[#143D60] font-semibold py-3 rounded-xl text-sm hover:bg-[#143D60] hover:text-white transition-all duration-200">
                      Edit request
                    </button>
                    <button onClick={handleCancel} disabled={!!actionLoading}
                      className="w-full border border-red-200 text-red-500 font-semibold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors duration-200 disabled:opacity-50">
                      Cancel request
                    </button>
                  </>
                )}

                {status === "accepted" && request.owner_delivered && !request.requester_received && (
                  <button onClick={() => setShowReceivedModal(true)}
                    className="w-full bg-[#DDEB9D] text-[#143D60] font-bold py-3 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200">
                    Confirm received
                  </button>
                )}

                {status === "accepted" && !request.owner_delivered && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                    <p className="text-xs font-semibold text-blue-700">Accepted — waiting for owner to deliver gear</p>
                  </div>
                )}

                {status === "accepted" && (
                  <button onClick={handleCancel} disabled={!!actionLoading}
                    className="w-full text-sm text-gray-400 hover:text-red-500 transition-colors duration-200 py-2">
                    Cancel request
                  </button>
                )}

                {status === "active" && (
                  <div className="rounded-xl bg-[#F0F7F4] border border-[#A0C878] p-3 text-center">
                    <p className="text-xs font-semibold text-[#27667B]">Rental active — enjoy your adventure!</p>
                  </div>
                )}

                {status === "completed" && (
                  <Link href="/dashboard" className="block w-full text-center bg-[#DDEB9D] text-[#143D60] font-bold py-3 rounded-xl text-sm hover:bg-[#A0C878] transition-colors duration-200">
                    Rate this rental
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReceivedModal && (
        <ReceivedModal
          onConfirm={handleRequesterReceived}
          onClose={() => setShowReceivedModal(false)}
        />
      )}
      {showEditModal && (
        <EditRequestModal
          request={request}
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </main>
  );
}