import { Skeleton } from "@/app/components/Skeleton";

export default function CommunityLoading() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
