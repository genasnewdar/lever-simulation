"use client";

import { Users } from "lucide-react";
import type { RosterPayload } from "@/lib/sse/rosterStream";

interface Props {
  roster: RosterPayload;
  selfUserId?: string | null;
}

export function RosterCard({ roster, selfUserId }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
        Roster
      </div>

      <div className="mb-3 text-sm font-medium text-zinc-900">
        {roster.ready} / {roster.total} students ready
      </div>

      <div className="flex flex-wrap gap-1.5">
        {roster.participants.map((p) => {
          const isSelf = !!selfUserId && p.user_id === selfUserId;
          return (
            <div
              key={p.user_id}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                isSelf
                  ? "bg-emerald-600 text-white border border-emerald-600"
                  : "bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}
              title={p.status}
            >
              {p.initials || "?"}
            </div>
          );
        })}
      </div>
    </div>
  );
}
