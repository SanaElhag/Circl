import { Skeleton } from "@/app/components/Skeleton";

export default function GearDetailLoading() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
