"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Panel =
  | "overview"
  | "hero"
  | "promo"
  | "categories"
  | "users"
  | "listings"
  | "posts"
  | "blog"
  | "testimonials";

interface Stats {
  users: number;
  listings: number;
  posts: number;
  requests: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_active: boolean;
}

interface HeroSlide {
  id: string;
  image_url: string;
  headline: string;
  subheadline: string | null;
  cta_text: string | null;
  cta_url: string | null;
  position: number;
  is_active: boolean;
}

interface PromoConfig {
  id: string;
  title: string;
  description: string;
  badge_text: string;
  discount_value: number | null;
  is_active: boolean;
  expires_at: string | null;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ListingRow {
  id: string;
  title: string;
  category: string;
  categories: string[] | null;
  price_per_day: number;
  available: boolean;
  created_at: string;
  users: { full_name: string } | null;
}

interface PostRow {
  id: string;
  content: string;
  post_type: string;
  created_at: string;
  users: { full_name: string } | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  users: { full_name: string } | null;
}

interface Testimonial {
  id: string;
  name: string;
  position_title: string | null;
  content: string;
  is_active: boolean;
  display_order: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unwrap<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] : v;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#27667B] mb-1">
        Admin
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-[#143D60]">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#27667B] mb-2">{label}</p>
      <p className="text-3xl font-bold text-[#143D60]">{value}</p>
    </div>
  );
}

