import Link from "next/link";

export default function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-4 px-4 py-3 text-xs">
        <Link
          href="/"
          className="rounded-lg px-2 py-2 text-center font-medium text-gray-700 hover:bg-gray-50"
        >
          Home
        </Link>
        <Link
          href="/browse"
          className="rounded-lg px-2 py-2 text-center font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse
        </Link>
        <Link
          href="/requests"
          className="rounded-lg px-2 py-2 text-center font-medium text-gray-700 hover:bg-gray-50"
        >
          Requests
        </Link>
        <Link
          href="/profile"
          className="rounded-lg px-2 py-2 text-center font-medium text-gray-700 hover:bg-gray-50"
        >
          Profile
        </Link>
      </div>
    </nav>
  );
}