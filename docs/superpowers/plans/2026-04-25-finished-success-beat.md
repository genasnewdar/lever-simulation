# Finished Page Success Beat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Insert a "Шалгалт дууслаа" success beat between submitting Writing and the polling results page. Gives the student closure + ETA before they're confronted with a spinner.

**Architecture:** New static route at `/ielts/finished/[attemptId]`. Pure presentational page — no data fetching, no polling. Two CTAs: "Хариу үзэх" → existing results page, "Гарах" → home. Writing-submit handler in take-test page redirects here instead of straight to results.

**Tech Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · `lucide-react` icons.

**Resolved scope decisions:**
- **No real stats** — display fixed labels matching standard IELTS (40 Listening / 40 Reading / 2 Writing). Real per-attempt stats need an API call we don't want here; the visual pattern is the win, not the precise numbers.
- **No localStorage cleanup on this page.** That happens elsewhere (existing finish handlers); this page is read-only.
- **No prefetch of results.** Don't auto-fetch — that's what the next page is for.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/app/(pages)/ielts/finished/[attemptId]/page.tsx` | create | The success-beat page |
| `src/app/(pages)/ielts/take-test/[id]/page.tsx` | modify | Change line 1096 redirect target from `/ielts/results/...` to `/ielts/finished/...` |

That's it.

---

## Task 1: The finished page

**Files:**
- Create: `src/app/(pages)/ielts/finished/[attemptId]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";

const STATS: Array<{ label: string; value: number }> = [
  { label: "Listening", value: 40 },
  { label: "Reading", value: 40 },
  { label: "Writing", value: 2 },
];

export default function FinishedPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();

  const goToResults = () => router.push(`/ielts/results/${params.attemptId}`);
  const goHome = () => router.push("/ielts");

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="rounded-full bg-emerald-50 p-4">
          <CheckCircle2
            className="h-14 w-14 text-emerald-600"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Шалгалт дууслаа
          </h1>
          <p className="mt-2 text-base text-zinc-600">
            Маш сайн хийлээ. Та амьсгалаа аваарай.
          </p>
        </div>

        <div className="grid w-full grid-cols-3 rounded-xl border border-zinc-200 bg-white">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center gap-1 px-3 py-4 ${
                i > 0 ? "border-l border-zinc-200" : ""
              }`}
            >
              <span className="text-2xl font-semibold text-zinc-900">{s.value}</span>
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <Clock className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          <span>
            Хариу <strong className="font-semibold">~5 минутын дараа</strong> бэлэн болно
          </span>
        </div>

        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={goToResults}
            className="w-full rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Хариу үзэх →
          </button>
          <button
            type="button"
            onClick={goHome}
            className="w-full rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Гарах
          </button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/senge/proj/lever-offline
npx tsc --noEmit 2>&1 | grep -E "finished" | head -5
```

Expected: empty (no errors involving the new file).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(pages)/ielts/finished/[attemptId]/page.tsx"
git commit -m "feat(exam): add /ielts/finished success beat page"
```

---

## Task 2: Reroute Writing-submit to the finished page

**Files:**
- Modify: `src/app/(pages)/ielts/take-test/[id]/page.tsx` (around line 1096)

- [ ] **Step 1: Find the redirect**

Run:

```bash
grep -n "results/\${params.id}" "src/app/(pages)/ielts/take-test/[id]/page.tsx"
```

Expected: a single hit around line 1096 reading `router.push(\`/ielts/results/${params.id}\`);`

If there are multiple hits, **read 20 lines of surrounding context** for each and only change the one that fires after Writing-submit completes (the success path, not the cancellation path). If you can't tell which is which, pause and report.

- [ ] **Step 2: Change it**

Replace:

```typescript
router.push(`/ielts/results/${params.id}`);
```

with:

```typescript
router.push(`/ielts/finished/${params.id}`);
```

Single character difference (`results` → `finished`). Don't touch any other navigation.

- [ ] **Step 3: Type-check + verify the change is what you intended**

```bash
npx tsc --noEmit 2>&1 | grep -E "take-test|finished" | head -5
git diff "src/app/(pages)/ielts/take-test/[id]/page.tsx"
```

Diff should show exactly one line changed.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(pages)/ielts/take-test/[id]/page.tsx"
git commit -m "feat(exam): route Writing-submit to /ielts/finished instead of results"
```

---

## Task 3: Production build smoke

- [ ] **Step 1: Run the production build**

```bash
cd /home/senge/proj/lever-offline
pnpm build 2>&1 | tail -25
```

Expected: build succeeds, route table includes `ƒ /ielts/finished/[attemptId]` as a dynamic server-rendered route. No errors.

- [ ] **Step 2: Verify the new route appears**

The build output's route table should list:
```
ƒ /ielts/finished/[attemptId]    ?B    ?kB
```

If it doesn't, the file path or the App Router conventions weren't followed.

- [ ] **Step 3: Tag completion**

If smoke passes, no commit needed.

---

## Self-review

**Spec coverage** (against `docs/superpowers/specs/2026-04-25-user-flow-design.md` §2.4):
- New route `/ielts/finished/[attemptId]` — Task 1 ✓
- Large green check mark — `CheckCircle2` ✓
- Headline "Шалгалт дууслаа" — ✓
- Subhead "Маш сайн хийлээ. Та амьсгалаа аваарай." — ✓
- Stats card (3 cols) — ✓ (using fixed standard IELTS counts; flagged in scope decisions)
- ETA pill — ✓
- Primary CTA "Хариу үзэх →" → results — ✓
- Secondary CTA "Гарах" → /ielts — ✓ (no toast; spec called out a "reassurance toast" but `react-toastify` setup is out of scope here — defer to a follow-up if useful)
- Writing-submit reroute — Task 2 ✓

**Placeholder scan:** none.

**Type consistency:** `useParams<{ attemptId: string }>()` matches the dir name `[attemptId]`. The CTA URL `/ielts/results/${params.attemptId}` matches the existing results route signature.

**Scope check:** 1 new file (~70 lines), 1 single-character change in 1 existing file. Single coherent shippable change.
