# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build (also acts as type-check via Vite)
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

There are no tests configured yet.

## Stack

- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/vite` — configured with `@theme {}` in `src/index.css`, not `tailwind.config.js`
- **Vite 8** — entry point is `src/main.tsx` (referenced in `index.html`)

## Architecture

The app is a single-page landing for Mítico, a pizzería/bar. All source lives in `src/`:

```
types/index.ts          — Shared interfaces (MenuItem, MenuCategory, ReservationFormData, etc.)
data/menuData.ts        — Static menu content (6 categories, ~35 items). Edit here to update prices/items.
hooks/useReservation.ts — Form state, validation, message builder, clipboard logic
components/
  Hero.tsx              — Full-screen hero. Accepts onReserveClick() prop from App.
  Menu.tsx              — Tab-based menu section, anchored at id="menu".
  ReservationModal.tsx  — Portal modal. Manages its own useReservation hook internally.
App.tsx                 — Holds isReservationOpen state. Renders Hero → Menu → (Modal if open).
```

**Reservation flow:** Hero button → App opens modal → user fills form → `useReservation.submit()` builds a formatted message, copies it to clipboard, sets status to `'success'` → modal shows message preview + "Abrir Instagram" link to `https://ig.me/m/mitico.bar`.

## Design tokens

Defined in `src/index.css` under `@theme {}` and available as Tailwind utilities:

| Token | Value | Tailwind class |
|---|---|---|
| `--color-bg-deep` | `#0D0D0D` | `bg-bg-deep` |
| `--color-bg-card` | `#1A1A1A` | `bg-bg-card` |
| `--color-accent` | `#E8622A` | `bg-accent`, `text-accent` |
| `--color-accent-warm` | `#C4963A` | `text-accent-warm` |
| `--color-cream` | `#F5E6C8` | `text-cream` |
| `--color-muted` | `#8A8070` | `text-muted` |
| `--font-heading` | `Bebas Neue` | `font-heading` |
| `--font-body` | `Inter` | `font-body` |

In practice many components still use inline `style={{}}` for colors — either approach is acceptable, but prefer Tailwind classes going forward.

## Key conventions

- **Mobile-first** layout. All new sections should work well at 375px before adding `md:` / `lg:` breakpoints.
- **No routing** — single page with anchor scroll (`href="#menu"`, `href="#reservas"`).
- New page sections go in `src/components/`, imported and composed in `App.tsx`.
- The Instagram username (`mitico.bar`) is a constant in `hooks/useReservation.ts` (`INSTAGRAM_USERNAME`).

