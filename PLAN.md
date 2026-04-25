# Calendar Page Scrolling Fix Plan

## Context

The calendar page on `/calendar` exhibits unwanted whole-page scrolling. The structural view should be fixed (not scroll), with only the day view's time grid scrolling internally. This issue was introduced when the app shell was built with `overflow-auto` on the children wrapper in the layout.

## Root Cause

In `src/routes/+layout.svelte`, line 34, the children wrapper has:
```svelte
<div class="... overflow-auto p-0">
  {@render children()}
</div>
```

The `overflow-auto` creates a scrollable container. When the calendar content (including the day view's time grid) exceeds the available viewport height, this wrapper scrolls the entire page instead of:
- Keeping the calendar header fixed
- Scrolling only within the day view's time grid (which has `overflow-y-auto`)

## Approach

Change `overflow-auto` to `overflow-hidden` on the children wrapper in the layout. This will:
1. Prevent whole-page scrolling
2. Allow height constraints to propagate properly to the calendar page (`h-full`)
3. The day view's internal time grid will still scroll via its own `overflow-y-auto`

## Files to Modify

| File | Change |
|------|--------|
| `src/routes/+layout.svelte` | Change `overflow-auto` to `overflow-hidden` on the children wrapper div |

## Implementation Steps

- [ ] **Step 1:** In `src/routes/+layout.svelte`, locate the div wrapping `{@render children()}` (line 34)
- [ ] **Step 2:** Change `class="min-h-0 min-w-0 flex-1 overflow-auto p-0"` to `class="min-h-0 min-w-0 flex-1 overflow-hidden p-0"`

## Verification

1. Navigate to `/calendar` on desktop viewport
2. Verify the calendar header (title + view toggle) stays fixed
3. Verify the day view's time grid scrolls internally when content exceeds viewport
4. Verify the entire page cannot be scrolled up/down
5. Test on mobile viewport to ensure no regression with the mobile header toggle
6. Test the agent chat panel on the right side (should still scroll independently)
