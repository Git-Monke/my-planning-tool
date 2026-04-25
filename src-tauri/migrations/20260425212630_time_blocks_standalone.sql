-- Make time_blocks standalone with their own properties
-- Drop and recreate to change schema from task-linked to standalone

DROP TABLE IF EXISTS time_blocks;

CREATE TABLE time_blocks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    priority INTEGER,
    start_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
