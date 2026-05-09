export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Centers the auth form both vertically and horizontally..
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      {children}
    </div>
  );
}