# Nota — Tasks & Calendar App

Simple, locally-run tasks and calendar app with Svelte 5 + Tauri 2 + Shadcn-Svelte.

![thumbnail](./screenshot.png)

---

## Stack

- **Tauri 2** (Rust + SQLite via sqlx)
- **Svelte 5** (SvelteKit + Vite)
- **shadcn-svelte** (Bits UI, Tailwind v4)
- **Build**: `npm run build`

---

## Features

| View | Description |
|------|-------------|
| **Tasks** | Full CRUD, priority levels (1-3), undated pinned top, dated grouped by day, infinite scroll, inline edit |
| **Calendar** | 1-day view with hour grid, time blocks, due-date markers, task modal |
| **Notes** | CRUD, search, expand/collapse, debounced auto-save |

**Navigation**: Sidebar with hover-expand, shortcuts `E`/`R`/`T`

---

## Data Model

### Tasks
```
id, title, notes?, priority(1-3)?, due_date?, due_time?, duration?, completed, created_at, updated_at
```

### Notes
```
id, title, description?, created_at, updated_at
```

### Time Blocks
```
id, task_id, start_date, start_time, duration, created_at, updated_at
```

---

## Frontend Structure (`src/`)

| Path | Description |
|------|-------------|
| `routes/tasks/+page.svelte` | Task list with infinite scroll |
| `routes/calendar/+page.svelte` | Calendar view (1-day impl) |
| `routes/notes/+page.svelte` | Notes list with CRUD |
| `lib/components/tasks/` | Task list/item components |
| `lib/components/calendar/` | Day view, time blocks, markers |

---

## Backend Structure (`src-tauri/`)

| Path | Description |
|------|-------------|
| `src/lib.rs` | Tauri CRUD commands for tasks, notes, time blocks |
| `migrations/*.sql` | Database migrations |

**Database**: SQLite at `{app_data}/nota.db`, auto-migrates on startup

---

## Build

```bash
# Frontend
npm run dev        # Dev server
npm run build      # Production build

# Backend
cargo check        # Rust only check
cargo sqlx migrate add <name>  # New migration
```

---

## Backup

Data stored in single SQLite file at `{app_data}/nota.db`. Point to Dropbox/iCloud for sync.
