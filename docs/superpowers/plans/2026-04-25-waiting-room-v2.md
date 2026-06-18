# Waiting Room v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Upgrade `/ielts/waiting/[sessionId]` from a static "you're waiting" screen into a multi-block lobby: audio check, live roster, rules card, and a 3-2-1 countdown overlay before exam start. Replaces the abrupt jump-cut into Listening with a calmer, cohort-aware beat.

**Architecture:** Decompose the existing 198-line page into focused subcomponents under `src/components/ielts/waiting/`. Existing 3-second polling stays for status; add a parallel SSE EventSource for the new `roster-updated` event broadcast by the backend (plan #1). The redirect-on-grant logic is replaced by a countdown overlay that takes over the page for ~3 seconds before navigating.

**Tech Stack:** Next.js 15 · React 19 · Tailwind v4 · `lucide-react` · native `EventSource` for SSE (auth via query-string `code` param to match the existing SSE endpoint pattern).

**Resolved scope decisions:**

- **Audio test clip:** use a short bundled tone — `/audio/audio-check.mp3` (a 1-second 440Hz tone). The plan creates a placeholder file path; if the actual MP3 isn't on disk, the button still renders but logs a warning. User can swap in a real clip later.
- **Roster privacy:** initials only (first letter of first 1-2 name parts). Self-marked with accent color. No full names, no avatars.
- **SSE auth:** pass `?code={examCode}` as query param. Backend SSE endpoint already accepts code-based auth (existing pattern from `useExamCodeStore`).
- **SSE failure handling:** if the EventSource errors out, hide the roster card silently. Polling keeps the page useful.
- **Countdown:** 3 seconds (3 → 2 → 1 → "Эхэлье!") before redirect. During countdown, polling pauses to avoid overlapping toasts.

---

## File Structure

| File                                                 | Status      | Responsibility                                                           |
| ---------------------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `src/components/ielts/waiting/StatusPill.tsx`        | create      | Top "waiting / starting" pill with pulsing dot                           |
| `src/components/ielts/waiting/AudioCheckButton.tsx`  | create      | Self-contained play/confirm audio test                                   |
| `src/components/ielts/waiting/RulesCard.tsx`         | create      | Static rules + section duration list                                     |
| `src/components/ielts/waiting/RosterCard.tsx`        | create      | "N/M ready" + initials grid, fed by props                                |
| `src/components/ielts/waiting/CountdownOverlay.tsx`  | create      | Fullscreen 3-2-1 with auto-fire callback                                 |
| `src/lib/sse/rosterStream.ts`                        | create      | Tiny EventSource wrapper for roster-updated events                       |
| `src/app/(pages)/ielts/waiting/[sessionId]/page.tsx` | modify      | Compose subcomponents, wire roster SSE, swap auto-redirect for countdown |
| `public/audio/audio-check.mp3`                       | placeholder | Audio test clip (real file added later)                                  |

---

## Task 1: StatusPill component

**Files:** `src/components/ielts/waiting/StatusPill.tsx`

- [ ] Create file:

```tsx
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
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${STYLES[variant]}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[variant]} animate-pulse`}
      />
      <span>{label}</span>
    </div>
  );
}
```

- [ ] Verify: `npx tsc --noEmit 2>&1 | grep StatusPill | head -3` returns empty.
- [ ] Commit: `git add src/components/ielts/waiting/StatusPill.tsx && git commit -m "feat(waiting): StatusPill component"`

---

## Task 2: AudioCheckButton component

**Files:** `src/components/ielts/waiting/AudioCheckButton.tsx`

- [ ] Create file:

```tsx
"use client";

import { useRef, useState } from "react";
import { Headphones, Check } from "lucide-react";

interface Props {
  src?: string;
}

