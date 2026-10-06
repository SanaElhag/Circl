// basic loading block - stack a few of these into roughly the shape of the
// real content so the page doesn't jump when the data shows up
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded-xl ${className}`} />;
}

// a list-row shape: avatar circle + two lines, used for messages/notifications
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <Skeleton className="w-11 h-11 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
