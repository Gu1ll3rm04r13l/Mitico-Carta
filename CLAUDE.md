# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ROL

Actúa como un Senior Fullstack Developer experto en React 19 y TypeScript. Tu objetivo es mantener una landing page de alto rendimiento, con un diseño visualmente impactante (dark mode/warm accents) y un flujo de reserva impecable.

Prioridad: Código limpio, tipado estricto y diseño mobile-first.

Tono: Técnico, directo y orientado a la eficiencia.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build (also acts as type-check via Vite)
npm run lint     # ESLint
npm run preview  # Preview production build locally
node server/index.ts  # Dev: servidor Express proxy para Groq (puerto 3001)
```

There are no tests configured yet.

## Stack

- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/vite` — configured with `@theme {}` in `src/index.css`, not `tailwind.config.js`
- **Vite 8** — entry point is `src/main.tsx` (referenced in `index.html`)
- **Supabase** — base de datos PostgreSQL + Auth. Cliente en `src/lib/supabase.ts`
- **Groq SDK** — LLM para el asistente de chat (`llama-3.3-70b-versatile`)

## Architecture

The app is a single-page landing for Mítico, a pizzería/bar. All source lives in `src/`:

```
types/index.ts           — Shared interfaces (MenuItem, MenuCategory, ReservationFormData, etc.)
lib/supabase.ts          — Cliente Supabase (anon key desde VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
data/menuData.ts         — Metadata estática de categorías (label, icon, id). Ya NO contiene los items.
data/menu/               — Archivos de items estáticos (DEPRECATED — la fuente real es Supabase)
hooks/useMenu.ts         — Fetch de menu_items desde Supabase, agrupa por categoría, devuelve MenuCategory[]
hooks/useReservation.ts  — Form state, validation, message builder, clipboard logic
data/chatPrompt.ts       — System prompt del asistente (buildSystemPrompt())
components/
  Hero.tsx               — Full-screen hero. Accepts onReserveClick() prop from App.
  Menu.tsx               — Tab-based menu section, anchored at id="menu". Usa useMenu() hook.
  ReservationModal.tsx   — Portal modal. Manages its own useReservation hook internally.
App.tsx                  — Holds isReservationOpen state. Renders Hero → Menu → (Modal if open).
server/index.ts          — Express proxy server para Groq (dev y producción sin Vercel)
api/chat.ts              — Serverless function para Vercel (/api/chat), usa Groq SDK
```

**Reservation flow:** Hero button → App opens modal → user fills form → `useReservation.submit()` builds a formatted message, copies it to clipboard, sets status to `'success'` → modal shows message preview + "Abrir Instagram" link to `https://ig.me/m/mitico.bar`.

**Chat flow:** Usuario abre chat → mensajes van a `/api/chat` (Vercel) o `http://localhost:3001/api/chat` (dev) → proxy llama a Groq con `llama-3.3-70b-versatile` y el system prompt de `chatPrompt.ts`.

**Menu flow:** `Menu.tsx` monta → `useMenu()` hace SELECT a Supabase (`menu_items WHERE available = true`) → agrupa rows por `category` → renderiza tabs y cards. El dueño activa/desactiva ítems desde el panel admin (próxima fase).

## Supabase

- **Tabla:** `menu_items` — columnas: `id`, `slug`, `name`, `description`, `price`, `category`, `sort_order`, `available`, `is_signature`, `tags`, `image_url`, `created_at`, `updated_at`
- **RLS:** anon solo lee `available = true`. Authenticated (dueño) tiene acceso total.
- **Variables de entorno:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ver `.env.example`)
- **Categorías en DB:** `entradas`, `cervezas`, `cocteles`, `vinos`, `sin-alcohol`, `pizzas`, `postres`, `sandwiches`, `panchos`, `empanadas`, `ensaladas` — nota: `sin-alcohol` se mapea a `id: 'bebidas'` en el frontend (ver `CATEGORY_META` en `useMenu.ts`)

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
- **Nunca editar precios/items en `data/menu/*.ts`** — esos archivos están deprecated. La fuente de verdad es Supabase.
