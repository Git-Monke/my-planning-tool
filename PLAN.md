# Plan: Tasks Page UI

Add a new UI for the tasks page that displays undated tasks at the top, followed by tasks grouped by day, sorted by priority.

## Context

The user wants a minimal but functional tasks page. Undated tasks are listed first, then tasks for each day starting from the closest date. Within each list, tasks are sorted by priority (High > Medium > Low).

## Approach

1.  **Define Types**: Create a `Task` interface based on the database schema.
2.  **Add Shadcn Components**: Add `Checkbox` to `src/lib/components/ui/`.
3.  **Dummy Data**: Create a comprehensive set of dummy tasks.
4.  **Data Processing**: Implement logic to group tasks by date and sort them (Priority > Time).
5.  **UI Components**: 
    -   Use `Card` components for task lists.
    -   Create a `TaskItem` component.
    -   Priority-based coloring applied to the **Checkbox**.
6.  **Layout**: Ensure a clean, minimal look with compact but visible notes.

## Files to modify

-   `src/routes/tasks/+page.svelte`
-   `src/lib/types.ts` (New)
-   `src/lib/components/tasks/task-item.svelte` (New)
-   `src/lib/components/tasks/task-list.svelte` (New)
-   `src/lib/components/ui/checkbox/` (New)

## Reuse

-   `src/lib/components/ui/card/`
-   `lucide-svelte`

## Steps

- [ ] **Add Checkbox Component**: Add `src/lib/components/ui/checkbox/` components. [DONE:1]
- [ ] **Define Task Interface**: Add the `Task` interface to a new file `src/lib/types.ts`. [DONE:2]
- [ ] **Create TaskItem Component**: 
    - Create `src/lib/components/tasks/task-item.svelte`.
    - Implement the layout: Checkbox (colored by priority: Red=3, Amber=2, Gray=1), Title, Notes (compact), Time/Duration info. [DONE:3]
- [ ] **Create TaskList Component**:
    - Create `src/lib/components/tasks/task-list.svelte`.
    - Render a `Card` for each group. [DONE:4]
- [ ] **Implement Sorting and Grouping Logic**:
    - In `src/routes/tasks/+page.svelte`, implement logic to group by date and sort by priority. [DONE:5]
- [ ] **Populate Dummy Data**: Add various tasks to test the layout. [DONE:6]
- [ ] **Update Tasks Page**: Render the lists. [DONE:7]
- [ ] **Verification**: Run `npm run check`. [DONE:8]

## Verification

- [ ] Run `npm run check`.
