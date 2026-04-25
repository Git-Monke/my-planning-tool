# Codebase Overview

## Stack
- **Tauri 2** (Rust + SQLite via sqlx) + **Svelte 5** (SvelteKit frontend)
- **shadcn-svelte** (Bits UI, Tailwind) — add UI with `npx shadcn-svelte add`; installed components under `src/lib/components/ui/`
- **Vite** + TypeScript + `adapter-static`
- **Build**: `npm run build` catches Svelte/TS/Vite errors; use `cargo check` only for Rust changes

## Project Structure

### Frontend (`src/`)

| Path | Description |
|------|-------------|
| `routes/+layout.svelte` | Root shell: `SidebarProvider` → hover-expand sidebar → `SidebarInset` → main content + right **Agent chat** column (placeholder). Mobile: `SidebarTrigger` in header |
| `routes/+layout.ts` | Prerender enabled, SSR disabled |
| `routes/+page.ts` | Redirects `/` → `/tasks` |
| `routes/tasks/+page.svelte` | **Task list with infinite scroll** — undated tasks pinned at top, dated tasks grouped by day (today → future), infinite scroll loads 30 days at a time via `IntersectionObserver`, spinner shown during load |
| `routes/calendar/+page.svelte` | **Calendar view** with 1-day/3-day/month toggle (1-day implemented) and task details modal |
| `routes/notes/+page.svelte` | Placeholder |
| `lib/components/calendar/view-toggle.svelte` | Toggle group for switching calendar views |
| `lib/components/calendar/day-view.svelte` | 1-day calendar view with hour grid and configurable time range |
| `lib/components/calendar/task-marker.svelte` | Due-date task marker (thick line + circle) with hover tooltips |
| `lib/components/calendar/task-block.svelte` | Time-blocked task (pastel block positioned by start time/duration) |
| `lib/components/app-sidebar.svelte` | Sidebar content wrapper, contains `MainNav` |
| `lib/components/main-nav.svelte` | **Sidebar nav**: Tasks / Calendar / Notes with Lucide icons (`list-todo`, `calendar`, `file-text`). Labels hidden when collapsed (`group-data-[state=collapsed]:hidden`) |
| `lib/components/main-route-shortcuts.svelte` | **Keyboard shortcuts**: `E` → Tasks, `R` → Calendar, `T` → Notes (disabled when typing in inputs) |
| `lib/components/sidebar-desktop-hover.svelte` | Desktop sidebar: `mouseenter` → expand, `mouseleave` → collapse instantly. Uses `useSidebar()`, disabled on mobile |
| `lib/components/tasks/task-list.svelte` | Renders a task group (Undated/Tomorrow/etc.), contains "New Task" button, sorts by priority |
| `lib/components/tasks/task-item.svelte` | **Individual task**: display mode (double-click to edit) + editing mode (title, notes, priority buttons, time, duration). Checkbox toggles completion, `Shift+Enter` saves |
| `lib/types.ts` | `Task` interface: `id`, `title`, `notes?`, `priority?` (1-3), `due_date?` (YYYY-MM-DD), `due_time?`, `duration?`, `completed`, `created_at`, `updated_at` |
| `lib/utils.ts` | `cn()` helper for className merging |
| `lib/components/ui/*` | shadcn-svelte components (button, input, textarea, checkbox, card, scroll-area, separator, sidebar, sheet, tooltip, skeleton, spinner) |
| `app.css` | **Tailwind v4** entry: `@import "tailwindcss"`, `@source` glob, shadcn theme CSS variables, Inter font. Contains all color tokens (`--background`, `--foreground`, `--sidebar-*`, etc.) |
| `app.html` | HTML shell |

### Backend (`src-tauri/`)

| Path | Description |
|------|-------------|
| `src/main.rs` | Entry point, calls `run()` |
| `src/lib.rs` | **Tauri commands**: `greet`, `get_tasks` (with optional `from_date` filter for pagination), `create_task`, `update_task`, `delete_task`. Database setup in `setup_db()` → SQLite at `{app_data}/nota.db`, runs migrations automatically |
| `tauri.conf.json` | App config (800x600 default), targets |
| `migrations/*.sql` | Database migrations |

### Config

| File | Purpose |
|------|---------|
| `components.json` | shadcn-svelte path aliases |
| `package.json` | npm scripts, deps |
| `vite.config.js` | Vite config |
| `svelte.config.js` | SvelteKit + adapter-static |

## Current Features

- **Tasks**: Full CRUD (create, read, update, delete) with SQLite persistence. Undated tasks always visible at top. Dated tasks grouped by day (today forward), every day shown even if empty. Infinite scroll loads 30 days at a time. Inline editing (double-click), priority levels (1=low/gray, 2=medium/amber, 3=high/red), optional time & duration. Checkbox toggles completion with visual feedback. "New Task" button in each day group creates task with that group's date (2026-04-24).
- **Navigation**: Sidebar with hover-expand on desktop, tooltips when collapsed. Keyboard shortcuts `E`/`R`/`T`.
- **Right panel**: Agent chat placeholder (fixed width, scrollable).
- **Calendar**: 1-day view with configurable hour grid (start/end times). Displays due-date tasks as thick lines with priority-coded colors and time-blocked tasks as pastel blocks. Integrated task detail modal for quick edits and completion toggling. Previous/Next day navigation.
- **Notes**: Empty placeholder (Route exists, no UI yet).

## Theme & Design

- **Colors**: Controlled via CSS variables in `app.css` (shadcn semantic tokens). Default: light mode with soft grays, amber accents for medium priority, red for high.
- **Typography**: Inter (variable font via `@fontsource-variable/inter`).
- **Spacing**: Tasks page uses `py-8 px-6`, max-width centered (`max-w-2xl mx-auto`).
- **Style**: Minimal, square corners (`--radius: 0rem`), clean lines. Adjust `--sidebar-*` tokens for sidebar theming.

## Key Patterns

- **Svelte 5 runes**: `$state`, `$derived`, `$derived.by`, `$effect`, `$props()` with snippets
- **Tauri invoke**: Frontend calls Rust commands via `@tauri-apps/api/core` → `invoke()`
- **SQLite**: sqlx with migrations, managed pool in Tauri state
- **Routing**: SvelteKit file-based (`routes/`)

## Future Work

See `README.md` for full feature scope. Start with Calendar or Notes placeholders, or extend Tasks with date picking, recurrence, subtasks, etc.
