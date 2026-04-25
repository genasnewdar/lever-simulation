"use client";

interface Props {
  variant: "waiting" | "ready" | "starting" | "error";
  label: string;
}

const STYLES: Record<Props["variant"], string> = {
  waiting: "bg-amber-50 text-amber-700 border-amber-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  starting: "bg-sky-50 text-sky-700 border-sky-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
};

const DOT_STYLES: Record<Props["variant"], string> = {
  waiting: "bg-amber-500",
  ready: "bg-emerald-500",
  starting: "bg-sky-500",
  error: "bg-rose-500",
};

export function StatusPill({ variant, label }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${STYLES[variant]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[variant]} animate-pulse`} />
      <span>{label}</span>
    </div>
  );
}
