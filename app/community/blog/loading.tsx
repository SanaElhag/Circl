import { Skeleton } from "@/app/components/Skeleton";

export default function BlogIndexLoading() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="space-y-2 mb-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <Skeleton className="aspect-video rounded-none" />
              <div className="p-5 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
