# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ROL

Actúa como un Senior Fullstack Developer experto en React 19 y TypeScript. Tu objetivo es mantener una landing page de alto rendimiento, con un diseño visualmente impactante (dark mode/warm accents) y un flujo de reserva impecable.

Prioridad: Código limpio, tipado estricto y diseño mobile-first.

Tono: Técnico, directo y orientado a la eficiencia.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run server   # Express proxy para Groq (puerto 3001, con tsx watch)
npm run dev:all  # Dev completo: Vite + Express en paralelo (concurrently)
npm run build    # Production build (también type-check via Vite)
npm run lint     # ESLint
npm run preview  # Preview production build
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
types/index.ts              — Interfaces: MenuItem, MenuCategory, ReservationFormData, CancelFormData, ChatMessage, AdminMenuItem, etc.
lib/supabase.ts             — Cliente Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
data/menuData.ts            — Metadata estática de categorías (label, icon, id). Items vienen de Supabase.
data/menu/                  — DEPRECATED — items estáticos, ignorar. La fuente real es Supabase.
data/chatPrompt.ts          — System prompt del asistente (buildSystemPrompt())
services/ai.ts              — sendChatMessage(): llama a /api/chat, desacoplado de componentes
hooks/useMenu.ts            — Fetch de menu_items desde Supabase, agrupa por categoría → MenuCategory[]
hooks/useReservation.ts     — Form state, validación, buildReservationMessage(), WHATSAPP_NUMBER, buildWhatsAppUrl()
hooks/useCancelReservation.ts — Misma estructura que useReservation pero para cancelaciones
hooks/useChat.ts            — Mensajes, intent, ORDER_MARKER parser, pendingOrderUrl (WhatsApp)
hooks/useAdminMenu.ts       — Fetch de todos los items (sin filtro RLS), toggleAvailable() con useOptimistic
components/
  LogoM.tsx                 — Logo SVG flotante
  Hero.tsx                  — Full-screen hero. Props: onReserveClick, onOrderClick, onMenuClick
  Menu.tsx                  — Tab-based menu. Props: isOpen, onToggle. Usa useMenu()
  ExperienceGallery.tsx     — Sección galería/experiencia
  Footer.tsx                — Footer. Prop: onCancelClick
  ReservationModal.tsx      — Portal modal de reserva. Usa useReservation internamente
  CancelReservationModal.tsx — Portal modal de cancelación. Usa useCancelReservation internamente
  ChatWidget.tsx            — Chat flotante. Props: isOpen, onOpenChange, intent, onIntentHandled
  admin/AdminLogin.tsx      — Login con Supabase Auth (solo en ruta admin)
  admin/AdminPanel.tsx      — Panel CRUD de carta (toggle available por ítem)
App.tsx                     — Estado global: modales, chat, admin route. Compone todo.
server/index.ts             — Express proxy para Groq (dev local, puerto 3001)
api/chat.ts                 — Serverless function Vercel (/api/chat), usa Groq SDK
```

**Reservation flow:** Hero → `ReservationModal` → `useReservation.submit()` → genera mensaje WhatsApp → abre `https://wa.me/WHATSAPP_NUMBER?text=...`

**Cancel flow:** Footer → `CancelReservationModal` → `useCancelReservation.submit()` → mismo patrón WhatsApp con mensaje de cancelación.

**Chat flow:** Hero "Hacer pedido" → `ChatWidget` con `intent='order'` → mensajes a `/api/chat` (Vercel) o `:3001/api/chat` (dev) → Groq con `llama-3.3-70b-versatile` → si la IA incluye `[[PEDIDO:...]]`, `useChat` extrae el texto y genera `pendingOrderUrl` (WhatsApp con pedido pre-cargado).

**Admin flow:** `?access=VITE_ADMIN_TOKEN` → `AdminLogin` (Supabase Auth) → `AdminPanel` → `useAdminMenu` maneja fetch + `toggleAvailable()` con optimistic UI.

**Menu flow:** `Menu.tsx` monta → `useMenu()` hace SELECT a Supabase (`available = true`) → agrupa por `category` → renderiza tabs y cards.

## Supabase

- **Tabla:** `menu_items` — columnas: `id`, `slug`, `name`, `description`, `price`, `category`, `sort_order`, `available`, `is_signature`, `tags`, `image_url`, `created_at`, `updated_at`
- **RLS:** anon solo lee `available = true`. Authenticated (dueño) tiene acceso total.
- **Variables de entorno:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_TOKEN` (ver `.env.example`)
- **Categorías en DB:** `entradas`, `cervezas`, `cocteles`, `vinos`, `sin-alcohol`, `pizzas`, `postres`, `sandwiches`, `panchos`, `empanadas`, `ensaladas` — `sin-alcohol` → `id: 'bebidas'` en el frontend (ver `CATEGORY_META` en `useMenu.ts`)

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

In practice many components still use inline `style={{}}` for colors — prefer Tailwind classes going forward.

## Key conventions

- **Mobile-first** layout. All new sections should work well at 375px before adding `md:` / `lg:` breakpoints.
- **No routing** — single page with anchor scroll (`href="#menu"`, `href="#reservas"`).
- New page sections go in `src/components/`, imported and composed in `App.tsx`.
- `WHATSAPP_NUMBER` y `buildWhatsAppUrl()` son constantes en `hooks/useReservation.ts` — reutilizables desde cualquier hook.
- **Nunca editar precios/items en `data/menu/*.ts`** — esos archivos están deprecated. La fuente de verdad es Supabase.
- El panel admin se accede via `?access=TOKEN` (token en `VITE_ADMIN_TOKEN`), nunca hardcodeado.
