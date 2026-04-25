-- Time blocks table: represents scheduled time slots on the calendar
CREATE TABLE IF NOT EXISTS time_blocks (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL,  -- Links to parent task
    start_date TEXT NOT NULL,  -- YYYY-MM-DD
    start_time TEXT NOT NULL,  -- HH:MM:SS
    duration INTEGER NOT NULL,  -- minutes
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
