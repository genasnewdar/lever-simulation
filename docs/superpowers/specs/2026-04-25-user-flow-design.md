# IELTS Online — Student User Flow Design

**Date:** 2026-04-25
**Status:** Approved (brainstorm complete, awaiting spec review)
**Scope:** End-to-end student journey for `lever-offline` (exam app) plus the touchpoints in `lever-app` (booking) and `admin-ui` (cohort orchestration) that bracket it.

---

## 1. Goals

Replace the current jump-cut flow (code → straight into Listening → spinner → results) with a **cohort-aware, anxiety-managed journey** built around four beats:

1. **Pre-exam:** code arrives by email and on a printable per-student slip handed out on exam day.
2. **Entry:** student waits in a roster-aware lobby with an audio check, until admin starts the cohort.
3. **In-exam:** locked Listening → Reading → Writing with a dynamic Listening timer.
4. **Post-exam:** explicit success beat with ETA before the polling results page.

Edge cases (browser crash, disconnection, code reuse, device take-over, late arrival, admin cancel) get explicit specified behavior rather than relying on default error states.

---

## 2. The four legs

### 2.1 Pre-exam — booking + code distribution

**Existing (lever-app, no change):**
- Booking → QPay → email with 10-digit code.

**New (admin-ui):**
- "Print Codes" button on session detail.
- Generates a printable PDF, one A6/A5 slip per booked student:
  - Student name (from booking)
  - 10-digit code in monospace, large, with separator (`5829-3471`)
  - QR code encoding `https://exam.lever-edu.com/ielts?code=5829-3471`
  - Footer: session date + venue + support contact
- Admin prints, hand-distributes on exam day.
- Codes already exist in the backend at booking time — this is purely a presentation layer.

**Why a slip + email both:** email is the durable record, slip is the exam-day artifact. Slip avoids "I forgot to check email this morning" failure mode.

**QR target:** `lever-offline` accepts a `?code=XXXX` query parameter on `/ielts` and `/ielts/mock-exam` and pre-fills the input. No new route required.

### 2.2 Entry — admin-gated cohort start

Two parallel tracks converging on a synchronized start.

**Admin track (admin-ui):**
1. Open session detail.
2. See JOINED participants update live (existing — `SessionDetail.tsx` polls every 3-5s).
3. Click **"Start Exam"** → backend `POST /api/admin/ielts/session/{code}/start`:
   - Auto-grants access to all JOINED participants
   - Creates exam attempts
   - Starts section timers
   - Broadcasts `session-started` over SSE.

**Student track (lever-offline):**
1. Land at `/ielts` or scan QR.
2. Enter code at `/ielts/mock-exam` (or auto-filled from QR).
3. Backend validates → redirects to `/ielts/waiting/[sessionId]`.
4. **Waiting room** shows:
   - **Status pill:** "Шалгалт хүлээгдэж байна" with pulsing dot.
   - **Headline:** "Та бэлэн боллоо" + "Бид удирдагч эхлүүлэхийг хүлээж байна..."
   - **🎧 Audio check** (NEW): big "Play test sound" button. Plays a short clip; once heard, student clicks "Сонссон" to confirm. Confirmation state persists for the session.
   - **Roster:** "14 / 18 students ready" with circular avatars (initials only). Updates over SSE.
   - **Exam rules** card: tab-switch ban, no external tools, **section durations as resolved for this attempt** (Listening uses dynamic value — see 2.3).
5. Subscribe to SSE `session-started` event.
6. On event → fullscreen 3-2-1 countdown overlay → redirect to `/ielts/take-test/[id]`.

**No separate instructions screen.** Rules are read while waiting, then 3-2-1, then in. Removes a redundant beat.

**Privacy on roster:** initials only — no full names, no profile photos. The student's own circle is rendered in the accent color so they can spot themselves.

### 2.3 In-exam — locked L → R → W

**Sections, durations, timer behavior:**

| Section | Duration | Timer starts at |
|---|---|---|
| Listening | `audio_duration + 5 min` (dynamic) | section entry (not audio play) |
| Reading | 60 min (fixed) | section entry |
| Writing | 60 min (fixed) | section entry |

**Why dynamic Listening (`audio + 5 min`):** mock audios vary 23–40 min. Fixed 40 wastes 17 min of dead seat-time on short tests. Five-minute review buffer is enough for CBT (no paper transfer needed) and matches the user's call (Option C in brainstorm).

**Surface the resolved duration:**
- Display "Listening — XX мин" on the section start screen and in the waiting-room rules card so it's never a surprise.

**Behavior unchanged from current:**
- Auto-save every 10 s (batch submit).
- Locked sequence (server-side section access control).
- Corner-curl section transitions (already shipped).
- Question map navigation, review checkbox per question, fullscreen enforcement.

### 2.4 Post-exam — success beat

**New route:** `/ielts/finished/[attemptId]`. Shown after Writing submit; before the results page.

**Content:**
- Large green check mark.
- Headline: **"Шалгалт дууслаа"**.
- Subhead: "Маш сайн хийлээ. Та амьсгалаа аваарай."
- Stats card (3 columns): Listening question count, Reading question count, Writing task count.
- ETA pill: **"⏱ Хариу ~5 минутын дараа бэлэн болно"**.
- Primary CTA: **"Хариу үзэх →"** → `/ielts/results/[attemptId]`.
- Secondary CTA: **"Гарах"** → `/ielts` (with email-receipt reassurance toast).

**Why a separate route:** dropping a fatigued student onto a polling spinner is jarring. The success beat gives closure, sets expectations, and lets the student decide when to face results. Polling stays on the results page where a spinner is contextually expected.

