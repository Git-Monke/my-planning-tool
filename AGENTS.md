# Codebase Overview

## Stack
- **Tauri 2** (Rust backend) + **Svelte 5** (SvelteKit frontend)
- **shadcn-svelte** (Bits UI, Tailwind) — add UI primitives with `npx shadcn-svelte add`; list/catalog in `COMPONENTS.txt` at repo root. Installed code lives under `src/lib/components/ui/`.
- Built with Vite, TypeScript, `adapter-static`
- **Verify builds with `npm run build`** (not `cargo check`) — this catches Svelte/TS type errors and Vite bundling issues. Use `cargo check` only if editing Rust under `src-tauri/`.

## Project Structure

### Frontend (`src/`)
- `routes/+layout.svelte` — **Root app shell:** `SidebarProvider` + collapsible shadcn **Sidebar** (left) wrapped in `sidebar-desktop-hover.svelte` (desktop: expand on **hover** over the sidebar, **instant collapse** on leave; `open` starts **false** / icon mode). **No** top “App” block inside the sidebar—`AppSidebar` is the first child. `SidebarInset` with a **mobile-only** top bar (`SidebarTrigger` + `md:hidden` on the header), main `<slot>`, and an **Agent chat** placeholder column (`ScrollArea` + `Separator`). Imports `../app.css`.
- `routes/+layout.ts` — Enables prerendering & disables SSR
- `routes/+page.ts` — `redirect(303, '/tasks')` for `/`
- `routes/+page.svelte` — Static fallback if redirect is not applied (e.g. prerender edge cases)
- `routes/tasks/+page.svelte` — Tasks page: groups tasks by date (undated → dated). Spacing uses `py-8 px-6` on the outer wrapper.
- `routes/calendar/+page.svelte` — Calendar placeholder (center column)
- `routes/notes/+page.svelte` — Notes placeholder (center column)
- `lib/components/main-nav.svelte` — **Tasks / Calendar / Notes** in the **sidebar** via `SidebarMenu` + `SidebarMenuButton` (and `<a href>` with `child` snippet); each item has a **Lucide icon** (`list-todo`, `calendar`, `file-text`) and **label text hidden when the rail is collapsed** (`group-data-[state=collapsed]:hidden` so the nearest `group` with `data-state` is the shadcn sidebar root). **Tooltips** when the rail is in icon mode; active route from `$app/state` → `page.url.pathname`
- `lib/components/app-sidebar.svelte` — `SidebarContent` with **Navigation** `Group` + `MainNav`
- `lib/components/sidebar-desktop-hover.svelte` — `useSidebar()`; desktop only wraps the `Sidebar` root with `mouseenter` / `mouseleave` → `setOpen` (not used when `isMobile` — mobile uses the `Sheet` sidebar + trigger)
- `lib/components/ui/*` — shadcn-svelte copy-paste components (e.g. `sidebar`, `button`, `card`, `scroll-area`, `separator`, …). **Sidebar** width/collapse motion uses a slightly longer duration and a smooth cubic easing (see `sidebar.svelte` / `sidebar-rail` / `sidebar-group-label`); `motion-reduce` disables the main panel transition.
- `lib/utils.ts` — `cn()` and related helpers used by shadcn
- `app.css` — **Tailwind v4** entry: `@import "tailwindcss"`, then **`@source` glob** over `./**/*` under `src/` so class names in `.svelte` and TS/JS are generated; shadcn theme CSS variables, `tw-animate-css`, `shadcn-svelte/tailwind.css`, Inter. The root **layout** imports this file; do not move global tokens out of `app.css` without updating `@source` if the build stops including utilities.
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
The Tauri `greet` demo has been **removed** from the default view; `/` redirects to **Tasks**; the shell has **Tasks**, **Calendar**, and **Notes** placeholders. Use `AGENTS.md` and `components.json` to extend the shell, add shadcn pieces, and wire real task/calendar/notes/chat features. The README.md includes info about the scope of the project (all features and requirements).
