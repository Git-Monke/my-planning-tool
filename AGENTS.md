# Project Overview

## Stack
- **Tauri 2** (Rust + SQLite via sqlx) + **Svelte 5** (SvelteKit frontend)
- **shadcn-svelte** (Bits UI, Tailwind) — add with `npx shadcn-svelte add`; components at `src/lib/components/ui/`
- **Vite** + TypeScript + `adapter-static`
- **Build**: `npm run build` for Svelte/TS/Vite; `cargo check` for Rust only

## Frontend Structure (`src/`)

| Path | Description |
|------|-------------|
| `routes/+layout.svelte` | Root shell: `SidebarProvider` → hover-expand sidebar → `SidebarInset` → content + right **Agent chat** column (placeholder). Mobile: `SidebarTrigger` in header |
| `routes/+layout.ts` | Prerender enabled, SSR disabled |
| `routes/+page.ts` | Redirects `/` → `/tasks` |
| `routes/tasks/+page.svelte` | **Task list with infinite scroll** — header bar, undated tasks pinned top, dated tasks grouped by day (today → future), loads 30 days at a time via `IntersectionObserver` |
| `routes/calendar/+page.svelte` | **Calendar view** with 1-day/3-day/month toggle (1-day impl), task modal, time block display |
| `routes/notes/+page.svelte` | **Notes list** with CRUD, search, expand/collapse, debounced auto-save |
| `lib/components/calendar/*.svelte` | view-toggle, day-view (hour grid, configurable range), task-marker (due-date thick line + circle), task-block (time-blocked pastel block) |
| `lib/components/app-sidebar.svelte` | Sidebar content wrapper with `MainNav` |
| `lib/components/main-nav.svelte` | Nav: Tasks / Calendar / Notes with Lucide icons. Labels hidden when collapsed |
| `lib/components/main-route-shortcuts.svelte` | `E` → Tasks, `R` → Calendar, `T` → Notes (disabled in inputs) |
| `lib/components/sidebar-desktop-hover.svelte` | Desktop: `mouseenter` expands, `mouseleave` collapses. Uses `useSidebar()`, disabled on mobile |
| `lib/components/tasks/task-list.svelte` | Renders task group, "New Task" button, sorts by priority |
| `lib/components/tasks/task-item.svelte` | Display mode (double-click edit) / editing mode (title, notes, priority buttons, time, duration). Checkbox toggles completion, `Shift+Enter` saves |
| `lib/types.ts` | `Task`: id, title, notes?, priority? (1-3), due_date? (YYYY-MM-DD), due_time?, duration?, completed, created_at, updated_at. `Note`: id, title, description?, created_at, updated_at. `TimeBlock`: id, task_id, start_date, start_time, duration, created_at, updated_at |
| `lib/ai.svelte.ts` | AI tool definitions and Tauri invoke execution with result logging |
| `lib/utils.ts` | `cn()` helper |
| `lib/components/ui/*` | shadcn-svelte components |
| `app.css` | Tailwind v4 entry (`@import "tailwindcss"`), `@source` glob, shadcn theme CSS vars, Inter font. Contains `--background`, `--foreground`, `--sidebar-*`, etc. |
| `app.html` | HTML shell |

## Backend Structure (`src-tauri/`)

| Path | Description |
|------|-------------|
| `src/main.rs` | Entry point, calls `run()` |
| `src/lib.rs` | **Tauri commands**: `greet`, `get_tasks` (opt `from_date` filter), `create_task`, `update_task`, `delete_task`, `get_notes`, `list_notes` (id+title), `get_note` (by id), `create_note`, `update_note`, `delete_note`, `get_time_blocks` (opt `date` filter), `get_date_range`. Database setup in `setup_db()` → SQLite at `{app_data}/nota.db`, auto-runs migrations |
| `tauri.conf.json` | App config (800x600 default) |
| `migrations/*.sql` | Database migrations |

## Config Files
`components.json` (shadcn aliases), `package.json` (scripts/deps), `vite.config.js`, `svelte.config.js` (SvelteKit + adapter-static)

## Features

- **Tasks**: Full CRUD + SQLite. Undated always top. Dated grouped by day (every day shown). Infinite scroll (30 days). Inline edit (double-click). Priority: 1=low/gray, 2=medium/amber, 3=high/red. Optional time & duration. Checkbox completion. "New Task" creates with group's date.
- **Navigation**: Sidebar hover-expand, tooltips when collapsed. Shortcuts `E`/`R`/`T`.
- **Right panel**: Agent chat placeholder (fixed width, scrollable).
- **Calendar**: 1-day view, configurable hour grid, time blocks from `time_blocks` table, due-date tasks as priority-coded lines, task detail modal with edit/complete, prev/next day nav, internal scroll, sticky date header.
- **Notes**: Full CRUD + SQLite. Searchable, expand/collapse, debounced auto-save, delete with confirmation. Ordered by `updated_at DESC`.

## Theme & Design
Light mode (soft grays), amber/red priority accents. Inter font. Square corners (`--radius: 0rem`). CSS vars in `app.css`.

## Key Patterns
- **Svelte 5 runes**: `$state`, `$derived`, `$derived.by`, `$effect`, `$props()` with snippets
- **Tauri invoke**: `@tauri-apps/api/core` → `invoke()`
- **SQLite**: sqlx with migrations, pool in Tauri state
- **Routing**: SvelteKit file-based (`routes/`)
- Use `cargo sqlx migrate add <name>` for new migrations
