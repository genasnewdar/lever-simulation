# Section Intro Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a brief overlay card that fades in for 3.5 seconds at the start of each exam section, showing "Listening · 40 мин" / "Reading · 60 мин" / "Writing · 60 мин" with a one-line context cue. Lets students orient before questions appear, removes the jarring jump-cut into a fresh section.

**Architecture:** Pure frontend overlay. Listens to changes in `currentSection` + `sectionTimerSeconds` from the existing take-test page state. No backend or store changes. The intro renders as a fixed-position overlay above the page; auto-dismisses via a `setTimeout`. Continue button dismisses early. Timer keeps counting through the intro (matches "timer starts at section entry" from the spec).

**Tech Stack:** Next.js 15 · React 19 · Tailwind CSS v4 · existing `lucide-react` icons.

**Resolved scope decisions:**
- Intro duration: **3.5 s** auto-dismiss. Long enough to read; short enough to not feel like dead time.
- Display the duration backend sends. **No client-side override** of `sectionTimerSeconds` — true dynamic Listening timing is a separate backend follow-up.
- One-line context per section (Mongolian copy below). Anything more belongs on the waiting-room rules card (plan #3).
- Animation reuses the existing corner-curl easing for visual continuity (`cubic-bezier(0.32, 0.04, 0.18, 1)`).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/components/ielts/SectionIntroCard.tsx` | create | Self-contained overlay: section name + duration + cue + auto-dismiss timer + Continue button |
| `src/app/(pages)/ielts/take-test/[id]/page.tsx` | modify | Track `pendingSectionIntro` state; show card when `currentSection` changes; render `<SectionIntroCard>` above the layout |

That's it. No store changes, no new hooks, no new types.

---

## Task 1: SectionIntroCard component

**Files:**
- Create: `src/components/ielts/SectionIntroCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Headphones, BookOpen, PenLine } from "lucide-react";

type SectionId = "listening" | "reading" | "writing";

interface Props {
  section: SectionId;
  durationSeconds: number;
  onDismiss: () => void;
  /** Auto-dismiss after this many milliseconds. Default 3500. */
  autoDismissMs?: number;
}

const COPY: Record<SectionId, { label: string; cue: string; Icon: typeof Headphones }> = {
  listening: {
    label: "Listening",
    cue: "Чихэвчээ бэлэн байлгана уу",
    Icon: Headphones,
  },
  reading: {
    label: "Reading",
    cue: "Гурван хэсэгтэй",
    Icon: BookOpen,
  },
  writing: {
    label: "Writing",
    cue: "Хоёр даалгавартай",
    Icon: PenLine,
  },
};

