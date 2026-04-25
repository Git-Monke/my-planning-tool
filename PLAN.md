# Plan: Add Tasks with Full CRUD and Inline Editing

## Context

The task page currently displays tasks but has no way to create or edit tasks from the UI. The feature request is to add full CRUD operations (Create, Read, Update, Delete) for tasks using the Tauri backend, with inline editing for all task fields (title, notes, duration, priority).

## Goal

Implement complete task management with a "+ New Task" button on each list, inline editing for all task fields that saves on Enter or blur, and persistence via the Tauri SQLite backend.

## Files to Change

### Backend (Tauri/Rust)
| File | Reason |
|------|--------|
| `src-tauri/src/lib.rs` | Add CRUD commands for tasks (get_tasks, create_task, update_task, delete_task) |

### Frontend (SvelteKit)
| File | Reason |
|------|--------|
| `src/lib/components/tasks/task-list.svelte` | Add "+ New Task" button and `onAddTask` callback |
| `src/lib/components/tasks/task-item.svelte` | Add `editing` mode with inline fields for all task properties |
| `src/routes/tasks/+page.svelte` | Call Tauri commands, handle new task creation |

## Reuse

### Backend
- **sqlx** — already configured for SQLite with pool from app state
- **uuid** — already included for generating task IDs
- **chrono** — already included for timestamps
- **serde** — already configured for JSON serialization

### Frontend
- **`Button`** from `$lib/components/ui/button` — ghost variant for "+ New Task"
- **`Input`** from `$lib/components/ui/input` — for inline editing
- **`Textarea`** — Install via `npx shadcn-svelte@latest add textarea`
- **`cn`** from `$lib/utils` — for class merging
- **`Plus`** icon from `@lucide/svelte/icons/plus` — for button icon
- **Task interface** from `$lib/types` — type for tasks
- **`invoke`** from `@tauri-apps/api/core` — for calling Tauri commands

## Implementation Steps

### Step 1: Add Tauri CRUD commands

**File:** `src-tauri/src/lib.rs`

1. Add `use uuid::Uuid;` import
2. Add `use sqlx::FromRow;` import for Row mapping
3. Create a `TaskRow` struct deriving `FromRow, Serialize` matching the database schema
4. Add `#[tauri::command]` functions:
   - `get_tasks()` — SELECT all tasks ordered by created_at DESC
   - `create_task(title, notes, priority, due_date, due_time, duration)` — INSERT and return new task
   - `update_task(id, title, notes, priority, due_date, due_time, duration, completed)` — UPDATE task
   - `delete_task(id)` — DELETE task by id
5. Register all commands in `invoke_handler`

### Step 2: Add frontend Tauri bindings

**File:** `src/routes/tasks/+page.svelte`

1. Import `invoke` from `@tauri-apps/api/core`
2. Add `load` function that calls `invoke('get_tasks')` to fetch initial tasks
3. Add functions to call each CRUD command:
   - `createTask(taskData)` → `invoke('create_task', { ... })`
   - `updateTask(taskData)` → `invoke('update_task', { ... })`
   - `deleteTask(id)` → `invoke('delete_task', { id })`
4. Replace hardcoded task data with loaded tasks from Tauri

### Step 3: Update TaskItem for full inline editing

**File:** `src/lib/components/tasks/task-item.svelte`

1. Add props:
   - `editing?: boolean = false`
   - `onsave?: (task: Partial<Task>) => void`
2. Add local state for editing:
   - `editTitle`, `editNotes`, `editPriority`, `editDueTime`, `editDuration`
3. When `editing` is true:
   - Show Input for title (auto-focus on mount)
   - Show styled `<textarea>` element for notes (matching Input styling)
   - Show priority selector (3 small buttons: low/medium/high)
   - Show time input for due_time
   - Show number input for duration
   - Shift+Enter saves from any field in the form
   - Blur saves only when clicking outside the form entirely (not when switching between fields)
4. When `editing` is false:
   - Show existing display mode

### Step 4: Update TaskList with "+ New Task" button

**File:** `src/lib/components/tasks/task-list.svelte`

1. Add `onAddTask?: () => void` prop
2. Import `Button` and `Plus` icon
3. Add button at bottom of list:
   ```svelte
   <Button variant="ghost" size="sm" onclick={onAddTask} class="mt-2">
     <Plus class="size-4" />
     New Task
   </Button>
   ```

### Step 5: Wire up new task creation

**File:** `src/routes/tasks/+page.svelte`

1. Add `newTaskId` state to track editing task
2. Add `handleAddTask()` function:
   - Call `createTask()` with empty data via Tauri
   - Set `newTaskId` to the new task's id
   - Set task to editing mode
3. When saving new task:
   - If title empty → delete the task and clear `newTaskId`
   - If title has content → update via `updateTask()` and clear `newTaskId`
4. Pass `newTaskId` to TaskList and TaskItem components

## Verification

1. Run `npm run tauri build` to compile the application
2. Verify no TypeScript or Rust compilation errors
3. Verify the build completes successfully
4. The app can be launched to test manually
