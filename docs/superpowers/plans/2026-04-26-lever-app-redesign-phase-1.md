# lever-app Redesign — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `/home/senge/proj/lever-offline/docs/superpowers/specs/2026-04-26-lever-app-redesign.md`
**Goal:** Replace lever-app's generic shadcn-blue scaffold with the Phase 1 brand redesign — design system foundation + layout chrome rebuild + home dashboard + booking flow.

**Architecture:** Add OKLCH semantic tokens to `globals.css` and wire Tailwind config to reference them. Restyle existing shadcn primitives via the new tokens (no primitive rebuild). Introduce `framer-motion` for the lever-pivot page-transition. Replace home + booking layout chrome and content components.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, shadcn primitives, lucide-react, `framer-motion` (new), `next/font` for Inter + Literata.

**Working directory:** `/home/senge/proj/lever-app`
**Branch:** create `feat/redesign-phase-1` off `main`
**Verification model:** No automated frontend tests (lever-app has none). Per-task verification = `npm run build` succeeds + `npx tsc --noEmit` clean + visual smoke check via `npm run dev` on `localhost:3000`. Final task adds full-flow manual smoke.
**Package manager:** `npm` (lever-app uses package-lock.json — do not switch to pnpm).
**Commit cadence:** Frequent — one commit per task minimum, more if a step is large.

---

## File Structure

**Created:**
- `src/app/(home)/_components/BrandHero.tsx` — personal continue-where-you-left-off hero (brand-black surface, mint CTA)
- `src/app/(home)/_components/RailCard.tsx` — course / test catalog tile
- `src/app/(home)/_components/Promo.tsx` — inline promo (replaces right-rail BannerSection)
- `src/components/layout/Sidebar.tsx` — new icon-only-default, hover-expand sidebar
- `src/components/layout/Header.tsx` — new sticky-with-blur header (overwrites existing)
- `src/components/layout/PageTransition.tsx` — framer-motion lever-pivot wrapper
- `src/components/layout/MobileBottomNav.tsx` — mobile bottom navigation
- `src/app/(pages)/booking/components/Stepper.tsx` — replaces `BookingStepper.tsx`

**Modified:**
- `src/app/globals.css` — full token block, typography, motion, scrollbar, selection, reduced-motion
- `tailwind.config.ts` — colors / radius / fontFamily references the CSS custom properties
- `src/app/layout.tsx` — load Inter + Literata via `next/font`, wrap children in `PageTransition`
- `src/components/ui/button.tsx` — variants restyled (default = brand-black, primary = mint, outline = ghost)
- `src/components/ui/card.tsx` — defaults updated (`--surface-2` background, `--rule` border)
- `src/app/(home)/page.tsx` — restructured: BrandHero → rails → Promo (no right rail)
- `src/app/(home)/sections/MyCoursesSection.tsx` — uses RailCard
- `src/app/(home)/sections/MyTestsSection.tsx` — uses RailCard
- `src/app/(home)/sections/RecommendedCoursesSection.tsx` — uses RailCard, stagger reveal
- `src/app/(home)/sections/RecommendedTestsSection.tsx` — uses RailCard, stagger reveal
- `src/app/(pages)/booking/components/StepTestType.tsx` — restyled to Discover surface
- `src/app/(pages)/booking/components/StepDateTime.tsx` — restyled
- `src/app/(pages)/booking/components/StepDetails.tsx` — restyled
- `src/app/(pages)/booking/components/StepReview.tsx` — restyled
- `src/app/(pages)/booking/components/BookingConfirmation.tsx` — restyled
- `src/app/(pages)/booking/components/BookingNavBar.tsx` — restyled to match new Header
- `src/app/(pages)/booking/page.tsx` — uses new Stepper
- `package.json` — add `framer-motion`

**Deleted:**
- `src/app/(home)/sections/BannerSection.tsx` — replaced by inline `Promo`
- `src/components/SideBar.tsx` — replaced by `src/components/layout/Sidebar.tsx`
- `src/components/Header.tsx` — replaced by `src/components/layout/Header.tsx`
- `src/app/(pages)/booking/components/BookingStepper.tsx` — replaced by `Stepper.tsx`

---

## Task 1: Design system foundation — tokens, Tailwind wiring, fonts

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace `src/app/globals.css` body**

Overwrite the file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Swiper button arrow color (legacy carve-out — preserve) */
.swiper-button-prev:after,
.swiper-button-next:after {
  color: white;
}

