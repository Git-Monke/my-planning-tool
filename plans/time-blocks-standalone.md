# Plan: Time Blocks as Independent Entities

## Goal
Transform time blocks from task-linked entities into fully independent calendar entries with their own properties.

## Changes

### 1. Database Migration (`src-tauri/migrations/`)

Create a new migration `20260425200000_time_blocks_standalone.sql`:

```sql
-- Make time_blocks standalone by adding their own properties
-- Drop the old time_blocks table and recreate with standalone fields

CREATE TABLE time_blocks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,           -- NEW: Own title
    notes TEXT,                    -- NEW: Own notes
    priority INTEGER,              -- NEW: Own priority (1=low, 2=medium, 3=high)
    start_date TEXT NOT NULL,      -- YYYY-MM-DD
    start_time TEXT NOT NULL,      -- HH:MM:SS
    duration INTEGER NOT NULL,     -- minutes
    completed BOOLEAN NOT NULL DEFAULT 0,  -- NEW: Own completion status
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Backend (`src-tauri/src/lib.rs`)

**`TimeBlockRow` struct** - replace current:
```rust
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TimeBlockRow {
    pub id: String,
    pub title: String,           // NEW
    pub notes: Option<String>,    // NEW
    pub priority: Option<i32>,    // NEW
    pub start_date: String,
    pub start_time: String,
    pub duration: i32,
    pub completed: bool,          // NEW
    pub created_at: String,
    pub updated_at: String,
}
```

**`TimeBlockInput` struct** - update input:
```rust
#[derive(Debug, Clone, Deserialize)]
pub struct TimeBlockInput {
    pub title: String,            // REQUIRED now
    pub notes: Option<String>,
    pub priority: Option<i32>,
    pub start_date: String,
    pub start_time: String,
    pub duration: i32,
    pub completed: Option<bool>,
}
```

**Remove `TimeBlockWithTask` struct** - no longer needed (replaced by standalone `TimeBlockRow`)

**`get_time_blocks` command** - simplify to just return `TimeBlockRow` without JOINs

**`create_time_block` / `update_time_block` commands** - update to handle new fields

### 3. Frontend Types (`src/lib/types.ts`)

**`TimeBlock` interface** - update:
```typescript
export interface TimeBlock {
  id: string;
  title: string;              // NEW: Own title (not task_title)
  notes: string | null;       // NEW: Own notes (not task_notes)
  priority: number | null;    // NEW: Own priority (not task_priority)
  start_date: string;
  start_time: string;
  duration: number;
  completed: boolean;          // NEW: Own completion
  created_at: string;
  updated_at: string;
  // Removed: task_id, task_title, task_notes, task_priority, etc.
}
```

### 4. Frontend Components

**`day-view.svelte`** - update time block rendering:
- Remove task object construction from block data
- Pass time block's own `title`, `notes`, `priority`, `completed` to TaskBlock

**`task-block.svelte`** - stays mostly the same, but uses:
- `task.title` (which now comes directly from time block)
- `task.priority` (from time block's own priority)
- `task.completed` (from time block's own completed)
- `task.notes` (from time block's own notes)

### 5. Color Coding (unchanged)

The priority-based pastel colors in `task-block.svelte` already work correctly:
- Priority 3 → rose (red)
- Priority 2 → amber (medium)
- Priority 1 → slate (low)
- No priority → blue (default)

## Implementation Order

1. Create database migration
2. Update backend types and structs
3. Update backend commands (CRUD)
4. Update frontend TypeScript interface
5. Update frontend components to use standalone fields
6. Test the flow

## Notes

- Time blocks are now fully standalone
- No more JOIN with tasks table
- Each time block has its own title, notes, priority, completion status
- Optional: could add `task_id` as nullable field for future linking, but not required for MVP