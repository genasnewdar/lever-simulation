# lever-offline — Progress Tracker

Last updated: 2026-03-26

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

## In Progress

### Dynamic Question Group Rendering (2026-03-26)
- [ ] Replace hardcoded rendering blocks in take-test page with `GroupDispatcher`
- [ ] Create group renderer components (`TableGroupRenderer`, `MatchingPanelRenderer`, `TFNGRenderer`, etc.)
- [ ] Use backend `question_groups[].layout_type` + `layout_data` instead of hardcoded question number ranges
- Plan: `/home/senge/.claude/plans/expressive-bubbling-creek.md`

---

## Backlog

### Results
- [ ] Speaking results — band + per-criterion feedback + turn-by-turn breakdown
- [ ] Listening/Reading per-question review (show student answers, correct/incorrect)

### Polish
- [x] Console cleanup — bare `console.log` in take-test page replaced with `debugLog()` wrapper (gated by `DEBUG` flag) (2026-03-24)
- [ ] Remove hardcoded telemetry calls to 127.0.0.1:7242
- [ ] Add error boundary component
- [ ] Clean up commented-out auth code in `/api/auth/token/route.ts`
- [ ] Fix DiagramLabeling hardcoded inputs
- [ ] Standardize UI text language (Mongolian vs English)

### Infrastructure
- [ ] Error boundary for unhandled errors
- [ ] Offline detection / network error handling
- [ ] Image optimization (remove `unoptimized={true}` where possible)
