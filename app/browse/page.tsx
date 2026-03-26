import Link from "next/link";
import MobileBottomNav from "../components/MobileBottomNav";
const listings = [
  {
    id: "ski-boots-1",
    title: "Ski Boots (Men’s 27.5)",
    category: "Skiing",
    pricePerDay: 12,
    location: "On campus",
    condition: "Good",
  },
  {
    id: "snowboard-1",
    title: "Snowboard + Bindings (155cm)",
    category: "Snowboarding",
    pricePerDay: 18,
    location: "On campus",
    condition: "Great",
  },
  {
    id: "tent-1",
    title: "2-Person Camping Tent",
    category: "Camping",
    pricePerDay: 10,
    location: "Abbotsford",
    condition: "Good",
  },
  {
    id: "backpack-1",
    title: "Hiking Backpack (60L)",
    category: "Hiking",
    pricePerDay: 8,
    location: "On campus",
    condition: "Good",
  },
  {
    id: "poles-1",
    title: "Trekking Poles (Pair)",
    category: "Hiking",
    pricePerDay: 4,
    location: "On campus",
    condition: "Great",
  },
  {
    id: "helmet-1",
    title: "Ski/Snow Helmet (M)",
    category: "Skiing",
    pricePerDay: 6,
    location: "Abbotsford",
    condition: "Great",
  },
];

export default function BrowsePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-black to-gray-700" />
            <span className="text-lg font-semibold tracking-tight">Circl</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back
            </Link>
            <button
              type="button"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              List gear (placeholder)
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Browse outdoor gear</h1>
            <p className="mt-2 text-sm text-gray-700">
              Prototype listings. Requests are placeholders for now.
            </p>
          </div>

          <div className="grid w-full gap-3 md:w-auto md:grid-cols-3">
            <input
              placeholder="Search gear…"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
            />
            <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
              <option>All categories</option>
              <option>Hiking</option>
              <option>Camping</option>
              <option>Skiing</option>
              <option>Snowboarding</option>
              <option>Climbing</option>
            </select>
            <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
              <option>Sort: Recommended</option>
              <option>Price: Low to high</option>
              <option>Price: High to low</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="aspect-[16/10] w-full rounded-xl bg-gray-100" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {item.category} • {item.condition} • {item.location}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                  ${item.pricePerDay}/day
                </span>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Request dates
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Details
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Buttons are placeholders. We’ll wire up the flows later.
              </p>
            </div>
          ))}
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