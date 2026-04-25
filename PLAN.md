# Implementation Plan: Infinite Scroll Tasks List

## Goal

Modify the tasks list to show undated tasks pinned at the top, followed by one section per day starting from today moving forward, with infinite scroll that loads more future days as the user approaches the bottom.

## Context

Currently, the tasks page (`src/routes/tasks/+page.svelte`) loads ALL tasks at once and displays them in two groups: undated and dated (sorted by date). The backend (`src-tauri/src/lib.rs`) has a single `get_tasks` endpoint with no pagination.

## Files to Change

1. **`src-tauri/src/lib.rs`** - Add pagination support to `get_tasks` endpoint with `from_date` parameter to fetch tasks from a specific date onward
2. **`src/routes/tasks/+page.svelte`** - Implement infinite scroll using IntersectionObserver, only load dated tasks progressively starting from today
3. **`src/lib/components/tasks/task-list.svelte`** (optional) - May need minor adjustments for scroll behavior

## Approach

1. **Backend Pagination**: Modify `get_tasks` to accept an optional `from_date` parameter (ISO date string). If provided, only return tasks where `due_date >= from_date`. This allows fetching dated tasks in chunks.

2. **Frontend Infinite Scroll**: Use native `IntersectionObserver` API with a sentinel element at the bottom of the dated tasks list. When the sentinel becomes visible, fetch the next chunk of days.

3. **Day-Based Loading**: Track the "furthest date loaded" and request tasks from today up to a point beyond current viewport (e.g., load 30 days at a time).

4. **Keep Undated Separate**: Undated tasks continue to load on mount as before; only dated tasks use infinite scroll.

## Implementation Steps

- [x] **Backend: Modify `get_tasks` endpoint**
  - Add `from_date: Option<String>` parameter to command
  - When `from_date` is provided, add `WHERE due_date >= ?` clause to query
  - Order results by `due_date ASC` for pagination
  - Only return tasks where `due_date >= today` (exclude past dates)

- [x] **Frontend: Add state for pagination**
  - Add `loadedDaysUpTo` state (default: today + 30 days)
  - Add `isLoadingMore` state for scroll loading indicator
  - Add `hasMoreDays` state when no more days to load

- [x] **Frontend: Create intersection observer**
  - Create a sentinel `<div>` element at bottom of dated tasks section
  - Initialize `IntersectionObserver` that triggers when sentinel is visible
  - On intersection: extend `loadedDaysUpTo` and fetch new tasks

- [x] **Frontend: Fetch tasks incrementally**
  - Initial load: undated tasks + dated tasks up to 30 days from today
  - On scroll trigger: fetch tasks up to next 30-day chunk
  - Append new tasks to existing dated groups

- [x] **Frontend: Update dated group filtering**
  - Filter dated tasks to only show those within `loadedDaysUpTo` range
  - Filter out any tasks with `due_date < today` (past dates)
  - Sort groups chronologically (today first)
  - Show empty date groups for days without tasks (users can add tasks)

- [x] **Frontend: Add loading indicator**
  - Run `npx shadcn-svelte@latest add spinner` to add spinner component
  - Show spinner when `isLoadingMore` is true
  - Position at bottom of dated tasks section

## Reuse

- **Svelte 5 reactivity**: Use `$state`, `$derived`, and `$derived.by` (already used in the codebase)
- **TypeScript types**: `Task` interface already defined in `src/lib/types.ts`
- **Tauri invoke**: Use existing `invoke<Task[]>("get_tasks")` pattern
- **bits-ui components**: Continue using existing button variants
- **Tailwind CSS**: Use existing utility classes for layout/styling

## Clarifications (from user feedback)

- **Chunk size**: 30 days per fetch (confirmed)
- **Past-dated tasks**: Only show tasks with future due dates (exclude past dates entirely)
- **Loading indicator**: Use spinner via `npx shadcn-svelte@latest add spinner`
- **Date gaps**: Show every day in the list, even if empty (for creating tasks on specific days)
