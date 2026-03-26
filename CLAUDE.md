# lever-offline — CLAUDE.md

Project context and conventions for Claude Code to follow in every session.

---

## Project Overview

**lever-offline** is the student-facing IELTS test-taking frontend built with Next.js 15.

- **Runtime:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS v4 + `@tailwindcss/typography`
- **State:** Zustand (persisted stores) + React Hook Form
- **HTTP:** Axios with Auth0 token interceptor
- **Auth:** Auth0 (`@auth0/nextjs-auth0` v4, session-cookie based)
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
- `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
- `AUTH0_AUDIENCE`
- `NEXT_PUBLIC_API_URL` (backend URL, e.g. `http://localhost:8000`)
- `SYSTEM_API_KEY` (for finish-section proxy routes)

---

## Project Structure

```
src/
  app/
    (pages)/ielts/
      page.tsx                    # Landing page
      mock-exam/page.tsx          # Join session (enter code)
      take-test/[id]/page.tsx     # Exam UI (L/R/W), [id] = attemptId
      results/[attemptId]/page.tsx # Results + writing feedback
      example/page.tsx            # Demo with mock data
    api/
      auth/[auth0]/route.ts       # Auth0 SDK handler
      auth/token/route.ts         # Server-side token fetch
      ielts/finish-section/route.ts # Proxy for finish-listening/reading/writing (TODO: not yet created)
  components/
    ielts/
      questions/                  # Question type components (MCQ, Table, etc.)
      groups/                     # Group renderers by layout_type (planned)
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
    axios.ts                      # Axios instance + Auth0 token interceptor
    ielts-mapper.ts               # Backend question → frontend question mapper
    stores/
      mock-exam-store.ts          # Session join state (persisted)
      exam-store.ts               # Answers + section state (localStorage backup)
  types/
    ielts-simulation.ts           # Backend response types
```

---

## Architecture Conventions

### Auth flow
- Auth0 session cookie is set by `@auth0/nextjs-auth0` middleware
- Client calls `/api/auth/token` to get access token server-side
- Axios interceptor injects Bearer token into all API requests
- 401 → retry with fresh token → redirect to `/auth/login` if session expired

### Exam flow
1. Student enters session code at `/ielts/mock-exam`
2. Polls `GET /api/student/ielts/my-sessions` until attempt is granted
3. Redirects to `/ielts/take-test/{attemptId}`
4. Fetches content per section: `GET /api/student/ielts/test/{attemptId}/content?section=listening|reading|writing`
5. Auto-saves answers every 10s via batch submit
6. Section transitions: L → R → W (locked, OFFLINE mode) — answers submitted before each transition
7. On finish → shows completion screen → links to `/ielts/results/{attemptId}`

### Question group rendering
- Backend returns `question_groups[]` on each section/passage with `layout_type`, `layout_data`, `title`, `instructions`, `options_pool`
- The take-test page currently has hardcoded rendering blocks for specific question ranges — these are being replaced with dynamic `GroupDispatcher` (see plan)
- `layout_data` structure for TABLE/FORM: `{headers: string[], rows: [{type:"text"|"input", value?, questionNumber?}][]}`

### Results page
- Polls `GET /api/student/ielts/results/{attemptId}` every 5s until `status === "success"`
- Displays overall band, per-skill bands, writing feedback (per-task criteria + rationales + key errors + student essay)

### State management
- `mock-exam-store`: Zustand with `persist` middleware → `localStorage`
- `exam-store`: Zustand with manual `sessionStorage` backup per section
- React Hook Form for question answers within the exam

### UI language
- Student-facing text is in **Mongolian** (this is intentional)
- Code comments and variable names are in English

---

## Do Not

- Do not import from `@/lib` barrel — use specific paths (e.g. `@/lib/axios`)
- Do not add bare `console.log` in production code — use the `debugLog()` wrapper (gated by `DEBUG` flag) in take-test page, or omit entirely
- Do not use `unoptimized` on Next.js Image unless loading external URLs
- Do not bypass Auth0 middleware for protected routes
- Do not put business logic in API routes — proxy to backend
