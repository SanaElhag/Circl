/**
 * Shared pulsing-block primitive for loading skeletons. Compose these into
 * shapes that match the real content (a row, a card, a stat tile) so the
 * page doesn't jump around once data arrives — the skeleton should occupy
 * roughly the same space as what replaces it.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded-xl ${className}`} />;
}

/** A conversation/notification-style row: avatar circle + two lines of text. */
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
