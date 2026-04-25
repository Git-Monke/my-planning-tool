# Task Edit/Create Feature Plan

## Goal

Enable users to create new tasks and edit existing task properties (title, notes, due date, duration) via inline editing mode with a "+ New Task" button per list.

---

## Files to Change

| File | Reason |
|------|--------|
| `src-tauri/src/lib.rs` | Add Tauri commands for task CRUD (create, read, update, delete) |
| `src-tauri/src/main.rs` | Add JSON serialization for Task types |
| `src/lib/components/tasks/task-item.svelte` | Add edit mode toggle with form inputs |
| `src/lib/components/tasks/task-list.svelte` | Add "+ New Task" button and new task creation mode |
| `src/routes/tasks/+page.svelte` | Replace mock data with reactive state loaded from backend |
| `src/lib/types.ts` | (Optional) Add helper types if needed |

---

## Implementation Steps

### Step 1: Add Tauri Commands for Task CRUD

**File: `src-tauri/src/lib.rs`**

1. Add `use serde::{Deserialize, Serialize};` imports
2. Create `Task` struct matching the TypeScript interface
3. Add commands:
   - `create_task(pool, title, notes, due_date, due_time, duration, priority) -> Task`
   - `update_task(pool, id, title, notes, due_date, due_time, duration, priority, completed) -> Task`
   - `delete_task(pool, id) -> bool`
   - `get_tasks(pool) -> Vec<Task>`
4. Register commands in `invoke_handler`

### Step 2: Create Task Editing UI in task-item.svelte

**File: `src/lib/components/tasks/task-item.svelte`**

1. Add state: `let editing = $state(false)`
2. Add local edit state: `let editTitle`, `editNotes`, `editDueDate`, `editDueTime`, `editDuration`
3. Add edit mode UI:
   - Replace read-only display with `Input` for title
   - Replace notes paragraph with `Textarea` for notes
   - Add `Input type="date"` for due_date
   - Add `Input type="time"` for due_time
   - Add `Input type="number"` for duration (minutes)
   - Add "Save" and "Cancel" `Button`s
4. Add edit trigger:
   - Add edit button (pencil icon) visible on hover
   - Toggle `editing` on click
   - Initialize edit state from `task` on entering edit mode
5. Add save handler:
   - Validate title is not empty
   - Call Tauri command to update
   - Reset `editing` on success

### Step 3: Add New Task Button and Creation in task-list.svelte

**File: `src/lib/components/tasks/task-list.svelte`**

1. Add `oncreate` callback prop: `let { title, tasks, oncreate }: Props`
2. Add state: `let addingNew = $state(false)`
3. Add "New Task" button:
   - Use `Button variant="ghost"` with Plus icon
   - Position at bottom of task list
   - Toggle `addingNew` on click
4. Add inline new task form (when `addingNew`):
   - Input for title (required)
   - Optional inputs for notes, due_date, due_time, duration
   - "Add" and "Cancel" buttons
5. On "Add":
   - Validate title
   - Call `oncreate` callback with new task data
   - Reset `addingNew`
6. On "Cancel": Reset `addingNew` and clear form

### Step 4: Wire Up Backend in tasks page

**File: `src/routes/tasks/+page.svelte`**

1. Remove mock `tasks` array
2. Add `$effect` to load tasks from Tauri `invoke('get_tasks')` on mount
3. Add helper functions:
   - `loadTasks()` - fetch all tasks
   - `createTask(data)` - create new task, reload list
   - `updateTask(id, data)` - update task, reload list
4. Pass callbacks to TaskList:
   - `oncreate={createTask}` for new task creation

### Step 5: Update Props Flow (Optional Refinement)

**File: `src/lib/components/tasks/task-item.svelte`**

If tasks are reactive from parent, update props to use:
- `let { task, onupdate, ondelete }: Props`
- Call `onupdate` with updated fields after successful backend save

---

## Open Questions

1. **Priority editing**: Should priority be editable via the edit form? The current Task type supports it but the UI doesn't show it. (Decision: include dropdown or keep out of MVP)

2. **Delete functionality**: Should delete be available from the edit form, or only from a context menu/long-press? (Decision: add delete button in edit mode for MVP)

3. **Date picker**: shadcn has both Calendar and Date Picker components. Should we use a popover with calendar for date selection, or keep it simple with native `type="date"` input? (Decision: native input for MVP)

4. **Optimistic updates**: Should UI update immediately before backend confirms, or wait for response? (Decision: wait for response to avoid sync issues)

5. **Error handling**: How should errors (save failed, network issues) be displayed? Toast notification? (Decision: use Sonner toast for errors)
