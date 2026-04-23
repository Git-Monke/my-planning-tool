# Nota — App Spec

Simple AI-powered notes, tasks, and calendar. Desktop app. Fast. Local-first.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Tauri |
| Frontend | Svelte + Vite |
| Backend | Rust |
| Database | SQLite via SQLx |
| AI | Groq API Default (BYOK) |
| Model | Llama 3.3 70B or similar fast/cheap model |

---

## Data Model

### Notes

```
id           UUID
title        TEXTVite 
body         TEXT
created_at   DATETIME
updated_at   DATETIME
```

### Tasks

```
id           UUID
title        TEXT
notes        TEXT (optional) // This does not reference the other table, these are notes FOR THIS TASK
priority     INTEGER (1–3, low medium high, optional)
due_date     DATE (optional)
due_time     TIME (optional)
start_time   DATETIME (optional)  ← set when time-blocked
duration     INTEGER (minutes, optional)
completed    BOOLEAN
created_at   DATETIME
updated_at   DATETIME
```

**Task states:**
- **Unscheduled** — no `start_time`, lives in task list only
- **Scheduled** — has `due_date`, `due_time`, shows as a note in the calender box (monthly view) or a line for the day (3 day / week view), or at the top of the day (if no due time is set), very easy to see 
- **Time-Blocked** — has `start_time` + `duration`, shows as time block on calendar, not as intense as a scheduled task. 

Calendar view is just a query: all tasks where `due_date` is set OR `start_time` is set. No separate event model. Due dates should be very visible, time blocks should stand out less. Ex. due dates use strong colors, time blocks use pastels

---

## Views

### Notes
- Left sidebar: list of notes, sorted by `updated_at`
- Right panel: editor (plain text or basic markdown)
- iPhone Notes-style — simple, no clutter

### Tasks
- Flat list, sorted by priority then due date
- "Unscheduled" section to the left 
- "Scheduled" section to the right 
- Checkbox to mark complete
- Inline edit for quick changes

### Calendar
- Toggle between **3-day**, **week**, and **month** views
- Tasks with `start_time` + `duration` render as time blocks
- Tasks with only `due_date`/`due_time` show as markers. Show at top if no due time, show inline if they have a due time. 
- Click a block to open the task.
- Time blocks are pastel, due dates are strong and full colors.

---

## AI Layer

### How it works
1. User types a message in the AI chat panel
2. Frontend builds context: all notes (summarized if large), all tasks, today's date
3. Request sent to Groq API with tools defined
4. LLM returns tool calls and/or a text response
5. Frontend executes tool calls → invokes Tauri Rust commands to mutate SQLite
6. Results fed back to LLM if loop needed (e.g. failed tool call, follow-up needed like questions about time)
7. Final response displayed in chat

API calls made from the frontend. Rust handles data only. API key stored via Tauri's secure storage.

### Tools

```
create_note(title, body)
update_note(id, title?, body?)
delete_note(id)

create_task(title, notes?, priority?, due_date?, due_time?, duration?)
update_task(id, ...fields)
schedule_task(id, start_time, duration)
complete_task(id)
delete_task(id)
```

### Example interactions

- *"Add a task to finish the auth module by Friday"*
  → `create_task("Finish auth module", due_date: "Friday")`

- *"Today I want to work on the auth module and finish my essay"*
  → AI sees those tasks from context, asks for missing info (start time, durations if not set etc), then calls `schedule_task` for each

- *"What should I work on first?"*
  → AI reasons over task list (priority, due dates, durations) and gives a recommendation. No tool call needed.

- *"Paste in my notes from this meeting"*
  → `create_note(title: "Meeting Notes – [date]", body: ...)`

---

## Backup / Export

- All data lives in a single SQLite file in a user-chosen directory. Dir is set to a sensible default.
- User can point that directory at Dropbox, iCloud, etc. — sync is their problem
- No cloud, no accounts, no sync built-in

---

## Build Order

1. **Rust data layer** — SQLite schema, SQLx queries, Tauri commands for CRUD
2. **Svelte shell** — three views wired to real data, no AI yet
3. **AI chat panel** — context builder, Groq API call, tool execution loop
4. **Polish** — keyboard shortcuts, settings page (API key entry), backup/export

---

## Out of Scope (for now)

- Recurring tasks
- Subtasks
- Collaboration / sharing
- Mobile
- Cloud sync
- Notifications / reminders (OS-level, add later via Tauri)
