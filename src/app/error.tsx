"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Алдаа гарлаа
        </h1>
        <p className="text-muted-foreground">
          Хуудсыг ачаалахад алдаа гарлаа. Дахин оролдоно уу.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Дахин оролдох
        </button>
      </div>
    </div>
  );
}
