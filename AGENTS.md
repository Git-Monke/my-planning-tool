# Codebase Overview

## Stack
- **Tauri 2** (Rust backend) + **Svelte 5** (SvelteKit frontend)
- **shadcn-svelte** (Bits UI, Tailwind) — add UI primitives with `npx shadcn-svelte add`; list/catalog in `COMPONENTS.txt` at repo root. Installed code lives under `src/lib/components/ui/`.
- Built with Vite, TypeScript, `adapter-static`

## Project Structure

### Frontend (`src/`)
- `routes/+layout.svelte` — **Root app shell:** `SidebarProvider` + collapsible shadcn **Sidebar** (left), `SidebarInset` with header (`SidebarTrigger`, `main-nav` for **Tasks** / **Calendar**), main `<slot>`, and an **Agent chat** placeholder column (`ScrollArea` + `Separator`). Imports `../app.css`.
- `routes/+layout.ts` — Enables prerendering & disables SSR
- `routes/+page.ts` — `redirect(303, '/tasks')` for `/`
- `routes/+page.svelte` — Static fallback if redirect is not applied (e.g. prerender edge cases)
- `routes/tasks/+page.svelte` — Tasks placeholder (center column)
- `routes/calendar/+page.svelte` — Calendar placeholder (center column)
- `lib/components/main-nav.svelte` — `Button` links; active route from `$app/state` → `page.url.pathname`
- `lib/components/app-sidebar.svelte` — Sidebar **content** region (stub; expand with real nav/sections)
- `lib/components/ui/*` — shadcn-svelte copy-paste components (e.g. `sidebar`, `button`, `card`, `scroll-area`, `separator`, …)
- `lib/utils.ts` — `cn()` and related helpers used by shadcn
- `app.css` — Tailwind, shadcn theme CSS variables, Inter
- `app.html` — HTML shell

### Backend (`src-tauri/`)
- `src/main.rs` — Entry point, calls `run()` from lib
- `src/lib.rs` — `run()` function sets up Tauri app (greet command lives here)
- `tauri.conf.json` — App config (800x600 window, all targets)

### Config
- `components.json` — shadcn-svelte (aliases: `$lib/components`, `$lib/components/ui`, …)
- `package.json` — npm scripts, SvelteKit/Tauri dependencies
- `vite.config.js` — Vite configuration
- `svelte.config.js` — SvelteKit/adapter-static setup

### Frontend Design

When working on the frontend, the goal is minimal, clean, square. Colors that are easy on the eyes (pastel browns), but I would just have a theme section so colors and fonts can be easily changed. Inter for the font, since this is mostly information organization it needs to be very legible. **Prefer adjusting semantic tokens in `app.css` (e.g. `--background`, `--sidebar-*`)** to match that direction while staying compatible with shadcn.

## Current State
The Tauri `greet` demo has been **removed** from the default view; `/` and the shell now center on **Tasks** / **Calendar** placeholders. Use `AGENTS.md` and `components.json` to extend the shell, add shadcn pieces, and wire real task/calendar/chat features. The README.md includes info about the scope of the project (all features and requirements).
