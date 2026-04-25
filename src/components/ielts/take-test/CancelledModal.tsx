"use client";

import { AlertCircle } from "lucide-react";

interface Props {
  reason?: string;
  onExit: () => void;
}

export function CancelledModal({ reason, onExit }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-rose-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-full bg-rose-50 p-2">
            <AlertCircle className="h-5 w-5 text-rose-600" strokeWidth={1.5} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Шалгалт цуцлагдсан
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {reason || "Зохион байгуулагч шалгалтыг зогсоосон байна."}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Зохион байгуулагчтай холбогдоно уу.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Гарах
        </button>
      </div>
    </div>
  );
}
