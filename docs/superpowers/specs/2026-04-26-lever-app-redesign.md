# lever-app Redesign — Design Spec

**Date:** 2026-04-26
**Scope app:** `/home/senge/proj/lever-app` (Next.js 15 booking + courses + mini-tests + IELTS booking)
**Sister product:** `/home/senge/proj/lever-offline` — exam-day app, "ink on paper + mint" aesthetic. lever-app borrows the *design language* (semantic OKLCH tokens, considered typography, motion as a first-class signal, brand-derived palette) but expresses it for a digital app surface, not a paper exam.

---

## 1. Goal

Replace lever-app's generic shadcn-blue-on-white scaffold with a brand-coherent design system grounded in the Lever logo (black + white + mint page-curl). The app must feel like the same family as lever-offline without imitating its paper aesthetic — because lever-app is a *digital marketplace + course player + practice surface*, not a paper exam.

The redesign also has to accommodate three different content jobs:

- **Discover & transact** — home dashboard, course catalog, IELTS mock booking flow, profile, history
- **Focus / consume lessons** — video player, course "learn" mode
- **Focus / practice tests** — mini tests (short, scaled-down versions of the lever-offline IELTS mock)

---

## 2. Three surfaces, one brand

| Surface | Routes | Aesthetic |
|---|---|---|
| **Discover** (default) | `/`, `/courses`, `/courses/[id]`, `/booking`, `/my-courses`, `/my-tests`, `/history`, `/my-profile`, `/explore`, `/search` | Cool off-white app shell, brand-black header / hero / primary CTAs, mint accent. Photo-friendly. |
| **Focus / Lessons** | `/learn/[courseId]`, `/video` | Dark immersive — black canvas, white type, mint progress chrome. Video is the hero, UI dims. |
| **Focus / Tests** | `/exam/[testId]` (mini tests) | Light "exam paper" feel borrowed from lever-offline (slightly cooler tint to differentiate from lever-offline's warm paper). Serif for prompts. Mint for actions. Same gravitas as lever-offline, scaled down. |

Surface mode is a UX signal: when the lights dim (Focus), the user is consuming. When the lights come back up (Discover), the user is browsing.

---

## 3. Brand palette (OKLCH)

All tokens declared as CSS custom properties on `:root`. Mirror lever-offline's discipline (oklch, semantic names, dual-tone variants per accent).

### Core ink (shared across all three surfaces)
```
--ink:        oklch(0.17 0.01 240)   /* Brand black — hero surfaces, header, primary CTA */
--ink-soft:   oklch(0.36 0.012 240)  /* Body type on light surfaces */
--ink-muted:  oklch(0.58 0.014 240)  /* Captions, hints, low-emphasis labels */
--rule:       oklch(0.91 0.008 240)  /* Borders, dividers */
```

### Discover surface (cool light app shell)
```
--surface:    oklch(0.985 0.004 240) /* App background — cool off-white, slight blue tint */
--surface-2:  oklch(0.965 0.006 240) /* Card surfaces, sunken sections */
--surface-3:  oklch(0.94 0.008 240)  /* Hovered surfaces, recessed wells */
```

### Focus / Lessons (dark)
```
--dark:       oklch(0.14 0.012 240)  /* Player canvas */
--dark-2:     oklch(0.20 0.012 240)  /* Sidebar/curriculum surface on dark mode */
--dark-3:     oklch(0.27 0.012 240)  /* Card on dark, hover targets */
--on-dark:    oklch(0.97 0.004 240)  /* Type on dark canvas */
```

### Focus / Tests (cool paper)
```
--paper-cool:    oklch(0.978 0.004 230) /* Test background — cooler than lever-offline's warm paper */
--paper-cool-2:  oklch(0.955 0.006 230) /* Question card surface */
--paper-cool-3:  oklch(0.93  0.008 230) /* Test result card */
```

### Mint (the brand accent — identical to lever-offline so the brand feels continuous)
```
--mint:       oklch(0.81 0.19  158)  /* Primary accent — CTAs, progress, "correct" */
--mint-soft:  oklch(0.94 0.06  158)  /* Backgrounds for mint-tinted chips and banners */
--mint-deep:  oklch(0.58 0.16  158)  /* Pressed CTAs, focus rings, mint type on light */
--mint-ink:   oklch(0.38 0.12  158)  /* Type on mint-soft backgrounds */
```

### Semantic
```
--success: var(--mint-deep)
--warn:    oklch(0.78 0.16 70)
--danger:  oklch(0.62 0.20 27)
--info:    oklch(0.66 0.14 230)
```

`--radius: 0.875rem` — slightly larger than lever-offline's 0.75rem, more "soft app" feel.

### Selection / scrollbar
- Selection background: `color-mix(in oklch, var(--mint) 55%, transparent)`
- Custom scrollbar that matches lever-offline's pattern (thin, ink-tinted thumb)

---

## 4. Typography

**Family choice:** Sans for UI + serif for course/test long-form (mirrors lever-offline's pattern).

```
--font-sans:   "Inter", ui-sans-serif, system-ui, sans-serif
--font-serif:  "Literata", ui-serif, Georgia, serif
```

**Where each is used:**

| Family | Used for |
|---|---|
| Sans (Inter) | All UI chrome, navigation, buttons, form inputs, dashboards, table data, prices, dates |
| Serif (Literata) | Course descriptions (long-form), course/lesson titles in lesson mode, mini-test question prompts, exam-style instructions |

OpenType refinements applied to both:
- Sans: `font-feature-settings: "ss01", "cv11", "kern", "liga"; letter-spacing: -0.005em`
- Serif: `font-feature-settings: "ss01", "liga", "dlig", "kern"; letter-spacing: -0.012em`

**Type scale (semantic, not ad-hoc):**
```
--text-display: clamp(2.5rem, 4vw, 3.25rem)  /* Hero greeting */
--text-h1:      2rem                          /* Page titles */
--text-h2:      1.5rem                        /* Section headers */
--text-h3:      1.25rem                       /* Card titles */
--text-body:    1rem                          /* Default */
--text-meta:    0.875rem                      /* Captions, hints */
--text-micro:   0.75rem                       /* Badges, eyebrows */
```

Headings get `letter-spacing: -0.022em` (matches lever-offline). All headings are ink, not mint — mint is for actions, not type.

---

## 5. Layout chrome (Discover surface)

Three rails today (left sidebar + top header + right banner). Drop the right banner; slim the sidebar.

### Sidebar (left)
- **Default state:** icon-only, 64px wide
- **On hover (or on `aria-expanded`):** expands to 240px with labels, smooth motion (lever-pivot, see §6)
- **Sticky, full-height**
- Items: home, courses, my-courses, my-tests, booking, history, profile
- Active item: mint left bar (3px) + ink type + `--surface-3` background
- Inactive: muted ink, hover → `--surface-2` background

### Header (top)
- 64px tall, `--surface` background, hairline `--rule` bottom border
- Logo (Lever edu) on the left of header (when sidebar collapsed) or only sidebar shows it
- Search input (center on `/explore`, `/search`; tucked into a button elsewhere)
- Notifications icon + profile dropdown on the right
- On scroll, header stays sticky with subtle blur + slightly more ink-on-surface-2 when content scrolls underneath

### Right banner — **removed**
Promos that lived in the right rail become **inline cards** within the home content well (one card slot between My Courses/My Tests and the recommended rails). One promo at a time, never more — keeps the dashboard calm.

### Content well
- Max-width: `1200px`, centered, `padding: 2rem`
- Default vertical rhythm: `gap-12` between major sections (currently `gap-16` is too sparse)

### Mobile (< 768px)
- Sidebar collapses entirely; bottom-nav appears with the same primary destinations (home, courses, my-tests, profile)
- Header stays
- Content well = full-width with `padding: 1rem`

---

## 6. Motion — "lever-pivot"

The brand IS literally a lever. Translate lever-offline's "page-turn" into "lever-pivot" — short rotational reveals that feel mechanical and intentional.

### Tokens
```
--pivot-duration:  280ms
--pivot-ease:      cubic-bezier(0.22, 0.61, 0.36, 1)
--page-duration:   480ms
--page-ease:       cubic-bezier(0.22, 0.61, 0.36, 1)
```

### Where motion shows up — signature moments only
1. **Page transitions** — old content tilts back ~3deg around the right edge and fades; new content tilts in from ~5deg with translateY(8px). 480ms. Implemented at the layout level so it's free for every route change.
2. **Primary CTA press** — button scales 0.97 + tilts 1.5deg on press; releases with overshoot. 280ms. Mint focus ring during keyboard focus.
3. **Card reveal on home dashboard mount** — recommended rail items fade + tilt-in stagger (60ms per item, max 6 items animated). Subsequent paginations don't re-animate.
4. **Sidebar expand on hover** — width animates with `--pivot-ease`, labels fade in 80ms after width starts.

**No motion for:**
- Card hover (just an `--surface-2` background shift + `box-shadow` rise — no rotation)
- Form input focus (mint ring only)
- Toasts (slide-in from top-right, no pivot)

### Reduced motion
`@media (prefers-reduced-motion: reduce)` collapses durations to 100ms and disables rotational components (kept opacity changes only). Mirror lever-offline's pattern exactly.

---

## 7. Component approach

Keep the existing shadcn primitives in `src/components/ui/*` but restyle them via the new tokens — do not rebuild the primitive layer. The work is:

1. Replace `tailwind.config.ts` color tokens with the OKLCH custom-property references (e.g. `primary: "var(--ink)"`, `accent: "var(--mint)"`)
2. Replace the boilerplate in `src/app/globals.css` with the §3 token block + §4 typography block + §6 motion block
3. Update primitive variants only where necessary (Button: brand-black `default`, mint `primary`, ghost `outline`; Card: `--surface-2` background, `--rule` border, `--radius` corners)
4. Build new branded components for: `BrandHero` (the personal continue-where-you-left-off card with brand-black surface + mint CTA), `RailCard` (course/test catalog tile), `Promo` (inline replacement for the right-rail banner), `Stepper` (booking flow steps with lever-pivot transitions between steps)

---

## 8. Vertical slice — what ships first

This redesign is built in **three phases**. Phase 1 is the entirety of the first plan; phases 2 and 3 are tracked here for context but planned separately.

### Phase 1 (this spec → first plan)
1. **Design system foundation**
   - Token block in `globals.css` (palette, typography, motion, radius, scrollbar, selection)
   - Tailwind config wired to the tokens (no more hard-coded `#3B82F6`)
   - Inter + Literata loaded via `next/font`
   - Page-transition wrapper at `app/layout.tsx` implementing the lever-pivot transition
2. **Layout chrome rebuild**
   - New `Sidebar` (icon-only default, hover-expand, mint active indicator)
   - New `Header` (slimmer, sticky-with-blur on scroll, search/notifications/profile)
   - Remove `BannerSection` from the home page; introduce inline `Promo` slot
3. **Home dashboard redesign**
   - `BrandHero` (personal continue-where-you-left-off card — brand-black surface, mint primary CTA, lever-pivot reveal on mount)
   - `RailCard` for recommended courses + recommended tests rails
   - `Promo` slot
   - Empty / loading / error states for each section
4. **Booking flow redesign** (`/booking`, all 5 steps + confirmation)
   - New `Stepper` (5 dots, mint progress fill, lever-pivot between steps)
   - Each step (test type → date/time → details → review/pay → confirmation) restyled to the Discover surface
   - Mongolian copy preserved verbatim from current screens
   - Auth0 redirect / unauthenticated state matches the new shell

### Phase 2 (later plan)
- `/courses` catalog + `/courses/[id]` detail in Discover surface
- `/learn/[courseId]` video player in **Focus / Lessons** dark surface
- `/video`, `/explore`, `/search` migrations

### Phase 3 (later plan)
- `/exam/[testId]` mini-test player in **Focus / Tests** cool-paper surface
- `/my-tests`, `/my-courses`, `/history`, `/my-profile` Discover-surface migrations
- Streak slot wired up (data + UI) — this is the "future hook" left in §9

---

## 9. Future hooks (designed in, not built yet)

- **Streak slot** — small badge area on the mini-test result screen and on the home dashboard ("you've done X tests this week"). Empty in Phase 1. When streaks land later, they slot into the existing component without redesign.
- **Notification center** — header bell icon shows a count badge in Phase 1 (always 0 for now); the dropdown content is Phase 4.
- **Dark-mode toggle for Discover** — out of scope. Architecture (CSS custom properties on `:root`, semantic tokens) makes it free to add later if needed; we don't build it now.

---

## 10. Out of scope

- Dark-mode toggle for Discover surface
- Streak data + logic (UI placeholder only)
- Mongolian → English copy refresh (preserve all current copy verbatim, redesign visual only)
- Backend changes
- Marketing public landing page (the "home" here is the logged-in dashboard; if a separate public landing is needed it's a separate spec)
- Storybook / design-system documentation site (later, after Phase 3 stabilizes)

---

## 11. Acceptance — what "done with Phase 1" looks like

- `pnpm build` succeeds with no Tailwind errors and no missing tokens
- Home dashboard renders with the new sidebar, header, hero, rails, and inline promo — no right-rail banner
- Page navigation between home → booking → home shows the lever-pivot transition (and falls back cleanly under `prefers-reduced-motion: reduce`)
- Booking flow walks all 5 steps + confirmation in the new design, fully usable end-to-end against the live staging backend (QPay flow intact)
- All current Mongolian copy preserved
- No hard-coded `#3B82F6` or other ad-hoc hex anywhere in `src/app` or `src/components`
- Manually smoke-checked at desktop (≥1280px) and mobile (≤414px) widths
- Type-checks clean (`npx tsc --noEmit`)

---

## 12. Open follow-ups (resolve during planning)

1. **Inter / Literata licensing** — both are open-source (OFL/SIL); confirm version pinning before adding.
2. **Page-transition implementation** — `framer-motion` (already in lever-offline) vs `view-transitions` API (newer, no library). Recommend framer-motion for Phase 1 to match lever-offline's stack and reduced-motion pattern.
3. **Sidebar expand-on-hover accessibility** — keyboard-only users need a focus-triggered expand too; spec says "hover or `aria-expanded`" — planning task should pin the exact interaction.
4. **Brand-hero CTA copy** — currently "Continue where you left off"; in Mongolian, what's the canonical phrasing?
5. **Inline `Promo` content source** — does it pull from a backend feed or is it hard-coded for Phase 1? Recommend: hard-coded prop for Phase 1, backend feed in Phase 2.
