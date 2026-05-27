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
lib/supabase.ts             — Cliente Supabase frontend (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
lib/timeSlots.ts            — TIME_SLOTS compartido por ReservationModal y CancelReservationModal
lib/categories.ts           — CATEGORY_ICON_CHOICES (set emojis del picker) + FALLBACK_CATEGORY_ICON
lib/slug.ts                 — toSlug(): texto → slug ASCII (usado por items y categorías)
services/ai.ts              — sendChatMessage(): llama a /api/chat (solo envía mensajes; el prompt se arma server-side)
hooks/useMenu.ts            — Fetch de categories + menu_items desde Supabase, agrupa → MenuCategory[]
hooks/useReservation.ts     — Form state, validación (1-20 personas), buildReservationMessage(), WHATSAPP_NUMBER, buildWhatsAppUrl()
hooks/useCancelReservation.ts — Misma estructura que useReservation pero para cancelaciones
hooks/useChat.ts            — Mensajes, intent, ORDER_MARKER parser, pendingOrderUrl (WhatsApp)
hooks/useAdminMenu.ts       — Fetch items + categories; CRUD de items y de categorías (insert/update/deleteCategoryWithReassign)
components/
  LogoM.tsx                 — Logo SVG flotante
  ErrorBoundary.tsx         — Captura errores runtime en root (montado en main.tsx)
  Hero.tsx                  — Full-screen hero. Props: onReserveClick, onOrderClick, onMenuClick
  Menu.tsx                  — Tab-based menu. Props: isOpen, onToggle. Usa useMenu()
  ExperienceGallery.tsx     — Sección galería/experiencia
  Footer.tsx                — Footer. Prop: onCancelClick
  ReservationModal.tsx      — Portal modal de reserva. Usa useReservation internamente
  CancelReservationModal.tsx — Portal modal de cancelación. Usa useCancelReservation internamente
  ChatWidget.tsx            — Chat flotante. Props: isOpen, onOpenChange, intent, onIntentHandled
  admin/AdminLogin.tsx      — Login con Supabase Auth (cargado con React.lazy)
  admin/AdminPanel.tsx      — Panel CRUD de carta + categorías (cargado con React.lazy)
  admin/ItemFormModal.tsx   — Crear/editar producto. Recibe categories por prop (select dinámico)
  admin/CategoryFormModal.tsx — Crear/editar categoría (label + emoji picker)
  admin/CategoryDeleteModal.tsx — Borrar categoría reasignando items (checkboxes + destino)
App.tsx                     — Estado global: modales, chat, admin route. Admin con React.lazy + Suspense.
api/_lib/supabase.ts        — Cliente Supabase server-side (SUPABASE_URL/ANON_KEY, fallback VITE_*)
api/_lib/menuCache.ts       — getMenu(): fetch Supabase con cache módulo TTL 60s + dedupe inflight
api/_lib/buildPrompt.ts     — buildSystemPrompt(categories): genera prompt del bot desde menú real
api/chat.ts                 — Serverless function Vercel (/api/chat). Importa shared desde ./_lib.
server/index.ts             — Express proxy para Groq (dev local, puerto 3001). Importa shared desde ../api/_lib.
```

**Reservation flow:** Hero → `ReservationModal` → `useReservation.submit()` → genera mensaje WhatsApp → abre `https://wa.me/WHATSAPP_NUMBER?text=...`

**Cancel flow:** Footer → `CancelReservationModal` → `useCancelReservation.submit()` → mismo patrón WhatsApp con mensaje de cancelación.

**Chat flow:** Hero "Hacer pedido" → `ChatWidget` con `intent='order'` → mensajes a `/api/chat` (Vercel) o `:3001/api/chat` (dev). El server lee menú de Supabase (cache módulo TTL 60s), arma el system prompt fresco con precios reales y lo pasa a Groq (`llama-3.3-70b-versatile`). Si la IA incluye `[[PEDIDO:...]]`, `useChat` extrae el texto y genera `pendingOrderUrl` (WhatsApp con pedido pre-cargado). **El frontend ya NO envía el prompt** — solo el array de mensajes. Cambios en el admin panel se reflejan en el bot dentro de 60s.

**Admin flow:** `?access=VITE_ADMIN_TOKEN` → `AdminLogin` (Supabase Auth) → `AdminPanel` → `useAdminMenu` maneja fetch + `toggleAvailable()` con optimistic UI.

**Menu flow:** `Menu.tsx` monta → `useMenu()` hace SELECT a Supabase (`available = true`) → agrupa por `category` → renderiza tabs y cards.

## Supabase

- **Tabla:** `menu_items` — columnas: `id`, `slug`, `name`, `description`, `price`, `category`, `sort_order`, `available`, `is_signature`, `tags`, `image_url`, `created_at`, `updated_at`
- **Tabla:** `categories` — columnas: `key` (PK, slug), `label`, `icon` (emoji), `sort_order`, `created_at`, `updated_at`. **Fuente única de las categorías de la carta** (label/icono/orden). `menu_items.category` es FK → `categories.key` (`ON DELETE RESTRICT ON UPDATE CASCADE`).
- **RLS:** `menu_items` — anon solo lee `available = true`. `categories` — anon lee todo. Authenticated (dueño) tiene acceso total a ambas.
- **Variables de entorno frontend:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_TOKEN`
- **Variables de entorno server:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GROQ_API_KEY` (ver `.env.example`)
- **Categorías:** ya NO están hardcodeadas. Se administran (crear/editar/borrar) desde el panel admin vía `useAdminMenu` contra la tabla `categories`. `src/lib/categories.ts` solo exporta el set de emojis del picker (`CATEGORY_ICON_CHOICES`) + `FALLBACK_CATEGORY_ICON`. Borrar una categoría usa flujo de reasignación de items (`CategoryDeleteModal`). El key de cada categoría es un slug inmutable (auto-derivado del label con `toSlug` de `src/lib/slug.ts`).

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
- **La fuente única de verdad de la carta es Supabase** (tablas `menu_items` y `categories`). El frontend la lee con `useMenu`, el bot la lee server-side con `getMenu()` (cache TTL 60s). No existen items ni categorías estáticas — todo se administra desde el panel.
- El panel admin se accede via `?access=TOKEN` (token en `VITE_ADMIN_TOKEN`), nunca hardcodeado.
- Cuando agregues nuevos modales o secciones grandes, considerá `React.lazy()` si solo aplican a un subset de usuarios (ver AdminPanel).
