# Notes Backend Persistence Plan

## Context
The notes page (`src/routes/notes/+page.svelte`) currently uses hardcoded sample data with no backend persistence. Tasks already have full CRUD operations backed by SQLite. We need to add the same persistence for notes.

## Approach
1. **Database**: Create a `notes` table migration (mirrors the `Note` TypeScript interface)
2. **Backend (Rust)**: Add CRUD commands for notes using the existing SQLx + SQLite pattern
3. **Frontend (Svelte)**: 
   - Fetch notes on mount using `invoke("get_notes")`
   - Create notes using `invoke("create_note", { input })`
   - Update notes using `invoke("update_note", { id, input })`
   - Delete notes using `invoke("delete_note", { id })`

## Files to Modify

### Backend (Rust)
| File | Changes |
|------|---------|
| `src-tauri/src/lib.rs` | Add NoteRow/NoteInput structs, CRUD commands |
| `src-tauri/migrations/` | New migration for notes table |

### Frontend (Svelte)
| File | Changes |
|------|---------|
| `src/routes/notes/+page.svelte` | Fetch on mount, persist on create/update/delete |

## Reuse
- **Backend pattern**: Use existing task CRUD in `lib.rs` as template (get_tasks, create_task, update_task, delete_task)
- **Database connection**: Reuse existing `setup_db()` which creates `SqlitePool` and runs migrations
- **Frontend pattern**: Use `invoke()` from `@tauri-apps/api/core` as seen in `tasks/+page.svelte`

## Steps

### Backend
1. [ ] Create migration: `src-tauri/migrations/<timestamp>_create_notes_table.sql`
   - Columns: `id TEXT PRIMARY KEY`, `title TEXT NOT NULL`, `description TEXT`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`

2. [ ] Add to `lib.rs`:
   - `NoteRow` struct (mirrors `TaskRow`)
   - `NoteInput` struct (mirrors `TaskInput`)
   - `get_notes()` command - returns all notes ordered by `updated_at DESC`
   - `create_note()` command - inserts note, returns created row
   - `update_note()` command - updates note, returns updated row
   - `delete_note()` command - deletes note by id
   - Register all commands in `invoke_handler`

### Frontend
3. [ ] Update `notes/+page.svelte`:
   - Import `invoke` from `@tauri-apps/api/core`
   - Replace hardcoded `notes` array with empty `$state` 
   - Add `onMount` to fetch notes from backend
   - Update `addNewNote()` to call `invoke("create_note")` and add returned note to state
   - Update `updateNote()` to debounce and call `invoke("update_note")`
   - Add `deleteNote()` function and hook it up (e.g., right-click or delete button)

## Verification
1. Run `cargo build` in `src-tauri` to verify Rust compiles
2. Run `npm run dev` and test:
   - Notes load on page open
   - Creating a note persists it to the database
   - Editing a note title/description persists
   - Deleting a note removes it permanently
