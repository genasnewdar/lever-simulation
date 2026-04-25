"use client";

import { ListChecks } from "lucide-react";

const RULES: string[] = [
  "Шалгалтын явцад tab солих хориотой",
  "Гадаад хэрэгсэл, толь бичиг ашиглах боломжгүй",
  "Хариултууд автоматаар хадгалагдана",
];

const SECTIONS: Array<{ name: string; minutes: number }> = [
  { name: "Listening", minutes: 40 },
  { name: "Reading", minutes: 60 },
  { name: "Writing", minutes: 60 },
];

export function RulesCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <ListChecks className="h-3.5 w-3.5" strokeWidth={1.5} />
        Дүрэм
      </div>

      <ul className="mb-3 space-y-1.5 text-sm text-zinc-700">
        {RULES.map((r) => (
          <li key={r} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-400" />
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-zinc-100 pt-3 text-xs text-zinc-600">
        {SECTIONS.map((s, i) => (
          <span key={s.name}>
            {s.name} {s.minutes} мин
            {i < SECTIONS.length - 1 ? " · " : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