@layer base {
  :root {
    /* ── Core ink (used across all surfaces) ───────────────────────── */
    --ink:        oklch(0.17 0.01 240);
    --ink-soft:   oklch(0.36 0.012 240);
    --ink-muted:  oklch(0.58 0.014 240);
    --rule:       oklch(0.91 0.008 240);

    /* ── Discover (light cool app shell) ───────────────────────────── */
    --surface:    oklch(0.985 0.004 240);
    --surface-2:  oklch(0.965 0.006 240);
    --surface-3:  oklch(0.94 0.008 240);

    /* ── Focus / Lessons (dark immersive) ──────────────────────────── */
    --dark:       oklch(0.14 0.012 240);
    --dark-2:     oklch(0.20 0.012 240);
    --dark-3:     oklch(0.27 0.012 240);
    --on-dark:    oklch(0.97 0.004 240);

    /* ── Focus / Tests (cool paper) ────────────────────────────────── */
    --paper-cool:    oklch(0.978 0.004 230);
    --paper-cool-2:  oklch(0.955 0.006 230);
    --paper-cool-3:  oklch(0.93  0.008 230);

    /* ── Mint accent (identical to lever-offline) ──────────────────── */
    --mint:       oklch(0.81 0.19 158);
    --mint-soft:  oklch(0.94 0.06 158);
    --mint-deep:  oklch(0.58 0.16 158);
    --mint-ink:   oklch(0.38 0.12 158);

    /* ── Semantic ──────────────────────────────────────────────────── */
    --success: var(--mint-deep);
    --warn:    oklch(0.78 0.16 70);
    --danger:  oklch(0.62 0.20 27);
    --info:    oklch(0.66 0.14 230);

    --radius: 0.875rem;

    /* ── Motion tokens ─────────────────────────────────────────────── */
    --pivot-duration: 280ms;
    --pivot-ease: cubic-bezier(0.22, 0.61, 0.36, 1);
    --page-duration: 480ms;
    --page-ease: cubic-bezier(0.22, 0.61, 0.36, 1);

    /* ── Typography scale ──────────────────────────────────────────── */
    --text-display: clamp(2.5rem, 4vw, 3.25rem);
    --text-h1: 2rem;
    --text-h2: 1.5rem;
    --text-h3: 1.25rem;
    --text-body: 1rem;
    --text-meta: 0.875rem;
    --text-micro: 0.75rem;
  }

  * {
    border-color: var(--rule);
  }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    background-color: var(--surface);
    color: var(--ink);
    font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
    font-feature-settings: "ss01", "cv11", "kern", "liga";
    letter-spacing: -0.005em;
  }

  h1, h2, h3, h4 {
    color: var(--ink);
    letter-spacing: -0.022em;
  }

  .font-serif {
    font-family: var(--font-serif), ui-serif, Georgia, serif;
    font-feature-settings: "ss01", "liga", "dlig", "kern";
    letter-spacing: -0.012em;
  }

  ::selection {
    background-color: color-mix(in oklch, var(--mint) 55%, transparent);
    color: var(--ink);
  }

  /* Custom scrollbar */
  .custom-scrollbar { scrollbar-width: thin; scrollbar-color: color-mix(in oklch, var(--ink) 18%, transparent) transparent; }
  .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: color-mix(in oklch, var(--ink) 14%, transparent);
    border-radius: 8px;
    border: 2px solid var(--surface);
  }

  @media (prefers-reduced-motion: reduce) {
    :root {
      --pivot-duration: 100ms;
      --page-duration: 100ms;
    }
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

- [ ] **Step 2: Rewrite `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--surface)",
        foreground: "var(--ink)",
        // Brand primitive colours
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-muted": "var(--ink-muted)",
        rule: "var(--rule)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        dark: "var(--dark)",
        "dark-2": "var(--dark-2)",
        "dark-3": "var(--dark-3)",
        "on-dark": "var(--on-dark)",
        "paper-cool": "var(--paper-cool)",
        "paper-cool-2": "var(--paper-cool-2)",
        "paper-cool-3": "var(--paper-cool-3)",
        mint: "var(--mint)",
        "mint-soft": "var(--mint-soft)",
        "mint-deep": "var(--mint-deep)",
        "mint-ink": "var(--mint-ink)",
        // shadcn-compat semantic aliases
        primary: "var(--ink)",
        "primary-foreground": "var(--on-dark)",
        secondary: "var(--surface-2)",
        "secondary-foreground": "var(--ink)",
        accent: "var(--mint)",
        "accent-foreground": "var(--ink)",
        destructive: "var(--danger)",
        "destructive-foreground": "var(--on-dark)",
        muted: "var(--surface-2)",
        "muted-foreground": "var(--ink-muted)",
        border: "var(--rule)",
        input: "var(--rule)",
        ring: "var(--mint-deep)",
        // Legacy aliases (preserve so unconverted call-sites keep building)
        textprimary: "var(--ink)",
        textsecondary: "var(--ink-muted)",
        bordercolor: "var(--rule)",
        iconcolor: "var(--ink-muted)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      transitionTimingFunction: {
        pivot: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 3: Wire Inter + Literata via `next/font` in `src/app/layout.tsx`**

Find the current `RootLayout` component. At the top of the file, import the fonts and apply their CSS variables to `<html>`:

```tsx
import { Inter, Literata } from "next/font/google";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontSerif = Literata({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

// In RootLayout return:
// <html lang="en" className={`${fontSans.variable} ${fontSerif.variable}`}>
```

Make sure the `<body>` tag does NOT carry a hardcoded font-family className that would override the CSS var.

- [ ] **Step 4: Build verification**

Run: `npm run build`
Expected: build succeeds, no Tailwind errors. If a missing token name surfaces (e.g. legacy `text-primary` ref), check the legacy aliases block in tailwind.config.ts — add an alias rather than rewriting the call-site.

- [ ] **Step 5: Visual verification**

Run: `npm run dev` and open `localhost:3000`. Expect: pages load (existing layout still wired). Open devtools, inspect `<html>`, confirm `--ink`, `--surface`, `--mint`, `--font-sans`, `--font-serif` are all defined on `:root`.

- [ ] **Step 6: Commit**

```bash
git checkout -b feat/redesign-phase-1
git add src/app/globals.css tailwind.config.ts src/app/layout.tsx
git commit -m "feat(design): wire OKLCH tokens, Inter+Literata fonts, motion tokens"
```

---

## Task 2: Page-transition wrapper (framer-motion + lever-pivot)

**Files:**
- Modify: `package.json` (add `framer-motion`)
- Create: `src/components/layout/PageTransition.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install framer-motion**

Run: `npm install framer-motion`
Expected: package added to `package.json` and `package-lock.json` updated. Commit lock changes.

- [ ] **Step 2: Create `src/components/layout/PageTransition.tsx`**

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const pivotIn = {
  initial: { opacity: 0, rotateX: -5, y: 8, transformOrigin: "right top" },
  animate: { opacity: 1, rotateX: 0, y: 0 },
  exit:    { opacity: 0, rotateX: 3,  y: -4, transformOrigin: "right bottom" },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={pivotIn.initial}
        animate={pivotIn.animate}
        exit={pivotIn.exit}
        transition={{
          duration: 0.48,
          ease: [0.22, 0.61, 0.36, 1],
        }}
        style={{ perspective: "1200px" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Wrap children in `src/app/layout.tsx`**

Inside the `<body>` of `RootLayout`, wrap whatever currently renders children with `<PageTransition>{children}</PageTransition>`. Import is `import { PageTransition } from "@/components/layout/PageTransition";`.

If the layout has provider wrappers (Auth0, react-query etc.), keep them OUTSIDE `<PageTransition>` so providers don't unmount on route change.

- [ ] **Step 4: Verification**

Run: `npm run dev`. Navigate `/` → `/booking` → `/` and confirm the lever-pivot transition fires. Open devtools, set Rendering panel to `prefers-reduced-motion: reduce`, repeat — confirm transition collapses to a quick fade with no rotation.

- [ ] **Step 5: tsc + commit**

Run: `npx tsc --noEmit`. Expect: no errors.

```bash
git add package.json package-lock.json src/components/layout/PageTransition.tsx src/app/layout.tsx
git commit -m "feat(motion): add framer-motion + lever-pivot PageTransition wrapper"
```

---

## Task 3: Brand primitive variants (Button + Card)

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`

- [ ] **Step 1: Read current `button.tsx` and identify the variants array**

Use `Read` to inspect. shadcn buttons are typically built with `cva()`. Locate the variant block.

- [ ] **Step 2: Update Button variants**

Replace the `variants.variant` block so:
- `default` → brand-black surface, white type, mint focus ring, lever-pivot press
- `primary` → mint surface, ink type, mint-deep on press
- `outline` → transparent, rule border, ink type
- `ghost` → transparent, ink type, hover surface-2

Example pattern for the `default` and `primary` cases — match the existing cva() syntax style:

```ts
default: "bg-ink text-on-dark hover:bg-[color:color-mix(in_oklch,var(--ink)_88%,white)] active:scale-[0.97] active:rotate-[1.5deg] transition-transform duration-[var(--pivot-duration)] ease-[var(--pivot-ease)] focus-visible:ring-2 focus-visible:ring-mint-deep focus-visible:ring-offset-2",
primary: "bg-mint text-ink hover:bg-mint-deep hover:text-on-dark active:scale-[0.97] active:rotate-[1.5deg] transition-transform duration-[var(--pivot-duration)] ease-[var(--pivot-ease)] focus-visible:ring-2 focus-visible:ring-mint-deep focus-visible:ring-offset-2",
outline: "border border-rule bg-transparent text-ink hover:bg-surface-2",
ghost: "bg-transparent text-ink hover:bg-surface-2",
```

If `destructive`, `link`, or `secondary` already exist, update their colour tokens but keep the variant names.

- [ ] **Step 3: Update Card defaults in `card.tsx`**

The base `Card` component should render with `bg-surface-2`, `border border-rule`, `rounded-[var(--radius)]`, `text-ink`. Find the existing className string on the wrapper and replace.

- [ ] **Step 4: Verification**

Run: `npx tsc --noEmit` → expect clean. Run `npm run dev`, visit `/booking`, click any button — should be brand-black with mint focus ring; pressing should give the small pivot.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/card.tsx
git commit -m "feat(ui): restyle Button + Card primitives with brand tokens"
```

---

## Task 4: New Sidebar (icon-only default, hover-expand)

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Delete: `src/components/SideBar.tsx`
- Modify: `src/components/index.ts` (re-export new path)
- Modify: any callers importing the old SideBar

- [ ] **Step 1: Read the existing `src/components/SideBar.tsx`**

Use `Read` to capture: nav items, hrefs, icons (if any), routing patterns. Preserve the same set of destinations.

- [ ] **Step 2: Create `src/components/layout/Sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, GraduationCap, ClipboardList,
  Calendar, History, User,
} from "lucide-react";

const items = [
  { href: "/",            label: "Нүүр",         icon: Home },
  { href: "/courses",     label: "Хичээлүүд",   icon: BookOpen },
  { href: "/my-courses",  label: "Миний хичээл", icon: GraduationCap },
  { href: "/my-tests",    label: "Миний тест",   icon: ClipboardList },
  { href: "/booking",     label: "Захиалга",     icon: Calendar },
  { href: "/history",     label: "Түүх",         icon: History },
  { href: "/my-profile",  label: "Профайл",     icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        group fixed left-0 top-0 z-40 hidden md:flex
        h-screen flex-col border-r border-rule bg-surface
        w-16 hover:w-60 focus-within:w-60
        transition-[width] duration-[var(--pivot-duration)] ease-pivot
        overflow-hidden
      "
    >
      {/* Logo */}
      <Link href="/" className="flex h-16 items-center gap-3 px-5 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-ink flex items-center justify-center text-on-dark font-bold">
          L
        </div>
        <span className="text-base font-semibold text-ink opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 delay-75 whitespace-nowrap">
          Lever edu
        </span>
      </Link>

      <nav className="flex-1 flex flex-col gap-1 px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                relative flex items-center gap-3 rounded-md px-3 py-2.5
                transition-colors
                ${active ? "bg-surface-3 text-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink"}
              `}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-mint rounded-r" aria-hidden />
              )}
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 delay-75 whitespace-nowrap">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Delete the old SideBar and update barrel export**

Run: `git rm src/components/SideBar.tsx`. Edit `src/components/index.ts` and remove the `SideBar` re-export. Replace any callers of `SideBar` with the new `Sidebar` from `@/components/layout/Sidebar`.

Use `grep -rn "SideBar" src/` to find call-sites.

- [ ] **Step 4: Verification**

Run: `npx tsc --noEmit` → clean. `npm run dev`, visit `/`, hover the sidebar — should expand smoothly to ~240px with labels fading in. Tab into a sidebar item via keyboard — should also expand (focus-within). Active route should show the mint left bar.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/index.ts $(grep -rl "SideBar" src/ 2>/dev/null || true)
git rm src/components/SideBar.tsx
git commit -m "feat(layout): icon-only sidebar with hover-expand and mint active indicator"
```

---

## Task 5: New Header (sticky-with-blur, slim)

**Files:**
- Create: `src/components/layout/Header.tsx`
- Delete: `src/components/Header.tsx`
- Modify: `src/components/index.ts`
- Modify: callers

- [ ] **Step 1: Read existing `src/components/Header.tsx`**

Capture: what's already in there (notifications? profile? search?), Auth0 hooks, etc.

- [ ] **Step 2: Create `src/components/layout/Header.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Bell, Search, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 md:left-16 right-0 z-30 h-16
        flex items-center justify-between px-6
        border-b transition-all duration-200
        ${scrolled
          ? "bg-surface/80 backdrop-blur-md border-rule"
          : "bg-surface border-transparent"}
      `}
    >
      {/* Left: search trigger (placeholder for now) */}
      <button
        type="button"
        className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors"
        aria-label="Хайх"
      >
        <Search className="h-5 w-5" />
        <span className="hidden md:inline text-sm">Хайх...</span>
      </button>

      {/* Right: notifications + profile */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative p-2 rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
          aria-label="Мэдэгдэл"
        >
          <Bell className="h-5 w-5" />
          {/* Notification count badge — always 0 in Phase 1, kept for future hook */}
        </button>
        <Link
          href="/my-profile"
          className="p-2 rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
          aria-label="Профайл"
        >
          <UserIcon className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Delete old `src/components/Header.tsx`**

Run: `git rm src/components/Header.tsx`. Update `src/components/index.ts` to remove the export. Find callers via `grep -rn "from \"@/components\"" src/ | grep -i "Header"` and re-import from `@/components/layout/Header` or remove the import if the new layout-level Header is rendered higher up.

- [ ] **Step 4: Verification**

`npx tsc --noEmit` → clean. `npm run dev`, visit `/`, scroll down — header should gain backdrop-blur and a hairline border. Click notifications/profile — should highlight on hover.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.tsx src/components/index.ts
git rm src/components/Header.tsx
git commit -m "feat(layout): sticky-with-blur header, slim brand chrome"
```

---

## Task 6: BrandHero on home (continue-where-you-left-off)

**Files:**
- Create: `src/app/(home)/_components/BrandHero.tsx`
- Modify: `src/app/(home)/page.tsx`

- [ ] **Step 1: Read existing home `MyCoursesSection.tsx` + `MyTestsSection.tsx`**

To understand the data shape used for "in progress" course/test. The BrandHero will surface the most recent active item. If the existing data hooks return arrays, use the first element.

- [ ] **Step 2: Create `src/app/(home)/_components/BrandHero.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface BrandHeroProps {
  greeting?: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
}

export function BrandHero({
  greeting = "Тавтай морил",
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: BrandHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, rotateX: -3, y: 12, transformOrigin: "left top" }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ perspective: "1000px" }}
      className="
        relative overflow-hidden rounded-[var(--radius)]
        bg-ink text-on-dark
        px-8 py-10 md:px-12 md:py-14
      "
    >
      {/* Mint page-curl accent in the bottom right corner — echoes the logo */}
      <div
        aria-hidden
        className="absolute bottom-0 right-0 h-24 w-24 md:h-32 md:w-32 bg-mint"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />

      <p className="text-meta uppercase tracking-wider text-on-dark/60 mb-3">
        {greeting}
      </p>
      <h1 className="font-serif text-display leading-tight max-w-2xl mb-3">
        {title}
      </h1>
      {subtitle && (
        <p className="text-body text-on-dark/70 max-w-xl mb-8">{subtitle}</p>
      )}

      <Link
        href={ctaHref}
        className="
          inline-flex items-center gap-2 rounded-md
          bg-mint px-5 py-3 text-ink font-semibold
          hover:bg-mint-deep hover:text-on-dark
          active:scale-[0.97] active:rotate-[1.5deg]
          transition-transform duration-[var(--pivot-duration)] ease-pivot
          focus-visible:ring-2 focus-visible:ring-mint-deep focus-visible:ring-offset-2 focus-visible:ring-offset-ink
        "
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.section>
  );
}
```

- [ ] **Step 3: Wire BrandHero into `src/app/(home)/page.tsx`**

Restructure the page (final form is built piece-by-piece in tasks 6, 7, 8 — this step adds the hero only):

```tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BrandHero } from "./_components/BrandHero";
import {
  MyCoursesSection,
  MyTestsSection,
  RecommendedCoursesSection,
  RecommendedTestsSection,
} from "./sections";

const Home = () => {
  return (
    <>
      <Sidebar />
      <Header />
      <main className="md:ml-16 mt-16 min-h-screen">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-8 flex flex-col gap-12">
          <BrandHero
            title="Үргэлжлүүлэн суралц"
            subtitle="Сүүлд орж байсан хичээлээ үргэлжлүүлэх эсвэл шинэ туршилтын тест өгөх."
            ctaLabel="Үргэлжлүүлэх"
            ctaHref="/my-courses"
          />

          <div className="grid md:grid-cols-2 gap-6">
            <MyCoursesSection />
            <MyTestsSection />
          </div>

          <RecommendedCoursesSection />
          <RecommendedTestsSection />
        </div>
      </main>
    </>
  );
};

export default Home;
```

(Note: the `BannerSection` import is intentionally removed — it's deleted in Task 8, replaced by `Promo` inserted between rails.)

- [ ] **Step 4: Verification**

`npx tsc --noEmit` → clean. `npm run dev`, visit `/`. Confirm: brand-black hero card with mint page-curl, mint CTA button, lever-pivot reveal on mount.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(home\)/_components/BrandHero.tsx src/app/\(home\)/page.tsx
git commit -m "feat(home): brand-black hero card with mint page-curl + CTA"
```

---

## Task 7: RailCard + recommended rails redesign

**Files:**
- Create: `src/app/(home)/_components/RailCard.tsx`
- Modify: `src/app/(home)/sections/MyCoursesSection.tsx`
- Modify: `src/app/(home)/sections/MyTestsSection.tsx`
- Modify: `src/app/(home)/sections/RecommendedCoursesSection.tsx`
- Modify: `src/app/(home)/sections/RecommendedTestsSection.tsx`

- [ ] **Step 1: Read all four section files to capture data shapes**

Use `Read` on each. Identify what fields each card today consumes (image, title, teacher, etc.). The new `RailCard` should accept the union — title, subtitle, image, href, badge.

- [ ] **Step 2: Create `src/app/(home)/_components/RailCard.tsx`**

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";

interface RailCardProps {
  href: string;
  image?: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

export function RailCard({ href, image, title, subtitle, badge }: RailCardProps) {
  return (
    <Link
      href={href}
      className="
        group block rounded-[var(--radius)] overflow-hidden
        bg-surface-2 border border-rule
        hover:bg-surface-3 hover:shadow-md transition-all duration-200
      "
    >
      {image && (
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-3">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-pivot"
          />
          {badge && (
            <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-mint-soft text-mint-ink text-micro font-semibold">
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-h3 font-semibold text-ink line-clamp-2">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-meta text-ink-muted line-clamp-2">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Restyle each section**

For each of `MyCoursesSection`, `MyTestsSection`, `RecommendedCoursesSection`, `RecommendedTestsSection`:
- Section header: `<h2 className="text-h2 font-semibold text-ink mb-4">…</h2>` plus optional "View all" link as a ghost button
- Card grid: replace the existing card render with `<RailCard … />` mapped over the data
- Recommended rails wrap the cards in `<motion.div>` with stagger:

```tsx
import { motion } from "framer-motion";

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 12, rotateX: -2 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.32, delay: Math.min(i, 5) * 0.06, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ perspective: "1000px" }}
    >
      <RailCard
        href={...}
        image={...}
        title={...}
        subtitle={...}
        badge={item.isNew ? "Шинэ" : undefined}
      />
    </motion.div>
  ))}
