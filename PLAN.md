# Time Block Extraction Plan

## Context

Currently, time blocks are stored within the `tasks` table using `start_time` + `duration` fields. This conflates two concepts:
- **Tasks**: Work items with title, notes, priority, due dates
- **Time Blocks**: Scheduled time slots on the calendar

A single task can have multiple time blocks (e.g., "Write essay" might have 3 one-hour blocks across different days). The current model doesn't support this well. This plan extracts time blocks into their own table.

## Approach

1. Create a new `time_blocks` table with its own identity
2. Add Rust backend read operations for time blocks
3. Add TypeScript frontend type
4. Modify `DayView` to fetch and display time blocks as distinct entities
5. Remove `start_time` from tasks table (as per user feedback: "keep duration though")

## Files Modified

### Backend (`src-tauri/`)
- `migrations/20260425195831_create_time_blocks_table.sql` — new migration
- `migrations/20260425195913_drop_task_start_time_column.sql` — remove start_time from tasks
- `src/lib.rs` — added `TimeBlockRow` struct, `get_time_blocks` command, removed `start_time` from `TaskRow`

### Frontend (`src/`)
- `lib/types.ts` — added `TimeBlock` interface
- `lib/components/calendar/day-view.svelte` — fetches and renders time blocks from new table

## Reuse

- Existing calendar styling and layout in `day-view.svelte`
- SQLx migration patterns from existing migrations
- Tauri command patterns from existing CRUD commands
- `$effect` pattern for reactive data fetching

## Steps

- [x] **Step 1**: Create migration `20260425195831_create_time_blocks_table.sql`
  - `id` TEXT PRIMARY KEY
  - `task_id` TEXT NOT NULL (FK to tasks.id)
  - `start_date` TEXT NOT NULL (YYYY-MM-DD)
  - `start_time` TEXT NOT NULL (HH:MM:SS)
  - `duration` INTEGER NOT NULL (minutes)
  - `created_at` TEXT
  - `updated_at` TEXT

- [x] **Step 2**: Add Rust types and command in `src-tauri/src/lib.rs`
  - `TimeBlockRow` struct matching the DB row
  - `get_time_blocks(date: Option<String>)` — returns time blocks for a given date (or all if no filter)
  - Created migration `20260425195913_drop_task_start_time_column.sql` to remove `start_time` from tasks
  - Registered command in `.invoke_handler()`

- [x] **Step 3**: Add `TimeBlock` type to `src/lib/types.ts`
  - Mirror the Rust struct fields

- [x] **Step 4**: Update `DayView` component
  - Import `TimeBlock` type and `invoke`
  - Fetch time blocks on date change (via `$effect`)
  - Render time blocks as simple blocks with duration info and time label
  - Reuses existing calendar styling

- [x] **Step 5**: Update calendar page
  - No changes needed — DayView handles time blocks internally

## Verification

1. ✅ `cargo check` in `src-tauri/` — Rust compiles
2. ✅ `npm run build` — TypeScript/Svelte compiles
3. Manual test: Start app, navigate to Calendar, manually insert time blocks to verify rendering

## Future Work (Out of Scope)

- UI to create/edit/delete time blocks
- Linking time blocks to parent tasks in the UI for click-to-open-task functionality
- 3-day and month views
