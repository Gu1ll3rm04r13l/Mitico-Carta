# Mítico · Pizzería & Cocktail Bar

Landing page de alto rendimiento para **Mítico**, pizzería y cocktail bar en Miramar.
Reservas y pedidos por WhatsApp, carta dinámica administrable y un asistente de chat con IA que conoce el menú real en tiempo real.

> Dark mode, acentos cálidos, mobile-first. React 19 + TypeScript estricto.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| Estilos | Tailwind CSS v4 (`@theme {}` en `src/index.css`, sin `tailwind.config.js`) |
| Datos / Auth | Supabase (PostgreSQL + RLS) |
| Chat IA | Groq SDK (`llama-3.3-70b-versatile`) vía proxy server-side |
| Deploy | Vercel (serverless `api/chat.ts`) + Express local para dev |

---

## Setup

```bash
git clone <repo-url>
cd Mitico-Carta
npm install
cp .env.example .env   # completar con valores reales
```

Variables de entorno (ver `.env.example` para detalle):

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Cliente Supabase (frontend + server) |
| `VITE_ADMIN_TOKEN` | Token para acceder al panel admin vía `?access=TOKEN` |
| `GROQ_API_KEY` | Chat IA (server-side) |
| `PORT` / `ALLOWED_ORIGIN` | Proxy Express en dev |

---

## Comandos

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run server   # Proxy Express para Groq (puerto 3001, tsx watch)
npm run dev:all  # Vite + Express en paralelo (concurrently)
npm run build    # Build de producción (incluye type-check)
npm run lint     # ESLint
npm run preview  # Preview del build
```

> El chat IA necesita el server corriendo. Para desarrollo completo usá `npm run dev:all`.

---

## Arquitectura

Single-page (sin router, scroll por anclas). Todo el código vive en `src/`.

```
src/
  components/        Secciones de la landing + panel admin (admin/)
  hooks/             Lógica de reservas, chat, menú y admin
  lib/               Cliente Supabase, time slots, categorías, Excel, precios
  services/ai.ts     sendChatMessage() → /api/chat
  types/index.ts     Interfaces compartidas
server/
  index.ts           Proxy Express para Groq (dev local), importa shared desde ../api/_lib
api/
  chat.ts            Serverless function de Vercel (/api/chat)
  _lib/              Cliente Supabase, cache del menú (TTL 60s), buildPrompt — empaquetado por Vercel
```

### Flujos principales

- **Reserva / Cancelación** → modal → genera mensaje → abre WhatsApp (`wa.me`).
- **Chat / Pedido** → `ChatWidget` envía mensajes a `/api/chat`. El server lee el menú de Supabase (cache 60s), arma el system prompt con precios reales y consulta a Groq. Si la IA emite `[[PEDIDO:...]]`, se genera un link de WhatsApp con el pedido pre-cargado.
- **Admin** → `?access=TOKEN` → login Supabase Auth → panel CRUD de la carta (toggle disponibilidad con optimistic UI, import/export Excel, aumento masivo de precios) y **CRUD de categorías** (crear con emoji picker, editar nombre/icono, borrar reasignando o eliminando sus productos).
- **Menú** → `useMenu()` hace SELECT a Supabase (`available = true`) y agrupa por categoría.

> **Fuente única de verdad de la carta: Supabase.** No hay items estáticos. Cambios en el admin se reflejan en el bot dentro de 60s.

---

## Base de datos

Tabla `menu_items`: `id`, `slug`, `name`, `description`, `price`, `category`, `sort_order`, `available`, `is_signature`, `tags`, `image_url`, `created_at`, `updated_at`.

Tabla `categories`: `key` (PK, slug), `label`, `icon` (emoji), `sort_order`, `created_at`, `updated_at`. Fuente única de las categorías. `menu_items.category` es FK → `categories.key` (`ON DELETE RESTRICT`).

**RLS:** `menu_items` — anon solo lee `available = true`. `categories` — anon lee todo. El usuario autenticado (dueño) tiene acceso total a ambas.

Las categorías se administran desde el panel (no están hardcodeadas). El seed inicial: `entradas`, `cervezas`, `cocteles`, `vinos`, `sin-alcohol`, `pizzas`, `postres`, `sandwiches`, `panchos`, `empanadas`, `ensaladas`.

---

## Convenciones

- **Mobile-first**: todo funciona a 375px antes de agregar `md:` / `lg:`.
- Tokens de diseño en `src/index.css` (`@theme`). Preferir clases Tailwind sobre estilos inline.
- Secciones grandes que aplican a un subset de usuarios → `React.lazy()` (ver `AdminPanel`).
- `WHATSAPP_NUMBER` y `buildWhatsAppUrl()` viven en `hooks/useReservation.ts`.

---

## Deploy

Pensado para **Vercel**: el frontend se sirve estático y `api/chat.ts` corre como serverless function.
Configurar las variables de entorno en el dashboard de Vercel (mismas que `.env`, con `ALLOWED_ORIGIN=https://mitico.bar`).