</div>
```

`MyCoursesSection` and `MyTestsSection` are personal continue-progress lists — they typically show 1-2 items each, no stagger needed; just `RailCard` directly. Add empty / loading states (a small `text-meta text-ink-muted` row) if the underlying data hook can return empty.

- [ ] **Step 4: Verification**

`npx tsc --noEmit` → clean. `npm run dev`, visit `/`, see the two recommended rails with new cards staggering in on mount. Hover a card — subtle background shift + image scale.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(home\)/_components/RailCard.tsx src/app/\(home\)/sections/
git commit -m "feat(home): unified RailCard + restyled recommended rails with stagger reveal"
```

---

## Task 8: Promo inline component, drop BannerSection

**Files:**
- Create: `src/app/(home)/_components/Promo.tsx`
- Delete: `src/app/(home)/sections/BannerSection.tsx`
- Modify: `src/app/(home)/sections/index.ts` (drop BannerSection export)
- Modify: `src/app/(home)/page.tsx` (insert Promo, remove right-rail render)

- [ ] **Step 1: Capture current `BannerSection.tsx` content**

Use `Read`. Identify what the banner currently promotes (booking CTA? new course? IELTS mock? etc.) — preserve copy & image.

- [ ] **Step 2: Create `src/app/(home)/_components/Promo.tsx`**

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";

