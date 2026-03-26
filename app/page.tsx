import Link from "next/link";
import MobileBottomNav from "./components/MobileBottomNav";
import { supabase } from '../lib/supabase'

const categories = [
  "Skiing",
  "Snowboarding",
  "Hiking",
  "Camping",
  "Climbing",
  "Water Sports",
];

const featured = [
  { id: "1", title: "Snowboard + Bindings (155cm)", category: "Snowboarding", price: 18 },
  { id: "2", title: "2-Person Camping Tent", category: "Camping", price: 10 },
  { id: "3", title: "Ski Helmet (M)", category: "Skiing", price: 6 },
];

export default function Home() {
  console.log('Supabase client:', supabase)
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-black to-gray-700" />
            <span className="text-lg font-semibold tracking-tight">Circl</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-gray-700 md:flex">
            <Link href="/browse" className="hover:text-black">
              Browse gear
            </Link>
            <a href="#how" className="hover:text-black">
              How it works
            </a>
            <a href="#trust" className="hover:text-black">
              Trust
            </a>
            <a href="#waitlist" className="hover:text-black">
              Waitlist
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/browse"
              className="hidden rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 md:inline-flex"
            >
              View listings
            </Link>
            <Link
              href="/browse"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Start browsing
            </Link>
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-8 shadow-sm">
          <p className="text-xs font-semibold text-gray-600">Student-only outdoor gear rentals</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Welcome to Circl
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-700">
            Rent outdoor gear from other students: skiing, snowboarding, hiking, camping, and more.
            Browse listings, request dates, and get approved. No payments or chat in the MVP.
          </p>

          {/* Search + actions */}
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <input
              placeholder="Search gear (boots, tent, helmet)…"
              className="md:col-span-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
            />
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/browse"
                className="rounded-xl bg-black px-4 py-3 text-center text-sm font-medium text-white hover:opacity-90"
              >
                Browse
              </Link>
              <button
                type="button"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                List gear (placeholder)
              </button>
            </div>
          </div>

          {/* Category chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Featured today</h2>
            <p className="mt-1 text-sm text-gray-700">
              Example listings for the prototype.
            </p>
          </div>

          <Link href="/browse" className="text-sm font-medium text-gray-700 hover:text-black">
            View all →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="aspect-[16/10] w-full rounded-xl bg-gray-100" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{item.category}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                  ${item.price}/day
                </span>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Request dates
                </button>
                <Link
                  href="/browse"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-center text-sm font-medium hover:bg-gray-50"
                >
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-xl font-bold tracking-tight">How it works</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">STEP 1</p>
              <p className="mt-2 text-sm font-semibold">List gear</p>
              <p className="mt-2 text-sm text-gray-700">
                Add photos, condition, price per day, and available dates.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">STEP 2</p>
              <p className="mt-2 text-sm font-semibold">Request dates</p>
              <p className="mt-2 text-sm text-gray-700">
                Choose your dates and send a request.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">STEP 3</p>
              <p className="mt-2 text-sm font-semibold">Approve</p>
              <p className="mt-2 text-sm text-gray-700">
                The owner accepts or declines. Then you pickup and return.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-xl font-bold tracking-tight">Trust basics</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold">Student verification</p>
              <p className="mt-2 text-sm text-gray-700">
                Pilot starts with student email verification.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold">Clear status tracking</p>
              <p className="mt-2 text-sm text-gray-700">
                Pending, accepted, declined. No confusion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight">Join the waitlist</h2>
            <p className="mt-2 text-sm text-gray-700">
              Placeholder for now. We’ll connect this later.
            </p>

            <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="email"
                placeholder="name@ufv.ca"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
              />
              <button
                type="button"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-10 text-xs text-gray-500">
          © {new Date().getFullYear()} Circl. Prototype.
        </div>
      </footer>
    <MobileBottomNav />  
    </main>
  );
}