export function SectionIntroCard({
  section,
  durationSeconds,
  onDismiss,
  autoDismissMs = 3500,
}: Props) {
  const [visible, setVisible] = useState(true);
  const minutes = Math.round(durationSeconds / 60);
  const { label, cue, Icon } = COPY[section];

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs]);

  // After fade-out finishes, notify parent so the overlay unmounts.
  useEffect(() => {
    if (visible) return;
    const t = setTimeout(onDismiss, 300);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-label={`${label} section starting`}
    >
      <div
        className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white px-12 py-10 shadow-xl"
        style={{
          transition: "transform 350ms cubic-bezier(0.32, 0.04, 0.18, 1)",
          transform: visible ? "scale(1)" : "scale(0.96)",
        }}
      >
        <Icon className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        <div className="text-center">
          <div className="text-4xl font-semibold tracking-tight text-zinc-900">{label}</div>
          <div className="mt-1 text-lg text-zinc-500">{minutes} мин</div>
        </div>
        <div className="text-sm text-zinc-600">{cue}</div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="mt-2 rounded-lg border border-zinc-300 px-5 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Үргэлжлүүлэх →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds**

```bash
cd /home/senge/proj/lever-offline
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `SectionIntroCard.tsx`. (Pre-existing errors elsewhere are not your problem.)

- [ ] **Step 3: Commit**

```bash
git add src/components/ielts/SectionIntroCard.tsx
git commit -m "feat(exam): SectionIntroCard overlay component"
```

---

## Task 2: Wire intro display in take-test page

**Files:**
- Modify: `src/app/(pages)/ielts/take-test/[id]/page.tsx`

The page has these existing pieces we'll hook into:
- `sectionTimerSeconds` state (line 92) — set whenever a section's content is fetched
- `transitionToNextSection` (line 801) — fetches next section, sets new timer
- The page's main render block (around line 1105+)

Strategy: introduce a `pendingSectionIntro` state. Set it whenever a section's content arrives (initial load *and* transitions). Render `<SectionIntroCard>` as a top-level overlay when that state is non-null. The card calls back to clear the state when dismissed.

- [ ] **Step 1: Add state + helper**

Find the `sectionTimerSeconds` state declaration around line 92. Right after it, add:

```typescript
type SectionId = "listening" | "reading" | "writing";
const [pendingSectionIntro, setPendingSectionIntro] = useState<{
  section: SectionId;
  duration: number;
} | null>(null);
```

If `useState` isn't already imported at the top, extend the existing React import.

- [ ] **Step 2: Trigger the intro on every section load**

Find every place that calls `setSectionTimerSeconds(response.section_time_remaining_seconds)`. Per the recon there are 4 such call sites: lines ~204, ~265, ~272, ~820.

After **each** of those `setSectionTimerSeconds(...)` calls, add a sibling line:

```typescript
setPendingSectionIntro({
  section: <SECTION_VAR>,
  duration: response.section_time_remaining_seconds,
});
```

Replace `<SECTION_VAR>` with whatever local variable identifies the section being loaded at that point. Likely candidates: `activeTab`, `nextSection`, `currentSection`, or a literal like `"listening"` for the initial load. **Read the surrounding 10 lines before writing each one** — pick the variable that's actually correct in scope. If you can't tell, paste the surrounding code into your status report and stop.

For the line ~265 case (overview-driven set), the value uses `overview.section_time_remaining_seconds` — substitute appropriately.

- [ ] **Step 3: Render the overlay**

Import the component at the top of the file:

```typescript
import { SectionIntroCard } from "@/components/ielts/SectionIntroCard";
```

In the main render JSX (around line 1105), at the very top of the returned tree (above any other layout):

```tsx
{pendingSectionIntro && (
  <SectionIntroCard
    section={pendingSectionIntro.section}
    durationSeconds={pendingSectionIntro.duration}
    onDismiss={() => setPendingSectionIntro(null)}
  />
)}
```

If the page returns a fragment or array, drop this inline at the top. If it returns a single root element, wrap with a fragment.

- [ ] **Step 4: Type-check**

```bash
cd /home/senge/proj/lever-offline
npx tsc --noEmit 2>&1 | head -30
```

Expected: no NEW errors involving `SectionIntroCard`, `pendingSectionIntro`, or the take-test page.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(pages\)/ielts/take-test/\[id\]/page.tsx
git commit -m "feat(exam): show SectionIntroCard at every section start"
```

---

## Task 3: Manual smoke check

This project has no automated frontend tests, so verification is manual. Boot the dev server and walk the section transitions in a browser.

- [ ] **Step 1: Start the dev server**

```bash
cd /home/senge/proj/lever-offline
pnpm dev
```

(Or `npm run dev` / `npx next dev` — match what the project uses.)

- [ ] **Step 2: Walk the example exam**

The project has a demo route at `/ielts/example` with mock data — easiest path to exercise the intro without setting up a real session. Visit:

```
http://localhost:3000/ielts/example
```

If the example route doesn't trigger the intro (because it might bypass the section-load code paths), use the real flow: visit `/ielts/mock-exam`, enter a valid 10-digit code from the dev DB, wait for admin to start the session, take the exam.

Verify:
- [ ] On initial load (Listening), the intro overlay appears with "Listening · {N} мин" and the headphones icon
- [ ] After 3.5 seconds, the overlay fades out and the questions appear
- [ ] Clicking "Үргэлжлүүлэх →" dismisses early
- [ ] When the section transitions (manually trigger by waiting out the timer or via dev tools), the next section's intro shows ("Reading · 60 мин" → "Writing · 60 мин")
- [ ] No console errors during the transitions
- [ ] The timer in the header is counting down even while the intro is visible (this is intentional — matches spec "timer starts at section entry")

- [ ] **Step 3: Tag completion**

If smoke passes, no commit needed. If you found issues, fix them and commit a follow-up like `fix(exam): {what you fixed in the intro}`.

---

## Self-review

**Spec coverage** (against `/home/senge/proj/lever-offline/docs/superpowers/specs/2026-04-25-user-flow-design.md` §2.3):
- "Surface the resolved Listening duration on the section start screen" — Task 2 wires the intro for all 3 sections ✓
- "Timer starts at section entry (not audio play)" — already true; intro doesn't pause the timer ✓
- "Display 'Listening — XX мин' so it's never a surprise" — covered ✓
- True dynamic `audio_duration + 5 min` — explicitly deferred (note in goals; needs backend support, separate plan)

**Placeholder scan:** none — every step has runnable code, exact file paths, exact commands.

**Type consistency:** `SectionId` defined locally in both files (component + page); the union literal is identical. `Props` interface in the component matches what the page passes. `pendingSectionIntro` state shape is consistent across declaration, set-calls, and the render block.

**Scope check:** 1 new component (~60 lines), 4 call-site additions to one existing file, 1 render addition. Single coherent shippable change.