export function AudioCheckButton({ src = "/audio/audio-check.mp3" }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "playing" | "confirmed">("idle");

  const play = async () => {
    setState("playing");
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.addEventListener("ended", () =>
        setState((s) => (s === "playing" ? "idle" : s)),
      );
      audioRef.current.addEventListener("error", () => {
        // Source missing or unplayable — drop back to idle so user can still confirm.
        setState("idle");
      });
    }
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch {
      setState("idle");
    }
  };

  const confirm = () => setState("confirmed");

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
        Audio Check
      </div>
      <div className="mb-1 text-sm font-medium text-zinc-900">
        Чихэвчээ шалгана уу
      </div>
      <div className="mb-3 text-xs text-zinc-600">
        Дуу сонсогдоход баталгаажуулна уу
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={play}
          disabled={state === "confirmed"}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
          <Headphones className="h-4 w-4" strokeWidth={1.5} />
          {state === "playing" ? "Тоглож байна..." : "Тест дуу тоглуулах"}
        </button>

        {state !== "idle" && (
          <button
            type="button"
            onClick={confirm}
            disabled={state === "confirmed"}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              state === "confirmed"
                ? "border border-emerald-300 bg-white text-emerald-700"
                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}>
            {state === "confirmed" ? (
              <>
                <Check className="h-4 w-4" strokeWidth={1.5} /> Сонссон
              </>
            ) : (
              "Сонссон"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] Verify: `npx tsc --noEmit 2>&1 | grep AudioCheckButton | head -3` returns empty.
- [ ] Commit: `git add src/components/ielts/waiting/AudioCheckButton.tsx && git commit -m "feat(waiting): AudioCheckButton component"`

---

## Task 3: RulesCard component

**Files:** `src/components/ielts/waiting/RulesCard.tsx`

- [ ] Create file:

```tsx
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
```

- [ ] Verify: `npx tsc --noEmit 2>&1 | grep RulesCard | head -3` returns empty.
- [ ] Commit: `git add src/components/ielts/waiting/RulesCard.tsx && git commit -m "feat(waiting): RulesCard component"`

---

## Task 4: RosterCard component + SSE wrapper

**Files:**

- Create: `src/components/ielts/waiting/RosterCard.tsx`
- Create: `src/lib/sse/rosterStream.ts`

- [ ] Create the SSE wrapper at `src/lib/sse/rosterStream.ts`:

```typescript
export interface RosterParticipant {
  initials: string;
  user_id: string;
  status: string;
}

export interface RosterPayload {
  total: number;
  ready: number;
  participants: RosterParticipant[];
}

export type RosterListener = (payload: RosterPayload) => void;

/**
 * Open an EventSource against the session status-stream and forward
 * roster-updated events. Returns a cleanup function.
 *
 * Auth: the existing SSE endpoint accepts the exam code via query string.
 * If a different auth shape is needed, adjust here.
 */
export function subscribeToRosterUpdates(
  sessionId: string,
  examCode: string,
  onRoster: RosterListener,
  onError?: (e: Event) => void,
): () => void {
  if (typeof window === "undefined" || !sessionId || !examCode) {
    return () => undefined;
  }

  const url = `/api/student/ielts/session/${encodeURIComponent(sessionId)}/status-stream?code=${encodeURIComponent(examCode)}`;
  const es = new EventSource(url);

  const handler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as RosterPayload;
      onRoster(data);
    } catch {
      // ignore malformed payloads
    }
  };

  es.addEventListener("roster-updated", handler);
  if (onError) es.addEventListener("error", onError);

  return () => {
    es.removeEventListener("roster-updated", handler);
    if (onError) es.removeEventListener("error", onError);
    es.close();
  };
}
```

- [ ] Create the component at `src/components/ielts/waiting/RosterCard.tsx`:

```tsx
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
              title={p.status}>
              {p.initials || "?"}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] Verify both: `npx tsc --noEmit 2>&1 | grep -E "RosterCard|rosterStream" | head -3` returns empty.
- [ ] Commit: `git add src/components/ielts/waiting/RosterCard.tsx src/lib/sse/rosterStream.ts && git commit -m "feat(waiting): RosterCard + roster SSE subscription"`

---

## Task 5: CountdownOverlay component

**Files:** `src/components/ielts/waiting/CountdownOverlay.tsx`

- [ ] Create file:

```tsx
"use client";

import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
  /** Seconds to count down from. Default 3. */
  seconds?: number;
}

export function CountdownOverlay({ onComplete, seconds = 3 }: Props) {
  const [n, setN] = useState(seconds);

  useEffect(() => {
    if (n <= 0) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN(n - 1), 800);
    return () => clearTimeout(t);
  }, [n, onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 text-white"
      role="alert"
      aria-live="assertive">
      <div
        key={n}
        className="text-center"
        style={{
          animation: "scaleFade 700ms cubic-bezier(0.32, 0.04, 0.18, 1)",
        }}>
        {n > 0 ? (
          <div className="text-9xl font-bold tracking-tight">{n}</div>
        ) : (
          <div className="text-5xl font-semibold tracking-tight">Эхэлье!</div>
        )}
      </div>
      <style>{`
        @keyframes scaleFade {
          0% { opacity: 0; transform: scale(1.4); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
```

- [ ] Verify: `npx tsc --noEmit 2>&1 | grep CountdownOverlay | head -3` returns empty.
- [ ] Commit: `git add src/components/ielts/waiting/CountdownOverlay.tsx && git commit -m "feat(waiting): CountdownOverlay 3-2-1 component"`

---

## Task 6: Compose into the waiting room page

**Files:** `src/app/(pages)/ielts/waiting/[sessionId]/page.tsx`

This is the integration step. The existing page polls every 3s and auto-redirects when `can_take_test` becomes true. We're going to:

- Add the new subcomponents into the layout
- Open the SSE roster subscription on mount
- Replace the immediate auto-redirect with the countdown overlay

- [ ] **Step 1: Read the file to confirm structure**

Open `src/app/(pages)/ielts/waiting/[sessionId]/page.tsx`. Note the existing imports, the `state` shape (`WaitingStatus`), and the auto-redirect `useEffect` at lines ~80-97.

- [ ] **Step 2: Replace the file**

Replace the entire file contents with:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";

import { useExamCodeStore } from "@/lib/stores/exam-code-store";
import { StatusPill } from "@/components/ielts/waiting/StatusPill";
import { AudioCheckButton } from "@/components/ielts/waiting/AudioCheckButton";
import { RulesCard } from "@/components/ielts/waiting/RulesCard";
import { RosterCard } from "@/components/ielts/waiting/RosterCard";
import { CountdownOverlay } from "@/components/ielts/waiting/CountdownOverlay";
import {
  subscribeToRosterUpdates,
  type RosterPayload,
} from "@/lib/sse/rosterStream";

type SessionStatus =
  | "CREATED"
  | "WAITING"
  | "ACCESS_GRANTED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

interface WaitingStatus {
  session_id: string;
  session_code: string;
  session_status: SessionStatus;
  my_status: string;
  can_take_test: boolean;
  attempt_id: string | null;
  started_at: string | null;
  user_id?: string | null;
}

const POLL_INTERVAL_MS = 3000;

export default function WaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;
  const { examCode, studentName, testTitle, examDate, setAttempt } =
    useExamCodeStore();

  const [state, setState] = useState<WaitingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterPayload | null>(null);
  const [countingDown, setCountingDown] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!examCode || !sessionId) return;
    try {
      const resp = await axios.post("/api/ielts/session-status", {
        session_id: sessionId,
        code: examCode,
      });
      setState(resp.data);
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(
          typeof detail === "string"
            ? detail
            : detail?.message || "Хүлээлгийн төлөв авахад алдаа гарлаа.",
        );
      } else {
        setError("Сервертэй холбогдоход алдаа гарлаа.");
      }
    }
  }, [examCode, sessionId]);

  // Redirect to mock-exam if no exam code in store
  useEffect(() => {
    if (!examCode) {
      router.replace("/ielts/mock-exam");
    }
  }, [examCode, router]);

  // Initial fetch + polling (paused during countdown)
  useEffect(() => {
    if (!examCode || countingDown) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [examCode, fetchStatus, countingDown]);

  // Roster SSE subscription
  useEffect(() => {
    if (!examCode || !sessionId) return;
    const cleanup = subscribeToRosterUpdates(
      sessionId,
      examCode,
      (payload) => setRoster(payload),
      () => {
        // Silent — polling keeps the page useful without roster.
      },
    );
    return cleanup;
  }, [examCode, sessionId]);

  // When admin grants access, kick off the countdown (instead of immediate redirect)
  useEffect(() => {
    if (!state) return;
    if (state.can_take_test && state.attempt_id && !countingDown) {
      setCountingDown(true);
    }
  }, [state, countingDown]);

  const handleCountdownComplete = useCallback(async () => {
    if (!state?.attempt_id) return;
    setAttempt(state.attempt_id, "IN_PROGRESS");
    toast.success("Шалгалт эхэллээ!");
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Browser may block without user gesture; ignore.
    }
    router.replace(`/ielts/take-test/${state.attempt_id}`);
  }, [state, setAttempt, router]);

  const pillVariant: "waiting" | "ready" | "starting" | "error" = (() => {
    if (error) return "error";
    if (state?.session_status === "STARTED" || countingDown) return "starting";
    if (state?.session_status === "ACCESS_GRANTED") return "ready";
    return "waiting";
  })();

  const pillLabel: string = (() => {
    if (error) return "Алдаа гарлаа";
    if (countingDown) return "Шалгалт эхэлж байна";
    switch (state?.session_status) {
      case "ACCESS_GRANTED":
        return "Бэлэн боллоо";
      case "STARTED":
        return "Шалгалт эхэллээ";
      case "COMPLETED":
        return "Шалгалт дууссан";
      case "CANCELLED":
        return "Шалгалт цуцлагдсан";
      default:
        return "Шалгалт хүлээгдэж байна";
    }
  })();

  if (!examCode) return null;

  return (
    <>
      {countingDown && (
        <CountdownOverlay onComplete={handleCountdownComplete} />
      )}

      <main className="min-h-screen bg-zinc-50 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <StatusPill variant={pillVariant} label={pillLabel} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Та бэлэн боллоо
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Бид удирдагч эхлүүлэхийг хүлээж байна...
              </p>
              {testTitle && (
                <p className="mt-2 text-xs text-zinc-500">
                  {testTitle}
                  {examDate ? ` · ${examDate}` : ""}
                  {studentName ? ` · ${studentName}` : ""}
                </p>
              )}
            </div>
          </div>

          <AudioCheckButton />

          {roster && (
            <RosterCard roster={roster} selfUserId={state?.user_id ?? null} />
          )}

          <RulesCard />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd /home/senge/proj/lever-offline
npx tsc --noEmit 2>&1 | grep -E "waiting|StatusPill|AudioCheck|RulesCard|RosterCard|CountdownOverlay|rosterStream" | head -10
```

Expected: empty.

If you get an error about `state.user_id` not being in `WaitingStatus`, that's expected — the field is optional and falls through to `null`. The interface declares it `user_id?: string | null` so TS should be happy. If not, just remove the `selfUserId={state?.user_id ?? null}` prop — RosterCard handles `null` gracefully.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(pages)/ielts/waiting/[sessionId]/page.tsx"
git commit -m "feat(waiting): compose v2 lobby (audio check, roster SSE, rules, 3-2-1)"
```

---

## Task 7: Production build smoke

- [ ] Run `pnpm build`. Expect:
  - All routes build
  - `/ielts/waiting/[sessionId]` size grows (was 3.47 kB; expect ~5-7 kB now with the new components)
  - No errors

If build fails, fix the specific error and re-run.

---

## Self-review

**Spec coverage** (against `docs/superpowers/specs/2026-04-25-user-flow-design.md` §2.2):

- Status pill ✓
- Audio check button ✓
- Roster (initials) ✓ (via SSE; self-marked accent)
- Rules card with section durations ✓
- 3-2-1 countdown overlay ✓
- No separate instructions screen ✓ (rules live here, then countdown, then exam)
- Auto-redirect on session-started ✓ (now via countdown completion)

**Placeholder scan:** none.

**Type consistency:** `RosterPayload`, `RosterParticipant` exported from `rosterStream.ts` and consumed by both the page and `RosterCard`. `Props` shapes consistent across all 5 components.

**Scope check:** 5 new components (~50-90 lines each) + 1 SSE helper + 1 page rewrite. Coherent single shippable change.

**Out of scope (explicit defers):**

- Real audio test clip — placeholder MP3 path; user adds the file later.
- Backend `roster-updated` event auth via cookie/header instead of query-string — works as-is with existing pattern.
