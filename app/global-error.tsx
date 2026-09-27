"use client";

import { useEffect } from "react";

// Only fires if the root layout itself crashes (e.g. TopNav or Footer throws)
// — errors inside a normal page are caught by error.tsx instead, which keeps
// the nav/footer on screen. This one has to render its own <html>/<body>
// since it's standing in for the entire root layout, and deliberately avoids
// depending on anything that could itself be the thing that broke.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error in root layout:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F9FAFB" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <p style={{ fontSize: 96, fontWeight: 900, color: "#E8DFCE", lineHeight: 1, margin: 0 }}>!</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#143D60", margin: "8px 0 12px" }}>
              Something went wrong.
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 32 }}>
              The page couldn&apos;t load. Try refreshing — if it keeps happening, come back in a bit.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#143D60",
                color: "white",
                fontWeight: 700,
                padding: "14px 28px",
                borderRadius: 12,
                border: "none",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