**Implementation note:** Writing-submit handler (currently in `take-test/[id]/page.tsx`) routes to `/ielts/finished/[attemptId]` instead of `/ielts/results/[attemptId]`.

---

## 3. Edge cases

| Case | Trigger | Behavior | Student-facing copy (mn) |
|---|---|---|---|
| Browser crash / refresh | Page reload mid-exam | Re-enter same code → resumes at current section. Answers preserved (Zustand persist). Audio resets to start of current Listening section. | "Үргэлжлүүлэн '{section}' хэсгээс эхэлнэ. Хадгалсан хариултууд хэвээр." |
| Code already completed | Attempt FULLY_COMPLETED, code re-entered | Show "you already took this" with link to results. No second attempt allowed. | "Энэ код аль хэдийн ашиглагдсан. Хариугаа харах →" |
| Code cancelled / expired | Admin cancelled or session past | Hard error with support contact. No retry. | "Энэ код хүчингүй. Тусламж: support@lever-edu.com" |
| Disconnection mid-exam | Network drop, auto-save fails | Toast immediately. Buffer answers locally (already does). Auto-retry submit every 5 s. After 30 s offline → blocking modal until reconnect. **Timer keeps running** (pause is exploitable). | "Холболт алдагдсан. Хариултууд хадгалагдсан. Дахин холбогдож байна..." |
| Different device take-over | Same code entered on phone while laptop is active | Allow with confirmation. New device shows "active elsewhere — take over?" Yes → invalidate other device's session token; that device gets "session ended" modal. Last write wins; both have same answers via auto-save. | "Энэ шалгалт өөр төхөөрөмжид нээлттэй байна. Энд үргэлжлүүлэх үү?" |
| Late arrival | Admin started exam, student joins after | Backend grants access if window is open. Skip 3-2-1 countdown, drop straight into Listening with whatever time remains. One-time toast surfaces remaining time. | "Шалгалт эхэлсэн байна. Үлдсэн хугацаа: {mm:ss}" |
| Admin cancels mid-exam | Technical issue → admin pulls plug | SSE pushes `session-cancelled`. Blocking modal. Answers preserved server-side; admin can issue replacement code. | "Шалгалт цуцлагдсан. Зохион байгуулагчтай холбогдоно уу." |
| Session not started | Code entered before admin starts | Existing `/ielts/waiting/[sessionId]`, now upgraded with audio test + roster + rules. | (covered by waiting room) |

---

## 4. New backend / SSE surface area

Where current endpoints suffice, listed for clarity. **NEW** marks additions.

| Concern | Endpoint / event | Status |
|---|---|---|
| Validate code, return attempt | code-verify endpoint (lever-offline proxies via `/api/ielts/verify-code`; backend path TBD-confirmed during implementation) | exists |
| Session status (waiting room poll) | `GET /api/student/ielts/session/{id}/status` | exists |
| Session events stream | `GET /api/student/ielts/session/{id}/status-stream` | exists — needs `session-started`, `session-cancelled`, `roster-updated` events confirmed |
| Admin start | `POST /api/admin/ielts/session/{code}/start` | exists (auto-grants) |
| Print codes (admin) | `GET /api/admin/ielts/session/{code}/print-codes` → JSON `[{name, code, qr_url}]` | **NEW** |
| Device take-over claim | `POST /api/student/ielts/attempt/{id}/take-over` → invalidates other tokens | **NEW** |
| Audio-check confirmation (optional, telemetry) | local-only; no backend needed | n/a |

---

## 5. Frontend routes

| Route | Status | Notes |
|---|---|---|
| `/ielts` | exists | Accept `?code=` query, pre-fill |
| `/ielts/mock-exam` | exists | Accept `?code=` query, pre-fill |
| `/ielts/waiting/[sessionId]` | exists | Add audio check + roster + rules card |
| `/ielts/take-test/[id]` | exists | Dynamic Listening timer; route to `/finished` on Writing submit |
| `/ielts/finished/[attemptId]` | **NEW** | Success beat, stats, ETA, CTAs |
| `/ielts/results/[attemptId]` | exists | Polls until graded — keep spinner here |

---

## 6. Out of scope

These came up but are deferred:

- **Code pool (Option B from code distribution):** anonymous batch codes for walk-ins. Defer until walk-ins become a real operational need.
- **Mid-exam break beat** between sections beyond the corner-curl animation. Real IELTS doesn't have one; revisit only if user-testing reveals fatigue.
- **Speaking section integration.** lever-offline currently doesn't include Speaking; out of scope here.
- **Admin proctoring stream UI changes.** Lives in `admin-ui`; the Start-Exam button already exists. No flow changes needed there beyond the new "Print Codes" button.
- **Per-question review on results.** Already deferred to v1.1 in PROGRESS.md.

---

## 7. Open follow-ups for the implementation plan

These are decisions made here that need cross-app coordination during implementation:

1. **Audio test clip:** pick or commission a 3–5s clip with mid-range frequencies (~1 kHz tone or a short voice line "Чихэвчийн шалгалт"). Where it's hosted, how it's bundled.
2. **QR library** in admin-ui: pick `qrcode` (Node) or `qrcode.react` (browser). PDF generation: `@react-pdf/renderer` vs print-to-PDF via browser dialog.
3. **Roster update frequency:** SSE event `roster-updated` debounced server-side (every 2-3s) to avoid avatar flicker on large cohorts.
4. **Take-over UX:** is the "session ended on other device" modal dismissible, or forces a hard navigate to `/ielts`?
5. **Late arrival cutoff:** at what point does the backend stop granting access? Section-based (no entry once Listening is past the audio's natural end), or attempt-window-based (whole exam window)?