interface PromoProps {
  eyebrow?: string;
  title: string;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
  image?: string;
}

export function Promo({ eyebrow, title, body, ctaLabel, ctaHref, image }: PromoProps) {
  return (
    <section className="
      grid md:grid-cols-[1fr_auto] items-center gap-6
      rounded-[var(--radius)] border border-rule bg-mint-soft
      p-6 md:p-8
    ">
      <div>
        {eyebrow && (
          <p className="text-meta uppercase tracking-wider text-mint-ink mb-2">
            {eyebrow}
          </p>
        )}
        <h3 className="text-h2 font-semibold text-ink mb-2">{title}</h3>
        {body && <p className="text-body text-ink-soft mb-5 max-w-2xl">{body}</p>}
        <Link
          href={ctaHref}
          className="
            inline-flex items-center gap-2 rounded-md
            bg-ink text-on-dark px-5 py-2.5 font-medium
            hover:bg-[color:color-mix(in_oklch,var(--ink)_88%,white)]
            active:scale-[0.97] active:rotate-[1.5deg]
            transition-transform duration-[var(--pivot-duration)] ease-pivot
          "
        >
          {ctaLabel}
        </Link>
      </div>
      {image && (
        <div className="relative w-32 h-32 md:w-40 md:h-40 hidden md:block">
          <Image src={image} alt="" fill className="object-contain" />
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Update `src/app/(home)/page.tsx`**

Insert `<Promo … />` between the personal sections and the recommended rails:

```tsx
<div className="grid md:grid-cols-2 gap-6">
  <MyCoursesSection />
  <MyTestsSection />
</div>

<Promo
  eyebrow="IELTS"
  title="Долоо хоног бүр Mock шалгалт"
  body="Бодит шалгалтын орчин — өглөө 9 цагт, 100,000₮."
  ctaLabel="Захиалах"
  ctaHref="/booking"
/>

<RecommendedCoursesSection />
<RecommendedTestsSection />
```

(Adjust the copy if the existing BannerSection promoted something else — preserve original Mongolian copy as-is.)

- [ ] **Step 4: Delete `BannerSection.tsx` and update barrel**

```bash
git rm src/app/\(home\)/sections/BannerSection.tsx
```

Edit `src/app/(home)/sections/index.ts` and remove the `BannerSection` export.

- [ ] **Step 5: Verification**

`npx tsc --noEmit` → clean. `npm run dev`, visit `/`, scroll down — should see inline Promo card between the personal pair and recommended rails. No right-rail anywhere.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(home\)/_components/Promo.tsx src/app/\(home\)/page.tsx src/app/\(home\)/sections/index.ts
git rm src/app/\(home\)/sections/BannerSection.tsx
git commit -m "feat(home): inline Promo card replaces fixed right-rail BannerSection"
```

---

## Task 9: New Stepper + booking flow restyle

**Files:**
- Create: `src/app/(pages)/booking/components/Stepper.tsx`
- Delete: `src/app/(pages)/booking/components/BookingStepper.tsx`
- Modify: `src/app/(pages)/booking/page.tsx`
- Modify: `src/app/(pages)/booking/components/StepTestType.tsx`
- Modify: `src/app/(pages)/booking/components/StepDateTime.tsx`
- Modify: `src/app/(pages)/booking/components/StepDetails.tsx`
- Modify: `src/app/(pages)/booking/components/StepReview.tsx`
- Modify: `src/app/(pages)/booking/components/BookingConfirmation.tsx`
- Modify: `src/app/(pages)/booking/components/BookingNavBar.tsx`

- [ ] **Step 1: Read all current booking files**

Capture: step labels in Mongolian, the props each step accepts (next/back/state), how `BookingStepper` is used, what `BookingNavBar` currently renders. Preserve all copy.

- [ ] **Step 2: Create new `Stepper.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";

interface StepperProps {
  steps: string[];      // labels in order
  currentIndex: number; // 0-based
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <ol className="flex items-center gap-2 md:gap-4 w-full max-w-3xl mx-auto">
      {steps.map((label, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <li key={label} className="flex items-center gap-2 md:gap-4 flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isDone || isActive
                    ? "var(--mint)"
                    : "var(--surface-3)",
                }}
                transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                className={`h-3 w-3 rounded-full ${isActive ? "ring-4 ring-mint-soft" : ""}`}
              />
              <span className={`text-micro font-medium hidden md:block ${
                isActive ? "text-ink" : isDone ? "text-mint-ink" : "text-ink-muted"
              }`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-rule relative overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: isDone ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                  className="absolute inset-y-0 left-0 bg-mint"
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 3: Wire new Stepper in `booking/page.tsx`**

Replace `<BookingStepper … />` with `<Stepper steps={[…]} currentIndex={…} />`. Use the same Mongolian step labels currently in `BookingStepper.tsx`. Drop the import of `BookingStepper`.

Also wrap the per-step content render in `AnimatePresence` for the lever-pivot transition between steps:

```tsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 24, rotateY: 4 }}
    animate={{ opacity: 1, x: 0, rotateY: 0 }}
    exit={{ opacity: 0, x: -24, rotateY: -4 }}
    transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
    style={{ perspective: "1200px" }}
  >
    {/* current step component */}
  </motion.div>
</AnimatePresence>
```

- [ ] **Step 4: Restyle each step component**

For each of `StepTestType.tsx`, `StepDateTime.tsx`, `StepDetails.tsx`, `StepReview.tsx`, `BookingConfirmation.tsx`:
- Replace ad-hoc colors (`#3B82F6`, `bg-blue-…`, `text-gray-…`) with brand tokens (`text-ink`, `text-ink-muted`, `bg-surface-2`, `border-rule`, `bg-mint`, etc.)
- Use the new Button primitive (`<Button variant="default">…</Button>` for primary brand-black, `<Button variant="primary">…</Button>` for mint, `outline` for back)
- Card surfaces use `bg-surface-2 border border-rule rounded-[var(--radius)] p-6`
- Selectable options (test type cards, time slots) use `aria-pressed`-driven styling — selected = `border-mint-deep ring-2 ring-mint-soft`
- Form inputs (StepDetails) use `bg-surface border-rule focus:border-mint-deep focus:ring-2 focus:ring-mint-soft`
- Preserve ALL Mongolian copy verbatim

- [ ] **Step 5: Restyle `BookingNavBar.tsx`**

Match the new Header treatment — `bg-surface border-b border-rule h-16 px-6 flex items-center` etc. Logo placement same as Header. If it has any blue accents, swap to mint or ink.

- [ ] **Step 6: Delete old Stepper**

```bash
git rm src/app/\(pages\)/booking/components/BookingStepper.tsx
```

- [ ] **Step 7: Verification**

`npx tsc --noEmit` → clean. `npm run dev`, visit `/booking`. Walk all 5 steps:
1. Test type selection — cards highlight with mint ring on click
2. Date/time — calendar/slot picker uses brand tokens
3. Details — form inputs have mint focus state
4. Review/Pay — button reads as brand-black with mint focus
5. Confirmation — success state in mint-soft background

Each step transition should pivot in. Stepper dots should fill mint as you advance, connecting bars fill from left.

- [ ] **Step 8: Commit**

```bash
git add src/app/\(pages\)/booking/
git commit -m "feat(booking): new Stepper + Discover-surface restyle for all 5 steps"
```

---

## Task 10: Mobile chrome — bottom nav + responsive content well

**Files:**
- Create: `src/components/layout/MobileBottomNav.tsx`
- Modify: `src/app/layout.tsx` (mount MobileBottomNav)

- [ ] **Step 1: Create `MobileBottomNav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ClipboardList, User } from "lucide-react";

const items = [
  { href: "/",            label: "Нүүр",     icon: Home },
  { href: "/courses",     label: "Хичээл",   icon: BookOpen },
  { href: "/my-tests",    label: "Тест",     icon: ClipboardList },
  { href: "/my-profile",  label: "Профайл", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40 md:hidden
      h-16 bg-surface border-t border-rule
      flex items-stretch
    ">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5
              ${active ? "text-mint-deep" : "text-ink-muted"}
              transition-colors
            `}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Mount in `app/layout.tsx`**

Inside `<body>`, after `<PageTransition>{children}</PageTransition>`, render `<MobileBottomNav />`. Make sure the home `<main>` has bottom padding for the 64px bar on mobile (e.g. `pb-20 md:pb-8`).

- [ ] **Step 3: Verification**

`npx tsc --noEmit` → clean. `npm run dev`, resize browser to ≤414px. Sidebar should hide; bottom nav appears; tapping items navigates.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/MobileBottomNav.tsx src/app/layout.tsx
git commit -m "feat(layout): mobile bottom nav + responsive content padding"
```

---

## Task 11: Final acceptance smoke + cleanup

**Files:**
- Repo-wide audit, no specific file modifications expected (only fixes if audit surfaces issues)

- [ ] **Step 1: Build cleanliness**

Run: `npm run build`
Expected: succeeds with no errors. Note any warnings about unused imports / etc., resolve if from this work.

- [ ] **Step 2: Type cleanliness**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Hard-coded colour audit**

Run: `grep -rn "#3B82F6\|#3b82f6\|bg-blue-\|text-blue-" src/app src/components 2>&1 | grep -v node_modules`
Expected: zero matches in code paths touched by Phase 1 (home, layout chrome, booking). Document any remaining matches in untouched routes (will be addressed in Phase 2/3) — they're acceptable for now.

- [ ] **Step 4: Manual smoke — desktop**

Open `npm run dev` at desktop width (≥1280px):
1. `/` loads with new sidebar (icon-only), header, brand-black hero with mint page-curl + mint CTA, two personal sections, inline Promo, two recommended rails (with stagger reveal on first mount)
2. Hover sidebar → expands to ~240px showing labels
3. Tab into a sidebar item via keyboard → also expands
4. Scroll the home page → header gains backdrop-blur
5. Click "Захиалах" Promo CTA → navigates to `/booking` with lever-pivot page transition
6. Walk all 5 booking steps + confirmation:
   - Stepper dots fill mint, connector bars fill left-to-right
   - Each step transition pivots in
   - All Mongolian copy preserved
   - Form inputs have mint focus rings
7. Navigate `/booking` → `/` → page transition works in reverse

- [ ] **Step 5: Manual smoke — mobile**

Resize to ≤414px:
1. Sidebar gone; bottom nav present with 4 destinations
2. Hero card stacks; CTA wraps cleanly
3. Rails go single-column
4. Promo image hides, copy + CTA stack
5. Booking flow usable thumb-only

- [ ] **Step 6: Reduced-motion smoke**

Devtools → Rendering → set `prefers-reduced-motion: reduce`. Reload `/`. Confirm:
- Hero appears with no rotation/fade-in
- Page transition collapses to a quick fade
- Stagger reveal disabled
- Stepper dot transitions still happen but very fast

- [ ] **Step 7: Commit any cleanup + final**

If audit surfaced fixes:
```bash
git add ...
git commit -m "chore(redesign): post-audit cleanup"
```

Then verify the branch is in good shape:
```bash
git log --oneline main..HEAD
```
Expect: ~10-11 commits across the tasks.

- [ ] **Step 8: Hand off**

Stop here. Do not push. Do not merge. The controller (per `subagent-driven-development`) hands off to `finishing-a-development-branch` to present merge/PR/keep options to the user.

---

## Self-review checklist (controller pre-dispatch)

- ✅ Spec coverage: tokens (§3) → Task 1; surfaces — Discover only this phase, Focus surfaces deferred to Phase 2/3 per spec §8; typography (§4) → Task 1; layout chrome (§5) → Tasks 4, 5, 8, 10; motion (§6) → Tasks 2, 3, 6, 7, 9; component approach (§7) → Task 3; vertical slice scope (§8 phase 1) → Tasks 6-9; future hooks (§9) — streak slot deferred (test surface lives in Phase 3), notification badge slot in Task 5; out-of-scope (§10) honoured.
- ✅ Open follow-ups (§12): font licensing — Inter+Literata via `next/font/google` (OFL); page-transition implementation — `framer-motion` chosen (Task 2); sidebar a11y — `:hover`, `:focus-within` (Task 4); BrandHero CTA copy — Mongolian "Үргэлжлүүлэх" used as default; Promo data source — hard-coded prop in Task 8.
- ✅ Type consistency: `Sidebar` (capital S, new path), `Header` (new path), `BrandHero` / `RailCard` / `Promo` consistently named.
- ✅ No placeholders.
