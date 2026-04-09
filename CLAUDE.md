# lever-offline — CLAUDE.md

Project context and conventions for Claude Code to follow in every session.

---

## Project Overview

**lever-offline** is the student-facing IELTS mock exam platform built with Next.js 15.
Two-phase auth: **Auth0 login for booking/payment**, then **exam code for test-taking** (no login needed on exam day).

- **Runtime:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS v4 + `@tailwindcss/typography`
- **State:** Zustand (persisted stores) + React Hook Form
- **HTTP:** Axios — Auth0 token for booking pages, exam code header for test pages
- **Auth:** Auth0 (`@auth0/nextjs-auth0` v4) for booking; 10-digit exam code for test-taking
- **Payment:** QPay (Mongolian payment gateway)
- **Icons:** Lucide React
- **Notifications:** react-toastify

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Type check
npx tsc --noEmit

# Build
pnpm build
```

Requires `.env.local` with:
- `AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
- `AUTH0_AUDIENCE`, `APP_BASE_URL`
- `NEXT_PUBLIC_API_URL` (backend URL, e.g. `http://localhost:8000`)
- `SYSTEM_API_KEY` (for finish-section proxy routes)
- `QPAY_CLIENT_ID`, `QPAY_CLIENT_SECRET` (QPay merchant credentials)
- `QPAY_CALLBACK_URL` (webhook URL for payment confirmation)

---

## Project Structure

```
src/
  app/
    (pages)/ielts/
      page.tsx                    # Landing page — exam info + book exam (Auth0 protected)
      book/page.tsx               # Select date + pay via QPay (Auth0 protected)
      my-exams/page.tsx           # View purchased exams + codes (Auth0 protected)
      mock-exam/page.tsx          # Enter exam code → start test (PUBLIC, no login)
      take-test/[id]/page.tsx     # Exam UI (L/R/W), [id] = attemptId (PUBLIC, code-based)
      results/[attemptId]/page.tsx # Results + writing feedback (PUBLIC, code-based)
    api/
      auth/[auth0]/route.ts       # Auth0 SDK handler
      auth/token/route.ts         # Server-side token fetch
      payment/
        create/route.ts           # Create QPay invoice (Auth0 protected)
        callback/route.ts         # QPay webhook — generate exam code + email it
        check/route.ts            # Check payment status
      ielts/
        verify-code/route.ts      # Validate exam code → return attempt info (public)
        finish-section/route.ts   # Proxy for finish-listening/reading/writing
  components/
    ielts/
      questions/                  # Question type components (MCQ, Table, etc.)
      groups/                     # Group renderers by layout_type
        GroupDispatcher.tsx        # Maps layout_type → renderer component
        TableGroupRenderer.tsx     # TABLE/FORM layout_data rendering
        MatchingPanelRenderer.tsx  # Matching with options_pool
        TFNGRenderer.tsx           # True/False/Not Given
        FallbackRenderer.tsx       # Unknown layout_type fallback
      layout/                     # CDIELTSLayout, Header, Timer, QuestionMap
      AudioPlayer.tsx             # Listening audio player
      QuestionFactory.tsx         # Maps question type → component
      QuestionGroupRenderer.tsx   # Renders grouped questions by layout_type
      ReadingPassage.tsx          # Reading passage with highlight
    ui/                           # Radix UI primitives (Button, Input, etc.)
  lib/
    auth0.ts                      # Auth0 client (lazy init)
    axios.ts                      # Axios instance — dual mode (Auth0 token OR exam code)
    ielts-mapper.ts               # Backend question → frontend question mapper
    stores/
      exam-code-store.ts          # Exam code + student info (persisted, for test-taking)
      exam-store.ts               # Answers + section state (localStorage backup)
  types/
    ielts-simulation.ts           # Backend response types
```

---

## Architecture Conventions

### Two-phase auth model
- **Phase 1 — Booking (Auth0 protected):** Student logs in via Auth0 (Gmail etc.), selects exam date, pays via QPay. Auth0 identifies who they are and links payment to their account.
- **Phase 2 — Test-taking (code-based, public):** Student enters their 10-digit exam code on a public page. No login needed. Code = identity + test access. This allows students to take the exam on any device without needing to log in again.

### Auth0 scope (booking pages only)
- Auth0 middleware protects: `/ielts` (landing), `/ielts/book`, `/ielts/my-exams`
- Auth0 NOT required for: `/ielts/mock-exam`, `/ielts/take-test/*`, `/ielts/results/*`
- Middleware checks path prefix to decide which auth mode applies

### Exam code identity
- After purchase, system generates 10-digit alphanumeric code (e.g., `A3K9M2X7B4`)
- Code is emailed to student + shown on `/ielts/my-exams` page
- Student enters code on `/ielts/mock-exam` → backend validates → returns attempt
- Code stored in Zustand (localStorage) for session continuity
- Re-entry allowed (browser crash → same code resumes)
- Code valid until exam ends (no arbitrary expiry)
- One code = one student = one test attempt

### Payment flow (QPay)
1. Student logs in via Auth0 → navigates to `/ielts/book`
2. Selects exam date → clicks "Pay"
3. Frontend calls `/api/payment/create` (Auth0 protected) → creates QPay invoice
4. Student pays via QPay (bank app / QR code)
5. QPay sends webhook to `/api/payment/callback` → confirms payment → generates exam code
6. Code is emailed to student + visible on `/ielts/my-exams`
7. Student can also poll `/api/payment/check` to see status

### Exam flow
1. Student enters exam code at `/ielts/mock-exam` (no login needed)
2. Backend validates code → returns attempt info (creates attempt on first use)
3. Redirects to `/ielts/take-test/{attemptId}`
4. Fetches content per section: `GET /api/student/ielts/test/{attemptId}/content?section=listening|reading|writing`
5. Auto-saves answers every 10s via batch submit
6. Section transitions: L → R → W (locked, OFFLINE mode)
7. On finish → completion screen → `/ielts/results/{attemptId}`
8. After grading → feedback PDF emailed to student

### Question group rendering
- Backend returns `question_groups[]` on each section/passage with `layout_type`, `layout_data`, `title`, `instructions`, `options_pool`
- `GroupDispatcher` maps `layout_type` → renderer component
- `layout_data` structure for TABLE/FORM: `{headers: string[], rows: [{type:"text"|"input", value?, questionNumber?}][]}`

### Results page
- Polls `GET /api/student/ielts/results/{attemptId}` every 5s until `status === "success"`
- Displays overall band, per-skill bands, writing feedback (per-task criteria + rationales + key errors + student essay)

### State management
- `exam-code-store`: Zustand with `persist` → `localStorage` (exam code + student info, for test pages)
- `exam-store`: Zustand with manual `sessionStorage` backup per section
- React Hook Form for question answers within the exam

### UI language
- Student-facing text is in **Mongolian** (this is intentional)
- Code comments and variable names are in English

---

## Do Not

- Do not import from `@/lib` barrel — use specific paths (e.g. `@/lib/axios`)
- Do not add bare `console.log` in production code — use `debugLog()` wrapper or omit
- Do not use `unoptimized` on Next.js Image unless loading external URLs
- Do not require Auth0 login for exam-taking pages (`/mock-exam`, `/take-test`, `/results`)
- Do not put business logic in API routes — proxy to backend
- Do not store payment credentials client-side — QPay keys are server-only
