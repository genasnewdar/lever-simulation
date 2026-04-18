"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
              Алдаа гарлаа
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              Системд алдаа гарлаа. Хуудсыг дахин ачаална уу.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.5rem",
                background: "#2563eb",
                color: "white",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Дахин оролдох
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
