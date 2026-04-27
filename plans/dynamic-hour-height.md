# Dynamic Hour Height in Day View

## Problem
Currently, day-view.svelte uses a fixed `hourHeight = 60px`, only showing the selected hour range (e.g., 6AM-10PM). This means:
- Only hours within the range are rendered
- No scrolling to see other hours
- No context of the full day

## Desired Behavior
- Show all 24 hours (0-23)
- Selected range fills the available screen space perfectly
- All hours have equal proportional height
- Auto-scroll to startHour on load
- "Recenter" button to return to startHour
- Everything positioned at its corresponding time (markers outside range visible at edges)

## Math

**Key insight:** The math works out perfectly.

If we set `hourHeight = availableHeight / 24`, then:
- Total container height = `24 * hourHeight = availableHeight` ✓
- Selected range fills available space = `(endHour - startHour + 1) * hourHeight = (17/24) * availableHeight` ✓

**Why?** Because `(endHour - startHour + 1) / 24` equals the fraction of the day the range represents.

## Implementation

### 1. Calculate `availableHeight` dynamically
```svelte
let containerEl = $state<HTMLElement | null>(null);
let availableHeight = $derived(containerEl?.clientHeight ?? 600);
let hourHeight = $derived(availableHeight / 24);
```

### 2. Total container height
```svelte
style="height: {24 * hourHeight}px;"
```

### 3. Generate all 24 hours
```svelte
const hours = $derived.by(() => {
  return Array.from({ length: 24 }, (_, i) => i); // 0-23
});
```

### 4. Position calculations (unchanged formula)
```svelte
// Works the same - times are in 24hr scale
function getTopOffset(time: string | undefined): number {
  const minutes = timeToMinutes(time);
  return (minutes / 60) * hourHeight;
}
```

### 5. Auto-scroll on mount
```svelte
onMount(() => {
  if (containerEl) {
    // Scroll to startHour position
    containerEl.scrollTop = startHour * hourHeight;
  }
});
```

### 6. "Recenter" button
Add a floating button in the corner that:
- Calls `containerEl.scrollTop = startHour * hourHeight`
- Maybe fades/hides when already at the right position

### 7. Hour labels (optional de-emphasis for off-hours)
Could add styling distinction for hours 0-5 and 23:
```svelte
class={cn(
  "text-[10px] text-muted-foreground/60 px-1",
  (hour === 0 || hour === 23) && "text-muted-foreground/40"
)}
```

## Files to Modify

### `src/lib/components/calendar/day-view.svelte`
- Add `bind:this={containerEl}` to scrollable container
- Add `availableHeight` derived from container client height
- Add `hourHeight` derived as `availableHeight / 24`
- Change `hours()` to return all 24 hours
- Change `{(endHour - startHour + 1) * hourHeight}` to `{24 * hourHeight}` (total container)
- Update scroll logic in `$effect` for date changes
- Add "Recenter" button component
- Update `hours()` to show all hours with consistent positioning

### Hour line positioning
```svelte
{#each hours() as hour, i}
  <div
    class="absolute left-0 right-0 border-t border-border/50"
    style="top: {i * hourHeight}px;"
  >
```

## Current Time Indicator
Updates needed:
```svelte
{#if thisIsToday}
  {@const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()}
  {@const topOffset = (nowMinutes / 60) * hourHeight}  // Changed: removed startMinutes offset
  <!-- Now the indicator shows at the correct absolute position -->
```

## Task Markers
Positioning works unchanged since it uses `getTopOffset(time)` which now returns absolute position in the 24-hour grid.

## Scroll Behavior
- Container has `overflow-y-auto`
- Default scroll position: top (hour 0)
- On mount: `scrollTop = startHour * hourHeight`
- "Recenter" button: `scrollTop = startHour * hourHeight`

## Edge Cases
- Container not rendered yet: use fallback height (600px)
- Window resize: `$effect` should recalculate via `$derived`
- Very small screens: hour height could get small, consider minimum height
