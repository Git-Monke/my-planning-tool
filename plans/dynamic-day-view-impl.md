# Implementation Plan: Dynamic Day View with Multi-Day Support

## Context

The spec in `plans/dynamic-day-view.md` describes refactoring the Day View to support 1, 3, or 7 day configurations. The current implementation has:
- `view-toggle.svelte` with Day/3 Days/Month options (simplify to Day/Month only)
- `day-view.svelte` that only renders a single day
- Calendar `+page.svelte` that manages view state

This plan covers the implementation steps.

---

## Approach

1. **Simplify ViewToggle** to just Day/Month
2. **Add DayCountSwitcher** component for 1/3/7 day sub-options (appears only when Day view is active)
3. **Refactor DayView** to accept `dayCount` prop and render N columns dynamically
4. **Track screen width** in calendar page and bound `dayCount` by 800px breakpoint
5. **Handle date range navigation** (prev/next always moves by 1 day)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/components/calendar/view-toggle.svelte` | Remove "3 Days" option, keep Day/Month |
| `src/lib/components/calendar/day-count-switcher.svelte` | **New** - Sub-switcher for 1/3/7 day selection |
| `src/lib/components/calendar/day-view.svelte` | Accept `dayCount` prop, render N columns |
| `src/routes/calendar/+page.svelte` | Add `dayCount` state, screen width tracking, integrate sub-switcher |

---

## Reuse

- **Utils**: `cn()` from `$lib/utils.ts` for class merging
- **Components**: Existing `Button`, `Spinner`, `TaskBlock`, `TaskMarker` components
- **Icons**: Lucide icons already used (`ChevronLeft`, `ChevronRight`, `Clock`)
- **Types**: `Task`, `TimeBlock` interfaces from `$lib/types.ts`

---

## Steps

### Step 1: Simplify ViewToggle
- [ ] Remove `{ value: "3days", label: "3 Days" }` from the views array
- [ ] Update type to `"day" | "month"`
- [ ] No other changes needed

### Step 2: Create DayCountSwitcher Component
- [ ] Create `src/lib/components/calendar/day-count-switcher.svelte`
- [ ] Accept props: `dayCount` (bindable), `disabled: boolean`
- [ ] Options: 1 Day, 3 Days, 7 Days
- [ ] Show 3/7 as disabled when `disabled=true` (for screen width < 800px)
- [ ] Style matching existing toggle patterns

### Step 3: Refactor DayView Component
- [ ] Update props interface to include `dayCount: number` (default: 1)
- [ ] Compute date range: `selectedDate` through `selectedDate + dayCount - 1` days
- [ ] Create helper function `getDateRange(startDate: string, count: number): string[]`
- [ ] Create helper function `formatColumnDate(dateStr: string): string` (e.g., "Mon 26")
- [ ] Render N columns using `{#each dateRange as dateStr, i}`
- [ ] Each column needs:
  - Date header (formatted as "Mon 26" or "Apr 26")
  - Hour grid (reuse existing hour rendering logic)
  - Time blocks filtered to that specific date
  - Task markers for that date
- [ ] Move `fetchTimeBlocks` logic to support fetching blocks for multiple dates (or fetch per-column)
- [ ] Update navigation: prev/next moves by 1 day (change `selectedDate`, not range)
- [ ] Handle "Today" highlight for the column showing current day

### Step 4: Update Calendar Page
- [ ] Add `dayCount = $state(1)` state
- [ ] Add `screenWidth = $state(1200)` and `isWideScreen = $derived(screenWidth >= 800)`
- [ ] Add resize listener to track `window.innerWidth`
- [ ] Add reactive bound: `if (!isWideScreen && dayCount > 1) dayCount = 1`
- [ ] Add `DayCountSwitcher` to header (only visible when `currentView === "day"`)
- [ ] Pass `dayCount` to `DayView` component
- [ ] Update `handleViewChange` to reset `dayCount = 1` when switching away from day view

---

## Verification

1. **Unit testing**: 
   - `getDateRange("2024-04-28", 3)` returns `["2024-04-28", "2024-04-29", "2024-04-30"]`
   - `getDateRange("2024-12-31", 3)` returns `["2024-12-31", "2025-01-01", "2025-01-02"]` (year boundary)

2. **Manual testing**:
   - Toggle to Day view → verify 1 day by default
   - Click 3 Days → verify 3-column layout renders
   - Click 7 Days → verify 7-column layout renders
   - Shrink browser to < 800px → verify 3/7 disabled, falls back to 1 day
   - Prev/Next navigation → verify moves by 1 day regardless of dayCount
   - Tasks and time blocks → verify only shows for respective column date
