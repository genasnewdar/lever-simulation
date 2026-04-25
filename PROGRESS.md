# lever-offline — Progress Tracker

Last updated: 2026-04-25 (post user-flow redesign)
**Production plan:** [/home/senge/proj/PRODUCTION_PLAN.md](../PRODUCTION_PLAN.md)

---

## Up Next

### Backend follow-ups (unlock deferred spec items)
- [ ] **Dynamic Listening timer (true).** Add `audio_duration_seconds` to listening test metadata in lever-edu (admin-settable on upload), compute section duration as `audio_duration + 5*60`. Frontend already displays whatever backend sends — see `SectionIntroCard`.
- [ ] **Code already completed → results redirect.** Backend `verify-code` should return enough state for the mock-exam page to redirect to `/ielts/results/[id]` instead of erroring.
- [ ] **Code cancelled / expired friendly error.** Backend should map status to a clear error code so frontend can show "Энэ код хүчингүй. Тусламж: ..." instead of generic message.
- [ ] **Device take-over modal.** Wire the existing `POST /api/student/ielts/attempt/{id}/take-over` endpoint into a modal flow on `mock-exam` page when user enters code that's active elsewhere.

### Real audio test clip
- [ ] Replace placeholder `/audio/audio-check.mp3` path with a real 1–3s test tone bundled in `public/audio/`. `AudioCheckButton` handles missing file gracefully today, but real audio is needed before launch.

### Dev DB baseline drift (lever-edu)
- [ ] Resolve the shared dev DB at `34.133.7.23` having 14/20 migrations marked unapplied. The `add_attempt_device_token` migration was hand-rolled; once the baseline is fixed, `prisma migrate deploy` will apply it cleanly.

---

## Completed

### User-flow redesign — spec + 6 plans + ship (2026-04-25)
- [x] **Spec:** `docs/superpowers/specs/2026-04-25-user-flow-design.md` — full student journey end-to-end (pre-exam → entry → in-exam → post-exam) with 8 edge cases.
- [x] **Plan #1 (lever-edu):** device-token take-over endpoint, print-codes endpoint, roster-updated SSE, `IeltsTestAttempt.current_device_token` field. 12 commits, 345 tests passing.
- [x] **Plan #2 (admin-ui):** "Print Codes" button on session detail → printable popup with QR slips per booked student.
- [x] **Plan #3 (lever-offline):** Waiting room v2 — status pill, audio check button, live roster (initials, fed by SSE), rules card, 3-2-1 countdown overlay.
- [x] **Plan #4 (lever-offline):** SectionIntroCard overlay (3.5s) before each exam section showing name + duration + cue.
- [x] **Plan #5 (lever-offline):** `/ielts/finished/[attemptId]` success beat between Writing-submit and the results page.
- [x] **Plan #6 (lever-offline):** QR `?code=` query support on landing + mock-exam, OfflineBanner for network drops, CancelledModal driven by `session_cancelled` SSE.
- [x] Design refresh + Auth0 removal (`@auth0/nextjs-auth0` dep dropped; lever-offline is now public/code-only).
- [x] Cloud Run build fix — synced `package-lock.json` after package.json updates; committed Auth0 file deletions.

---

## Earlier completed

### Core Pages
- [x] `/ielts` — Landing page with fullscreen prompt
- [x] `/ielts/mock-exam` — Join session flow (enter code, poll my-sessions, redirect to take-test)
- [x] `/ielts/take-test/[id]` — Full exam UI (L/R/W sections, timer, auto-save, question groups)
- [x] `/ielts/example` — Example/demo page with mock data
- [x] `/ielts/results/[attemptId]` — Results page with writing feedback (2026-03-24)

### Test Taking UI
- [x] Dynamic question group rendering (FORM, TABLE, NOTES, SUMMARY, FLOWCHART, DIAGRAM, MATCHING_PANEL, MCQ_LIST)
- [x] Audio player for listening sections
- [x] Reading passage with highlight support
- [x] Writing task with word count
- [x] Timer with auto-advance on expiry
- [x] Auto-save every 10 seconds (batch submit)
- [x] Section transitions (L → R → W locked sequence)
- [x] Answer submission before section transitions (2026-03-25)
- [x] Question group ordering preserved from backend (2026-03-25)
- [x] Fullscreen enforcement
- [x] Question map navigation
- [x] Review checkbox per question

### Results Page (2026-03-24)
- [x] Overall band score display
- [x] Per-skill band cards (L/R/W/S) with correct/total stats for L/R
- [x] Writing per-task expandable cards with:
  - [x] 4 criterion scores (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammar)
  - [x] Summary feedback
  - [x] Per-criterion rationale breakdown
  - [x] Key errors with original → correction
  - [x] Student's submitted essay (collapsible)
- [x] Polls until GRADED (5s interval)
- [x] Exam finished screen links to results page

### Auth
- [x] Auth0 integration (@auth0/nextjs-auth0 v4)
- [x] Token route (`/api/auth/token`) with server-side session
- [x] Axios interceptor with token injection + 401 retry

### Stores
- [x] `mock-exam-store` — session code, status, testId (persisted)
- [x] `exam-store` — answers, current section, localStorage backup

---

## v1 Scope (W1 — 2026-04-18 → 2026-04-25)

### Dynamic Question Group Rendering (CRITICAL PATH)
- [ ] Replace hardcoded rendering blocks in take-test page with `GroupDispatcher`
- [ ] Create group renderer components (`TableGroupRenderer`, `MatchingPanelRenderer`, `TFNGRenderer`, `FallbackRenderer`)
- [ ] Use backend `question_groups[].layout_type` + `layout_data` instead of hardcoded question number ranges
- Plan: `/home/senge/.claude/plans/expressive-bubbling-creek.md`

### Production Cleanup
- [x] Console cleanup — bare `console.log` replaced with `debugLog()` wrapper (2026-03-24)
- [ ] Remove hardcoded telemetry calls to 127.0.0.1:7242
- [ ] Add React error boundary at app layout level
- [ ] Clean up commented-out auth code in `/api/auth/token/route.ts`

---

## Deferred to v1.1

### Results
- [ ] Speaking results — band + per-criterion feedback + turn-by-turn breakdown
- [ ] Listening/Reading per-question review (show student answers, correct/incorrect)

### Polish
- [ ] Fix DiagramLabeling hardcoded inputs (verify: if v1 tests use DiagramLabeling, promote to v1)
- [ ] Standardize UI text language (Mongolian vs English)
- [ ] Offline detection / network error handling
- [ ] Image optimization (remove `unoptimized={true}` where possible)
