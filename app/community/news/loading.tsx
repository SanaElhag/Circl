import { Skeleton } from "@/app/components/Skeleton";

export default function NewsLoading() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="space-y-2 mb-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-56" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex gap-4">
              <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
