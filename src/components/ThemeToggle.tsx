"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light/dark theme toggle. The initial theme is applied before paint by the
 * inline script in the root layout; this button reads the current state on
 * mount and flips the `.dark` class on <html>, persisting the choice.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Гэрэлтэй горим" : "Харанхуй горим"}
      title={isDark ? "Гэрэлтэй горим" : "Харанхуй горим"}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-md text-ink-soft hover:text-ink hover:bg-paper-3 transition-colors",
        className,
      )}
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch */}
      {mounted && isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}

export default ThemeToggle;
