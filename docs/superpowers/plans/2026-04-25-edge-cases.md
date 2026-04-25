# Edge Cases v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Ship the three highest-impact edge-case handlers from spec §3 without dragging in backend changes:
1. QR-deep-link support (`?code=XXX` pre-fills the input on `/ielts` + `/ielts/mock-exam`).
2. Network-disconnection toast + reconnection signal on the take-test page.
3. Admin-cancellation SSE listener with a blocking modal on the take-test page.

**Architecture:** Pure frontend additions. URL query handling via `useSearchParams`. Disconnection via window `online`/`offline` events. Cancel flow via the existing `subscribeToRosterUpdates` SSE plumbing (extended to also listen for `session-cancelled`).

**Tech Stack:** Next.js 15 · React 19 · `react-toastify` (already in use) · native browser `EventSource` and online/offline events.

**Out of scope (deferred to a follow-up plan):**
- "Code already completed" redirect — needs backend response shape change.
- "Code cancelled" friendly error — needs backend status mapping.
- Device take-over modal — needs end-to-end UX work + the backend take-over endpoint integration.
- Late-arrival catch-up toast — already handled by waiting room logic (skipping countdown when session is in STARTED).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/app/(pages)/ielts/page.tsx` | modify | Read `?code=` query and forward to mock-exam pre-filled |
| `src/app/(pages)/ielts/mock-exam/page.tsx` | modify | Read `?code=` query and pre-fill the code input |
| `src/lib/sse/sessionEvents.ts` | create | Tiny SSE wrapper for `session-cancelled` (mirrors `rosterStream.ts`) |
| `src/components/ielts/take-test/CancelledModal.tsx` | create | Blocking modal shown when session-cancelled fires |
| `src/components/ielts/take-test/OfflineBanner.tsx` | create | Sticky banner shown when navigator is offline |
| `src/app/(pages)/ielts/take-test/[id]/page.tsx` | modify | Wire OfflineBanner + CancelledModal + cancellation listener |

---

## Task 1: QR query support on the landing page

**Files:** `src/app/(pages)/ielts/page.tsx`

The current landing page has a CTA button that navigates to `/ielts/mock-exam`. We're going to forward any `?code=XXX` query to the mock-exam page so a QR scan goes directly there with the code pre-filled.

- [ ] **Step 1: Read the file**

```bash
cd /home/senge/proj/lever-offline
cat "src/app/(pages)/ielts/page.tsx" | head -60
```

Identify: where the "Start" / "Шалгалт өгөх" button lives, and how it navigates (likely `router.push("/ielts/mock-exam")` or a `<Link>`).

- [ ] **Step 2: Add the query passthrough**

If the page uses `<Link href="/ielts/mock-exam">`, change it to a hook-based handler:

```tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
// ...

const searchParams = useSearchParams();
const router = useRouter();
const goToMockExam = () => {
  const code = searchParams.get("code");
  router.push(code ? `/ielts/mock-exam?code=${encodeURIComponent(code)}` : "/ielts/mock-exam");
};

// Replace the existing Link/button with:
<button onClick={goToMockExam}>...</button>
```

If the page already has `"use client"` and the imports, just extend them.

If the page is a server component, add a small client-side wrapper component instead — don't convert the whole page.

If the page already uses `router.push("/ielts/mock-exam")` somewhere, add the query forwarding inline at that callsite. The principle: any path leading to mock-exam must preserve `?code=` if present.

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "ielts/page" | head -3
git add "src/app/(pages)/ielts/page.tsx"
git commit -m "feat(ielts): forward ?code= query from landing to mock-exam"
```

---

## Task 2: Pre-fill code on mock-exam page

**Files:** `src/app/(pages)/ielts/mock-exam/page.tsx`

- [ ] **Step 1: Find the input state**

```bash
grep -n "useState\|const \[code\|setCode\|input.*code" "src/app/(pages)/ielts/mock-exam/page.tsx" | head -10
```

The page has a code state variable somewhere. Identify its declaration.

- [ ] **Step 2: Initialize from URL**

Add `useSearchParams` import (extend the existing `next/navigation` import if present):

```tsx
import { useSearchParams } from "next/navigation";
```

After the existing state declarations, add an effect that pre-fills from the URL once on mount:

```tsx
const searchParams = useSearchParams();
useEffect(() => {
  const queryCode = searchParams.get("code");
  if (queryCode && !codeFromInput) {
    setCodeFromInput(queryCode);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Replace `codeFromInput` and `setCodeFromInput` with whatever the actual state setter pair is in the file. The eslint disable line is intentional — we only want this to run once on mount.

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "mock-exam" | head -3
git add "src/app/(pages)/ielts/mock-exam/page.tsx"
git commit -m "feat(ielts): pre-fill exam code from ?code= query param"
```

---

## Task 3: Session-cancelled SSE wrapper

**Files:** `src/lib/sse/sessionEvents.ts`

A tiny new module to listen for `session-cancelled` events on the existing SSE stream. Pattern mirrors `rosterStream.ts` from plan #3.

- [ ] **Step 1: Create file**

```typescript
export type SessionEventListener = (data: { reason?: string }) => void;

/**
 * Subscribe to session-cancelled SSE events for the given session.
 * Returns a cleanup function. Auth via ?code= query string (matches existing pattern).
 */
export function subscribeToSessionCancelled(
  sessionId: string,
  examCode: string,
  onCancelled: SessionEventListener,
): () => void {
  if (typeof window === "undefined" || !sessionId || !examCode) {
    return () => undefined;
  }

  const url = `/api/student/ielts/session/${encodeURIComponent(sessionId)}/status-stream?code=${encodeURIComponent(examCode)}`;
  const es = new EventSource(url);

  const handler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as { reason?: string };
      onCancelled(data || {});
    } catch {
      onCancelled({});
    }
  };

  // Backend's existing event name — see lever-edu session_service.py
  es.addEventListener("session_cancelled", handler);

  return () => {
    es.removeEventListener("session_cancelled", handler);
    es.close();
  };
}
```

