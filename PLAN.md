# Calendar View Implementation Plan

## Context

The user wants to build a calendar view that displays tasks from the existing task data model. According to the README, the calendar should:
- Support multiple views (3-day, week, month) with toggle buttons
- Show tasks with `start_time` + `duration` as time blocks (pastel colors)
- Show tasks with `due_date`/`due_time` as markers (strong colors)
- Clicking a block should open the task

**Scope for this iteration**: Build the calendar page skeleton with view toggle buttons (1-day, 3-day, 30-day) and fully implement only the **1-day view**.

**Available shadcn-svelte components to use**:
- Toggle/Toggle Group — for view switcher buttons
- Tooltip — for hover info on task markers
- Input — for time range settings
- Card — for containers
- Spinner — for loading states

---

## Goal

Create a functional calendar page at `/calendar` that displays tasks in a day view, with working toggle buttons for future 3-day and monthly views.

---

## Files to Change

| File | Reason |
|------|--------|
| `src/routes/calendar/+page.svelte` | Replace placeholder with full calendar implementation |
| `src/lib/components/calendar/day-view.svelte` | **New** — Component for the 1-day view layout with configurable time range |
| `src/lib/components/calendar/task-block.svelte` | **New** — Component for rendering time-blocked tasks (pastel) |
| `src/lib/components/calendar/task-marker.svelte` | **New** — Component for rendering due-date tasks as thick lines with outlined circles, with tooltip on hover |
| `src/lib/components/calendar/view-toggle.svelte` | **New** — Component for 1-day/3-day/monthly view toggle buttons |

---

## Reuse

- **Task type**: `import type { Task } from "$lib/types.js"` — already defined
- **Tauri invoke**: `await invoke<Task[]>("get_tasks", { fromDate })` — existing backend command
- **Button component**: `$lib/components/ui/button` — existing shadcn-svelte component
- **Card component**: `$lib/components/ui/card` — existing for potential container styling
- **Icons from lucide**: `ChevronLeft`, `ChevronRight` for navigation arrows
- **Spinners**: `$lib/components/ui/spinner` — for loading states

---

## Implementation Steps

### Step 1: Create the view toggle component
- [x] Create `src/lib/components/calendar/view-toggle.svelte`
- [x] Three buttons: "Day", "3 Days", "Month"
- [x] Accept `currentView` and `onViewChange` props
- [x] Use button variant styling for active/inactive states

### Step 2: Create the task-marker component (due dates)
- [x] Create `src/lib/components/calendar/task-marker.svelte`
- [x] Render as a thick horizontal line with an outlined circle at the left edge
- [x] Position inline at the `due_time` if set, or at top of view if no time
- [x] Use shadcn-svelte **Tooltip** component on hover showing task details
- [x] If multiple tasks have the same due time, aggregate them in the tooltip
- [x] Accept `task`, `onClick` props

### Step 3: Create the task-block component (time blocks)
- [x] Create `src/lib/components/calendar/task-block.svelte`
- [x] Position based on `start_time` + calculate end time from `duration`
- [x] Pastel styling (light background, subtle border)
- [x] Accept `task`, `dayStartHour`, `hourHeight`, and `onClick` props

### Step 4: Create the day-view component
- [x] Create `src/lib/components/calendar/day-view.svelte`
- [x] Show hour grid with configurable start/end times (default 6 AM to 10 PM)
- [x] Add time range inputs at the top: two Input fields for start time and end time (e.g., "06:00", "22:00")
- [x] Render time blocks from tasks with `start_time` + `duration`
- [x] Render due date markers inline at their `due_time` or at top if no time
- [x] Accept `date` (YYYY-MM-DD string), `tasks` array, `onClick` callback
- [x] Navigation: previous/next day chevron buttons

### Step 5: Update the calendar page
- [x] Replace placeholder content in `src/routes/calendar/+page.svelte`
- [x] Import and use `ViewToggle`, `DayView`
- [x] Add state for: `selectedDate`, `currentView`
- [x] Fetch tasks for the selected date range (today for day view)
- [x] Implement previous/next day navigation
- [x] Filter tasks by selected date
- [x] Handle view switching (stub out 3-day and monthly for now)
- [x] Add task detail modal with edit capability (checkbox, title, notes, priority, time)

### Step 6: Add styling
- [x] Ensure hour grid has consistent spacing
- [x] Add responsive considerations (mobile may need simplified view)
- [x] Use CSS variables or Tailwind classes for theming
- [x] Build verification passed

---

## Open Questions

1. **Task interaction**: When clicking a task block/marker, should it open a modal, expand inline, or navigate to the task edit view in the Tasks page?

2. **Color palette**: Should we use priority-based colors (high=red, medium=orange, low=blue) or a consistent brand color for due dates?

*(Other questions resolved: hour range is user-configurable via inputs, due time tasks are inline with tooltips)*

---

## Verification

1. Run `npm run build` to verify no build errors
2. Manual testing:
   - Navigate to `/calendar`
   - Verify the view toggle buttons appear and switch between views
   - Verify 1-day view shows today's date and hour grid
   - Verify time range inputs allow changing the visible hours
   - Create a task with a `due_date` for today → verify it appears as a thick line with circle
   - Hover over a due date line → verify tooltip shows task info
   - Create a task with `start_time` and `duration` → verify it appears as a time block
   - Click previous/next arrows → verify date navigation works
