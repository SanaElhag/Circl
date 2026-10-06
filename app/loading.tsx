import { Skeleton } from "./components/Skeleton";

// shows while the homepage data is loading, matches the real layout so it
// doesn't jump around once the content shows up
export default function HomeLoading() {
  return (
    <div className="bg-[#F5F0E8]">
      <div className="h-[90vh] min-h-[600px] bg-[#E8DFCE] animate-pulse" />
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-7 sm:px-8">
          <div className="space-y-2 mb-8">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-72" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#FAF7F2] border border-[#D4C9B0] overflow-hidden">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