function ActionButton({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  small = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "danger" | "lime";
  disabled?: boolean;
  small?: boolean;
}) {
  const base = `font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 ${
    small ? "px-3 py-1.5 text-sm" : "px-5 py-2.5 text-sm"
  }`;
  const styles = {
    primary: "bg-[#143D60] text-white hover:bg-[#27667B]",
    outline: "border border-[#143D60] text-[#143D60] hover:bg-[#143D60] hover:text-white",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white",
    lime: "bg-[#DDEB9D] text-[#143D60] hover:bg-[#A0C878]",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          checked ? "bg-[#143D60]" : "bg-gray-200"
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#143D60]">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title="Confirm Action" onClose={onCancel}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <ActionButton onClick={onCancel} variant="outline">
          Cancel
        </ActionButton>
        <ActionButton onClick={onConfirm} variant="danger">
          Confirm
        </ActionButton>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#143D60]/20 focus:border-[#143D60] transition-colors";
const textareaCls = `${inputCls} resize-none`;

// ─── TestimonialForm (must be at module level, not inside a component) ────────

function TestimonialForm({
  data,
  onChange,
}: {
  data: Partial<Testimonial>;
  onChange: (d: Partial<Testimonial>) => void;
}) {
  return (
    <>
      <Field label="Name *">
        <input
          className={inputCls}
          value={data.name ?? ""}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
        />
      </Field>
      <Field label="Position / Title (e.g. UFV Student, Hiking Club President)">
        <input
          className={inputCls}
          value={data.position_title ?? ""}
          onChange={(e) => onChange({ ...data, position_title: e.target.value })}
        />
      </Field>
      <Field label="Testimonial *">
        <textarea
          className={textareaCls}
          rows={4}
          value={data.content ?? ""}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
        />
      </Field>
      <Field label="Display Order">
        <input
          className={inputCls}
          type="number"
          value={data.display_order ?? 0}
          onChange={(e) => onChange({ ...data, display_order: Number(e.target.value) })}
        />
      </Field>
      <div className="mb-2">
        <Toggle
          checked={data.is_active ?? true}
          onChange={(v) => onChange({ ...data, is_active: v })}
          label="Active"
        />
      </div>
    </>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function OverviewPanel({ stats }: { stats: Stats | null }) {
  if (!stats) return <div className="text-gray-400 text-sm">Loading...</div>;
  return (
    <div>
      <SectionHeader title="Overview" subtitle="Platform at a glance" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users} />
        <StatCard label="Listings" value={stats.listings} />
        <StatCard label="Community Posts" value={stats.posts} />
        <StatCard label="Requests" value={stats.requests} />
      </div>
    </div>
  );
}

// ─── Hero Panel ───────────────────────────────────────────────────────────────

function HeroPanel() {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [blank, setBlank] = useState<Partial<HeroSlide>>({});

  const load = useCallback(async () => {
    const { data } = await supabase.from("hero_slides").select("*").order("position");
    setSlides(data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    await supabase
      .from("hero_slides")
      .update({
        image_url: editing.image_url,
        headline: editing.headline,
        subheadline: editing.subheadline,
        cta_text: editing.cta_text,
        cta_url: editing.cta_url,
        position: editing.position,
        is_active: editing.is_active,
      })
      .eq("id", editing.id);
    setSaving(false);
    setEditing(null);
    load();
  }

  async function add() {
    if (!blank.image_url || !blank.headline) return;
    setSaving(true);
    await supabase.from("hero_slides").insert({
      image_url: blank.image_url,
      headline: blank.headline,
      subheadline: blank.subheadline ?? null,
      cta_text: blank.cta_text ?? null,
      cta_url: blank.cta_url ?? null,
      position: blank.position ?? 0,
      is_active: blank.is_active ?? true,
    });
    setSaving(false);
    setAdding(false);
    setBlank({});
    load();
  }

  async function remove(id: string) {
    await supabase.from("hero_slides").delete().eq("id", id);
    setConfirmDelete(null);
    load();
  }

  return (
    <div>
      <SectionHeader title="Hero Slides" subtitle="Manage homepage hero images and copy" />
      <div className="mb-4 flex justify-end">
        <ActionButton onClick={() => setAdding(true)} variant="lime">
          + Add Slide
        </ActionButton>
      </div>

      {slides === null ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : slides.length === 0 ? (
        <div className="text-gray-400 text-sm">No slides yet.</div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
            >
              {slide.image_url && (
                <img
                  src={slide.image_url}
                  alt=""
                  className="w-20 h-14 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#143D60] truncate">{slide.headline}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Position {slide.position} · {slide.is_active ? "Active" : "Hidden"}
                </p>
              </div>
              <div className="flex gap-2">
                <ActionButton onClick={() => setEditing(slide)} variant="outline" small>
                  Edit
                </ActionButton>
                <ActionButton onClick={() => setConfirmDelete(slide.id)} variant="danger" small>
                  Remove
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title="Edit Hero Slide" onClose={() => setEditing(null)}>
          <Field label="Image URL">
            <input
              className={inputCls}
              value={editing.image_url}
              onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
            />
          </Field>
          <Field label="Headline">
            <input
              className={inputCls}
              value={editing.headline}
              onChange={(e) => setEditing({ ...editing, headline: e.target.value })}
            />
          </Field>
          <Field label="Subheadline">
            <input
              className={inputCls}
              value={editing.subheadline ?? ""}
              onChange={(e) => setEditing({ ...editing, subheadline: e.target.value })}
            />
          </Field>
          <Field label="CTA Text">
            <input
              className={inputCls}
              value={editing.cta_text ?? ""}
              onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })}
            />
          </Field>
          <Field label="CTA URL">
            <input
              className={inputCls}
              value={editing.cta_url ?? ""}
              onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })}
            />
          </Field>
          <Field label="Position">
            <input
              className={inputCls}
              type="number"
              value={editing.position}
              onChange={(e) => setEditing({ ...editing, position: Number(e.target.value) })}
            />
          </Field>
          <div className="mb-6">
            <Toggle
              checked={editing.is_active}
              onChange={(v) => setEditing({ ...editing, is_active: v })}
              label="Active"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <ActionButton onClick={() => setEditing(null)} variant="outline">
              Cancel
            </ActionButton>
            <ActionButton onClick={save} disabled={saving} variant="primary">
              {saving ? "Saving..." : "Save"}
            </ActionButton>
          </div>
        </Modal>
      )}

      {adding && (
        <Modal
          title="Add Hero Slide"
          onClose={() => {
            setAdding(false);
            setBlank({});
          }}
        >
          <Field label="Image URL *">
            <input
              className={inputCls}
              value={blank.image_url ?? ""}
              onChange={(e) => setBlank({ ...blank, image_url: e.target.value })}
            />
          </Field>
          <Field label="Headline *">
            <input
              className={inputCls}
              value={blank.headline ?? ""}
              onChange={(e) => setBlank({ ...blank, headline: e.target.value })}
            />
          </Field>
          <Field label="Subheadline">
            <input
              className={inputCls}
              value={blank.subheadline ?? ""}
              onChange={(e) => setBlank({ ...blank, subheadline: e.target.value })}
            />
          </Field>
          <Field label="CTA Text">
            <input
              className={inputCls}
              value={blank.cta_text ?? ""}
              onChange={(e) => setBlank({ ...blank, cta_text: e.target.value })}
            />
          </Field>
          <Field label="CTA URL">
            <input
              className={inputCls}
              value={blank.cta_url ?? ""}
              onChange={(e) => setBlank({ ...blank, cta_url: e.target.value })}
            />
          </Field>
          <Field label="Position">
            <input
              className={inputCls}
              type="number"
              value={blank.position ?? 0}
              onChange={(e) => setBlank({ ...blank, position: Number(e.target.value) })}
            />
          </Field>
          <div className="flex gap-3 justify-end mt-2">
            <ActionButton
              onClick={() => {
                setAdding(false);
                setBlank({});
              }}
              variant="outline"
            >
              Cancel
            </ActionButton>
            <ActionButton
              onClick={add}
              disabled={saving || !blank.image_url || !blank.headline}
              variant="lime"
            >
              {saving ? "Adding..." : "Add Slide"}
            </ActionButton>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Remove this hero slide? This cannot be undone."
          onConfirm={() => remove(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Promo Panel ──────────────────────────────────────────────────────────────

function PromoPanel() {
  const [promo, setPromo] = useState<PromoConfig | null>(null);
  const [draft, setDraft] = useState<PromoConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("promo_config")
      .select("*")
      .single()
      .then(({ data }) => {
        if (!cancelled && data) {
          setPromo(data as PromoConfig);
          setDraft(data as PromoConfig);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!draft) return;
    setSaving(true);
    await supabase
      .from("promo_config")
      .update({
        title: draft.title,
        description: draft.description,
        badge_text: draft.badge_text,
        discount_value: draft.discount_value,
        is_active: draft.is_active,
        expires_at: draft.expires_at || null,
      })
      .eq("id", draft.id);
    setSaving(false);
    setPromo(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!draft) return <div className="text-gray-400 text-sm">Loading...</div>;

  return (
    <div>
      <SectionHeader
        title="Promo Config"
        subtitle="Control the promotional banner shown on the homepage"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl">
        <div className="mb-6">
          <Toggle
            checked={draft.is_active}
            onChange={(v) => setDraft({ ...draft, is_active: v })}
            label="Show promo banner"
          />
        </div>
        <Field label="Title">
          <input
            className={inputCls}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={textareaCls}
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>
        <Field label="Badge Text (e.g. 15% OFF, FREE SHIPPING, REFER A FRIEND)">
          <input
            className={inputCls}
            value={draft.badge_text}
            onChange={(e) => setDraft({ ...draft, badge_text: e.target.value })}
          />
        </Field>
        <Field label="Discount Value % (optional, leave blank for non-discount promos)">
          <input
            className={inputCls}
            type="number"
            value={draft.discount_value ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                discount_value: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </Field>
        <Field label="Expiry Date (optional)">
          <input
            className={inputCls}
            type="datetime-local"
            value={draft.expires_at ? draft.expires_at.slice(0, 16) : ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
        </Field>
        <div className="flex items-center gap-3 mt-2">
          <ActionButton onClick={save} disabled={saving} variant="primary">
            {saving ? "Saving..." : "Save Changes"}
          </ActionButton>
          {saved && <span className="text-sm text-green-600 font-medium">Saved</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Categories Panel ─────────────────────────────────────────────────────────

function CategoriesPanel() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*").order("position");
    setCats(data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(cat: Category) {
    await supabase
      .from("categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    load();
  }

  async function add() {
    if (!newName || !newSlug) return;
    setSaving(true);
    await supabase.from("categories").insert({
      name: newName,
      slug: newSlug,
      position: (cats?.length ?? 0) + 1,
      is_active: true,
    });
    setSaving(false);
    setAdding(false);
    setNewName("");
    setNewSlug("");
    load();
  }

  async function remove(id: string) {
    await supabase.from("categories").delete().eq("id", id);
    setConfirmDelete(null);
    load();
  }

  return (
    <div>
      <SectionHeader
        title="Categories"
        subtitle="Manage gear categories shown across Browse and Post Gear"
      />
      <div className="mb-4 flex justify-end">
        <ActionButton onClick={() => setAdding(true)} variant="lime">
          + Add Category
        </ActionButton>
      </div>

      {cats === null ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-2">
          {cats.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-[#143D60]">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.slug}</p>
              </div>
              <Toggle
                checked={cat.is_active}
                onChange={() => toggleActive(cat)}
                label={cat.is_active ? "Active" : "Hidden"}
              />
              <ActionButton onClick={() => setConfirmDelete(cat.id)} variant="danger" small>
                Remove
              </ActionButton>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <Modal
          title="Add Category"
          onClose={() => {
            setAdding(false);
            setNewName("");
            setNewSlug("");
          }}
        >
          <Field label="Name">
            <input
              className={inputCls}
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
            />
          </Field>
          <Field label="Slug">
            <input
              className={inputCls}
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
            />
          </Field>
          <div className="flex gap-3 justify-end mt-2">
            <ActionButton
              onClick={() => {
                setAdding(false);
                setNewName("");
                setNewSlug("");
              }}
              variant="outline"
            >
              Cancel
            </ActionButton>
            <ActionButton
              onClick={add}
              disabled={saving || !newName || !newSlug}
              variant="lime"
            >
              {saving ? "Adding..." : "Add"}
            </ActionButton>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Remove this category? Existing listings using this category will not be affected."
          onConfirm={() => remove(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Users Panel ──────────────────────────────────────────────────────────────

function UsersPanel() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [roleChange, setRoleChange] = useState<{ id: string; current: string } | null>(null);
  const [newRole, setNewRole] = useState("user");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });
    setUsers(data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    await supabase.from("users").delete().eq("id", id);
    setConfirmDelete(null);
    load();
  }

  async function updateRole() {
    if (!roleChange) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/admin/users/role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId: roleChange.id, role: newRole }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Couldn't update that user's role.");
      return;
    }

    setRoleChange(null);
    load();
  }

  const filtered = (users ?? []).filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-[#143D60] text-white",
      mod: "bg-[#27667B] text-white",
      user: "bg-gray-100 text-gray-600",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[role] ?? styles.user}`}>
        {role}
      </span>
    );
  };

  return (
    <div>
      <SectionHeader title="Users" subtitle="Manage user accounts and roles" />
      <div className="mb-4">
        <input
          className={inputCls}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {users === null ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  Name
                </th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">
                  Email
                </th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  Role
                </th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">
                  Joined
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                >
                  <td className="px-5 py-3 font-medium text-[#143D60]">{u.full_name}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                  <td className="px-5 py-3">{roleBadge(u.role)}</td>
                  <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">
                    {fmtDate(u.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 justify-end">
                      <ActionButton
                        onClick={() => {
                          setRoleChange({ id: u.id, current: u.role });
                          setNewRole(u.role);
                        }}
                        variant="outline"
                        small
                      >
                        Role
                      </ActionButton>
                      <ActionButton
                        onClick={() => setConfirmDelete(u.id)}
                        variant="danger"
                        small
                      >
                        Remove
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No users found.</p>
          )}
        </div>
      )}

      {roleChange && (
        <Modal title="Change Role" onClose={() => setRoleChange(null)}>
          <p className="text-sm text-gray-500 mb-4">Select a new role for this user.</p>
          <Field label="Role">
            <select
              className={inputCls}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="user">user</option>
              <option value="mod">mod</option>
              <option value="admin">admin</option>
            </select>
          </Field>
          <div className="flex gap-3 justify-end mt-2">
            <ActionButton onClick={() => setRoleChange(null)} variant="outline">
              Cancel
            </ActionButton>
            <ActionButton onClick={updateRole} variant="primary">
              Update Role
            </ActionButton>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Permanently remove this user? This cannot be undone and will delete all their data."
          onConfirm={() => remove(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Listings Panel ───────────────────────────────────────────────────────────

function ListingsPanel() {
  const [listings, setListings] = useState<ListingRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("listings")
      .select(
        `id, title, category, categories, price_per_day, available, created_at,
         users!listings_user_id_fkey ( full_name )`
      )
      .order("created_at", { ascending: false });
    setListings(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((r: any) => ({ ...r, users: unwrap(r.users) }))
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    // clear out everything that points at this listing before the listing
    // itself, in dependency order, so the delete doesn't fail on an fk
    const { data: reqRows } = await supabase.from("requests").select("id").eq("listing_id", id);
    const requestIds = (reqRows ?? []).map((r) => r.id);
    if (requestIds.length > 0) {
      await supabase.from("messages").delete().in("request_id", requestIds);
    }
    await supabase.from("ratings").delete().eq("listing_id", id);
    await supabase.from("requests").delete().eq("listing_id", id);
    await supabase.from("listing_images").delete().eq("listing_id", id);

    // .select() so we can tell a real delete from RLS silently blocking it
    // (Supabase reports success with zero rows affected either way)
    const { data: deletedRows, error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .select("id");
    setConfirmDelete(null);

    if (error) {
      alert(`Couldn't remove this listing: ${error.message}`);
      return;
    }
    if (!deletedRows || deletedRows.length === 0) {
      alert("Couldn't remove this listing. The admin account may not have delete permission on it.");
      return;
    }
    load();
  }

  const filtered = (listings ?? []).filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.categories?.length ? l.categories : [l.category]).some((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      ) ||
      l.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <SectionHeader title="Listings" subtitle="Review and remove gear listings" />
      <div className="mb-4">
        <input
          className={inputCls}
          placeholder="Search by title, category, or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {listings === null ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  Title
                </th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">
                  Owner
                </th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">
                  Category
                </th>
                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  $/day
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr
                  key={l.id}
                  className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                >
                  <td className="px-5 py-3 font-medium text-[#143D60]">{l.title}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                    {l.users?.full_name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-500 hidden lg:table-cell capitalize">
                    {(l.categories?.length ? l.categories : [l.category]).join(", ")}
                  </td>
                  <td className="px-5 py-3 text-gray-700 font-semibold">${l.price_per_day}</td>
                  <td className="px-5 py-3 text-right">
                    <ActionButton
                      onClick={() => setConfirmDelete(l.id)}
                      variant="danger"
                      small
                    >
                      Remove
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No listings found.</p>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Permanently remove this listing? All related requests and images will also be deleted."
          onConfirm={() => remove(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Posts Panel ──────────────────────────────────────────────────────────────

function PostsPanel() {
  const [posts, setPosts] = useState<PostRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select(
        `id, content, post_type, created_at,
         users!posts_user_id_fkey ( full_name )`
      )
      .order("created_at", { ascending: false });
    setPosts(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((r: any) => ({ ...r, users: unwrap(r.users) }))
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    setConfirmDelete(null);
    load();
  }

  const filtered = (posts ?? []).filter(
    (p) =>
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <SectionHeader title="Community Posts" subtitle="Moderate community feed content" />
      <div className="mb-4">
        <input
          className={inputCls}
          placeholder="Search by content or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {posts === null ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[#27667B] uppercase tracking-wide">
                    {post.post_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    · {post.users?.full_name ?? "Unknown"} · {fmtDate(post.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
              </div>
              <ActionButton onClick={() => setConfirmDelete(post.id)} variant="danger" small>
                Remove
              </ActionButton>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No posts found.</p>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Permanently remove this post? This cannot be undone."
          onConfirm={() => remove(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Blog Panel ───────────────────────────────────────────────────────────────

function BlogPanel() {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select(
        `id, title, slug, is_published, created_at,
         users!blog_posts_author_id_fkey ( full_name )`
      )
      .order("created_at", { ascending: false });
    setPosts(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((r: any) => ({ ...r, users: unwrap(r.users) }))
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openEdit(post: BlogPost) {
    const { data } = await supabase
      .from("blog_posts")
      .select("content, cover_image_url")
      .eq("id", post.id)
      .single();
    setContent((data as { content: string; cover_image_url: string | null })?.content ?? "");
    setCoverUrl((data as { content: string; cover_image_url: string | null })?.cover_image_url ?? "");
    setEditing(post);
    setIsNew(false);
  }

  function openNew() {
    setEditing({ title: "", slug: "", is_published: false });
    setContent("");
    setCoverUrl("");
    setIsNew(true);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    if (isNew) {
      await supabase.from("blog_posts").insert({
        title: editing.title,
        slug: editing.slug,
        content,
        cover_image_url: coverUrl || null,
        is_published: editing.is_published ?? false,
      });
    } else {
      await supabase
        .from("blog_posts")
        .update({
          title: editing.title,
          slug: editing.slug,
          content,
          cover_image_url: coverUrl || null,
          is_published: editing.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id!);
    }
    setSaving(false);
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    await supabase.from("blog_posts").delete().eq("id", id);
    setConfirmDelete(null);
    load();
  }

  return (
    <div>
      <SectionHeader
        title="Blog"
        subtitle="Publish and manage blog posts (mods and admins can write)"
      />
      <div className="mb-4 flex justify-end">
        <ActionButton onClick={openNew} variant="lime">
          + New Post
        </ActionButton>
      </div>

      {posts === null ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#143D60] truncate">{post.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {post.users?.full_name ?? "Unknown"} · {fmtDate(post.created_at)} ·{" "}
                  <span className={post.is_published ? "text-green-600" : "text-amber-500"}>
                    {post.is_published ? "Published" : "Draft"}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <ActionButton onClick={() => openEdit(post)} variant="outline" small>
                  Edit
                </ActionButton>
                <ActionButton onClick={() => setConfirmDelete(post.id)} variant="danger" small>
                  Remove
                </ActionButton>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No blog posts yet.</p>
          )}
        </div>
      )}

      {editing && (
        <Modal
          title={isNew ? "New Blog Post" : "Edit Blog Post"}
          onClose={() => setEditing(null)}
        >
          <Field label="Title">
            <input
              className={inputCls}
              value={editing.title ?? ""}
              onChange={(e) => {
                const t = e.target.value;
                setEditing({
                  ...editing,
                  title: t,
                  slug: isNew
                    ? t
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                    : editing.slug,
                });
              }}
            />
          </Field>
          <Field label="Slug">
            <input
              className={inputCls}
              value={editing.slug ?? ""}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
            />
          </Field>
          <Field label="Cover Image URL">
            <input
              className={inputCls}
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />
          </Field>
          <Field label="Content">
            <textarea
              className={textareaCls}
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Field>
          <div className="mb-6">
            <Toggle
              checked={editing.is_published ?? false}
              onChange={(v) => setEditing({ ...editing, is_published: v })}
              label="Published"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <ActionButton onClick={() => setEditing(null)} variant="outline">
              Cancel
            </ActionButton>
            <ActionButton
              onClick={save}
              disabled={saving || !editing.title || !editing.slug || !content}
              variant="primary"
            >
              {saving ? "Saving..." : "Save"}
            </ActionButton>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Permanently delete this blog post?"
          onConfirm={() => remove(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Testimonials Panel ───────────────────────────────────────────────────────

function TestimonialsPanel() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [adding, setAdding] = useState(false);
  const [blank, setBlank] = useState<Partial<Testimonial>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("testimonials").select("*").order("display_order");
    setItems(data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    await supabase
      .from("testimonials")
      .update({
        name: editing.name,
        position_title: editing.position_title,
        content: editing.content,
        is_active: editing.is_active,
        display_order: editing.display_order,
      })
      .eq("id", editing.id);
    setSaving(false);
    setEditing(null);
    load();
  }

  async function add() {
    if (!blank.name || !blank.content) return;
    setSaving(true);
    await supabase.from("testimonials").insert({
      name: blank.name,
      position_title: blank.position_title ?? null,
      content: blank.content,
      is_active: blank.is_active ?? true,
      display_order: blank.display_order ?? (items?.length ?? 0) + 1,
    });
    setSaving(false);
    setAdding(false);
    setBlank({});
    load();
  }

  async function remove(id: string) {
    await supabase.from("testimonials").delete().eq("id", id);
    setConfirmDelete(null);
    load();
  }

  return (
    <div>
      <SectionHeader title="Testimonials" subtitle="Manage homepage testimonials" />
      <div className="mb-4 flex justify-end">
        <ActionButton onClick={() => setAdding(true)} variant="lime">
          + Add Testimonial
        </ActionButton>
      </div>

      {items === null ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#143D60]">{item.name}</p>
                {item.position_title && (
                  <p className="text-xs text-[#27667B] mb-1">{item.position_title}</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {item.is_active ? "Active" : "Hidden"} · Order {item.display_order}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <ActionButton onClick={() => setEditing(item)} variant="outline" small>
                  Edit
                </ActionButton>
                <ActionButton onClick={() => setConfirmDelete(item.id)} variant="danger" small>
                  Remove
                </ActionButton>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">No testimonials yet.</p>
          )}
        </div>
      )}

      {editing && (
        <Modal title="Edit Testimonial" onClose={() => setEditing(null)}>
          <TestimonialForm data={editing} onChange={(d) => setEditing(d as Testimonial)} />
          <div className="flex gap-3 justify-end mt-2">
            <ActionButton onClick={() => setEditing(null)} variant="outline">
              Cancel
            </ActionButton>
            <ActionButton onClick={save} disabled={saving} variant="primary">
              {saving ? "Saving..." : "Save"}
            </ActionButton>
          </div>
        </Modal>
      )}

      {adding && (
        <Modal
          title="Add Testimonial"
          onClose={() => {
            setAdding(false);
            setBlank({});
          }}
        >
          <TestimonialForm data={blank} onChange={setBlank} />
          <div className="flex gap-3 justify-end mt-2">
            <ActionButton
              onClick={() => {
                setAdding(false);
                setBlank({});
              }}
              variant="outline"
            >
              Cancel
            </ActionButton>
            <ActionButton
              onClick={add}
              disabled={saving || !blank.name || !blank.content}
              variant="lime"
            >
              {saving ? "Adding..." : "Add"}
            </ActionButton>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Remove this testimonial?"
          onConfirm={() => remove(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Panel; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "hero", label: "Hero Slides" },
  { id: "promo", label: "Promo" },
  { id: "categories", label: "Categories" },
  { id: "users", label: "Users" },
  { id: "listings", label: "Listings" },
  { id: "posts", label: "Community Posts" },
  { id: "blog", label: "Blog" },
  { id: "testimonials", label: "Testimonials" },
];

// ─── Admin Shell ──────────────────────────────────────────────────────────────

export default function AdminShell({
  adminName,
  adminEmail,
}: {
  adminName: string;
  adminEmail: string;
}) {
  const [active, setActive] = useState<Panel>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      const [users, listings, posts, requests] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("requests").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: users.count ?? 0,
        listings: listings.count ?? 0,
        posts: posts.count ?? 0,
        requests: requests.count ?? 0,
      });
    }
    loadStats();
  }, []);

  function navigate(panel: Panel) {
    setActive(panel);
    setSidebarOpen(false);
  }

  const renderPanel = () => {
    switch (active) {
      case "overview":
        return <OverviewPanel stats={stats} />;
      case "hero":
        return <HeroPanel />;
      case "promo":
        return <PromoPanel />;
      case "categories":
        return <CategoriesPanel />;
      case "users":
        return <UsersPanel />;
      case "listings":
        return <ListingsPanel />;
      case "posts":
        return <PostsPanel />;
      case "blog":
        return <BlogPanel />;
      case "testimonials":
        return <TestimonialsPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#143D60] z-40 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:flex
        `}
      >
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#DDEB9D] mb-0.5">
            Circl
          </p>
          <p className="text-white font-bold text-lg tracking-tight">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`
                w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5
                ${
                  active === item.id
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Admin identity */}
        <div className="px-5 py-5 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#DDEB9D] flex items-center justify-center flex-shrink-0">
              <span className="text-[#143D60] font-bold text-xs">
                {adminName?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{adminName}</p>
              <p className="text-white/40 text-xs truncate">{adminEmail}</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="mt-4 block text-center text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-4 px-4 py-4 bg-white border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex flex-col gap-1.5 items-center justify-center"
          >
            <span className="w-5 h-0.5 bg-[#143D60]" />
            <span className="w-5 h-0.5 bg-[#143D60]" />
            <span className="w-5 h-0.5 bg-[#143D60]" />
          </button>
          <span className="font-bold text-[#143D60] tracking-tight">Admin</span>
        </div>

        {/* Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">{renderPanel()}</main>
      </div>
    </div>
  );
}