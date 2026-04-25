# lever-offline — Progress Tracker

Last updated: 2026-04-25
**Production plan:** [/home/senge/proj/PRODUCTION_PLAN.md](../PRODUCTION_PLAN.md)

---

## Up Next

### User-flow brainstorm (CRITICAL — informs everything below)
- [ ] Map the full student journey end-to-end:
  - **Pre-exam:** booking on lever-app → email with code → arrival at lever-offline
  - **Entry:** landing → mock-exam code page → fullscreen + anti-cheat → take-test
  - **In-exam:** Listening → Reading (with highlighting/clear) → Writing → completion
  - **Post-exam:** completion screen → results polling → graded results page → feedback PDF
  - **Edge cases:** browser crash mid-exam, disconnection, code re-entry on different device, session-gated waiting room, code already used, code cancelled
- [ ] Decide: should there be an onboarding/instructions screen between code-entry and the actual exam? (currently jumps straight in)
- [ ] Decide: post-exam — should we show "Шалгалт дууслаа" success state with ETA for results, or send straight to the polling results page?
- [ ] Identify confusion/anxiety points in the current flow that the redesign should address with copy or motion cues
- [ ] Output: a flow diagram + copy decisions before any further UI work

---

## Completed

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
