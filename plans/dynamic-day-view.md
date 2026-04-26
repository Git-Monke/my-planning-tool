# Plan: Dynamic Day View with Multi-Day Support

## Overview
Refactor the calendar's Day View to be dynamic — accepting a `dayCount` parameter (1, 3, or 7) — allowing easy addition of new view types. The view toggle simplifies to "Day" / "Month", with a sub-switcher on the Day view for selecting 1/3/7 day configurations.

---

## UI Structure

### View Toggle (top-level)
- Two options: **Day** and **Month**
- Simple toggle group, no sub-options at this level

### Day View Sub-Switcher
- Appears only when "Day" is selected
- Options: **1 Day** | **3 Days** | **7 Days**
- **1 Day**: Always available
- **3 Days**: Available only when `screen width >= 800px`
- **7 Days**: Available only when `screen width >= 800px`
- When screen drops below 800px, fall back to 1 Day view automatically

---

## Component Changes

### 1. `view-toggle.svelte`
- Simplify to just Day/Month options
- Or keep the existing structure and just update labels — either works

### 2. `calendar/+page.svelte`
- Add state for `dayCount` (default: 1)
- Track screen width with `window.matchMedia('(min-width: 800px)')` or a resize listener
- When toggling to "Day" view, preserve the currently selected date as day 1 of the range
- When screen shrinks below 800px, set `dayCount = 1` if it's > 1
- Pass `dayCount` and `selectedDate` to `DayView`

### 3. `day-view.svelte` (refactor)
- Accept props:
  - `selectedDate: string` (YYYY-MM-DD) — the first day in the range
  - `dayCount: number` — number of days to display (1, 3, 7)
- Compute the date range: `selectedDate` through `selectedDate + dayCount - 1` days
- Render N columns (one per day) using `{#each Array(dayCount) as _, i}`
- Each column:
  - Header shows the date (format: "Mon 26" or "Apr 26")
  - Hour grid (same as current 1-day view)
  - Time blocks filtered to that specific date
  - Task markers for tasks due on that date
- Navigation (prev/next):
  - Always moves by 1 day regardless of `dayCount`
  - Updates `selectedDate` (e.g., from 26th → 25th shows 25, 26, 27 for 3-day)

### 4. Responsive Behavior
- `dayCount` state should be bounded by screen width:
  - If user selects 3-day but screen < 800px → auto-switch to 1-day
  - If screen grows to >= 800px → allow 3/7 day again
- Optionally show a tooltip or disabled state on the sub-switcher when an option isn't available

---

## Data Handling

### Time Blocks
- Already filtered by `get_time_blocks(date)` — just pass the column's specific date to each column's fetch
- Or fetch all blocks for the full range once and distribute by date

### Task Markers
- Tasks with `due_date` already filtered — pass each column its matching date
- Same logic as time blocks

---

## Edge Cases

1. **Crossing month boundaries**: 3-day view from April 30 → shows Apr 30, May 1, May 2 — handle date math correctly
2. **Crossing year boundaries**: Dec 31 → Jan 1 — date string parsing should handle this
3. **Screen resize mid-use**: If viewing 3-day and user shrinks window, fall back gracefully to 1-day
4. **Initial load**: Default to 1-day or respect last-used view (optional, can add later)

---

## Files to Modify

1. `src/routes/calendar/+page.svelte` — add `dayCount` state, screen width tracking, sub-switcher UI
2. `src/lib/components/calendar/day-view.svelte` — accept `dayCount` prop, render N columns dynamically
3. `src/lib/components/calendar/view-toggle.svelte` — simplify to Day/Month only (or leave as-is if preferred)

---

## Future Extensibility

- Adding 5-day (weekday) view: just add option to sub-switcher, pass `dayCount = 5`
- Adding 14-day view: same pattern
- The dynamic rendering handles any `dayCount` automatically