> Note: backend uses underscore name `session_cancelled` (not the spec's hyphen `session-cancelled`). Matches reality; we listen for what the backend actually emits.

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit 2>&1 | grep sessionEvents | head -3
git add src/lib/sse/sessionEvents.ts
git commit -m "feat(sse): subscribeToSessionCancelled wrapper"
```

---

## Task 4: CancelledModal component

**Files:** `src/components/ielts/take-test/CancelledModal.tsx`

- [ ] **Step 1: Create file**

```tsx
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
```

- [ ] **Step 2: Verify + commit**

```bash
mkdir -p src/components/ielts/take-test
npx tsc --noEmit 2>&1 | grep CancelledModal | head -3
git add src/components/ielts/take-test/CancelledModal.tsx
git commit -m "feat(take-test): CancelledModal blocking dialog"
```

---

## Task 5: OfflineBanner component

**Files:** `src/components/ielts/take-test/OfflineBanner.tsx`

A sticky top banner that surfaces when the browser goes offline. Self-contained — uses `navigator.onLine` and the `online`/`offline` window events.

- [ ] **Step 1: Create file**

```tsx
"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <WifiOff className="h-4 w-4" strokeWidth={2} aria-hidden />
      <span>Холболт алдагдсан. Хариултууд хадгалагдсан. Дахин холбогдож байна...</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit 2>&1 | grep OfflineBanner | head -3
git add src/components/ielts/take-test/OfflineBanner.tsx
git commit -m "feat(take-test): OfflineBanner for network drop"
```

---

## Task 6: Wire CancelledModal + OfflineBanner into take-test page

**Files:** `src/app/(pages)/ielts/take-test/[id]/page.tsx`

- [ ] **Step 1: Add imports**

At the top, with the other imports:

```tsx
import { CancelledModal } from "@/components/ielts/take-test/CancelledModal";
import { OfflineBanner } from "@/components/ielts/take-test/OfflineBanner";
import { subscribeToSessionCancelled } from "@/lib/sse/sessionEvents";
import { useExamCodeStore } from "@/lib/stores/exam-code-store";
```

(The `useExamCodeStore` import is likely already present — extend, don't duplicate.)

- [ ] **Step 2: Add state**

Inside the component, near the other state declarations:

```tsx
const [cancelledReason, setCancelledReason] = useState<string | null>(null);
const { examCode } = useExamCodeStore();
```

(If `useExamCodeStore` is already destructured for other fields, extend that destructure rather than calling the hook twice.)

- [ ] **Step 3: Add SSE subscription effect**

After the other `useEffect`s in the component:

```tsx
useEffect(() => {
  // The take-test page knows attempt_id from the URL but needs session_id
  // for the SSE subscription. Look it up in store / state — if neither is
  // available, skip the subscription.
  const sessionId = (typeof window !== "undefined" && localStorage.getItem("ielts_session_id")) || null;
  if (!sessionId || !examCode) return;
  return subscribeToSessionCancelled(sessionId, examCode, (data) => {
    setCancelledReason(data.reason ?? null);
  });
}, [examCode]);
```

> **Note:** the localStorage key `ielts_session_id` is a guess. If the page already has the session ID in scope (e.g. from a prior fetch or store), use that directly. If neither is available, leave the subscription disabled and TODO it — log a console.warn so it's visible. The CancelledModal will simply never trigger; the rest of the page works.

- [ ] **Step 4: Render the new UI**

In the JSX returned by the component, add at the very top of the returned tree (siblings to the existing layout):

```tsx
<OfflineBanner />
{cancelledReason !== null && (
  <CancelledModal
    reason={cancelledReason}
    onExit={() => router.push("/ielts")}
  />
)}
```

Wrap with a fragment if needed.

- [ ] **Step 5: Verify + commit**

```bash
npx tsc --noEmit 2>&1 | grep -E "take-test|CancelledModal|OfflineBanner|sessionEvents" | head -5
git add "src/app/(pages)/ielts/take-test/[id]/page.tsx"
git commit -m "feat(take-test): wire OfflineBanner + CancelledModal"
```

---

## Task 7: Production build smoke

```bash
cd /home/senge/proj/lever-offline
pnpm build 2>&1 | tail -20
```

Expected: build succeeds. take-test page size grows ~2-3 kB. No new errors.

---

## Self-review

**Spec coverage** (against §3 of `docs/superpowers/specs/2026-04-25-user-flow-design.md`):
- Disconnection mid-exam → OfflineBanner ✓ (toast variant deferred — banner is more persistent and matches the spec intent better)
- Admin cancels mid-exam → CancelledModal via SSE listener ✓
- QR query support → Tasks 1+2 ✓
- Browser crash / refresh — already handled (verified)
- Session not started — already handled (waiting room)
- Late arrival — already handled (waiting room skips countdown when STARTED)

**Explicit defers (out of scope):**
- Code already completed redirect — needs backend response shape work
- Code cancelled friendly error on entry — needs backend status mapping
- Device take-over modal — needs full UX work + backend integration
- Disconnection 30s blocking modal — banner is sufficient for v1; modal can be a follow-up if user testing reveals the banner isn't enough

**Type consistency:** `subscribeToSessionCancelled` signature matches its usage. `CancelledModal` Props match the call site. Component file paths consistent across imports.

**Scope check:** 3 new component files (~50-80 lines each), 1 SSE helper, 2 small edits to existing pages, 1 wire-up in take-test. Single coherent change.
