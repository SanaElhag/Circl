import { Skeleton } from "@/app/components/Skeleton";

export default function BlogPostLoading() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="aspect-video rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-3.5 w-full" />)}
        </div>
      </div>
    </main>
  );
}
