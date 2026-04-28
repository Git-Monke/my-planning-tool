<script lang="ts">
  import type { Task, TimeBlock } from "$lib/types";
  import { Button } from "$lib/components/ui/button";
  import TaskMarker from "./task-marker.svelte";
  import TaskBlock from "./task-block.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { invoke } from "@tauri-apps/api/core";
  import { Spinner } from "$lib/components/ui/spinner";
  import { chatState } from "$lib/ai.svelte.js";
  import { onMount, tick } from "svelte";

  let {
    date,
    dayCount = 1,
    tasks = [],
    savedScrollTop,
    onDateChange,
    onTaskClick,
    onScrollTopChange,
  }: {
    date: string; // YYYY-MM-DD - the first day in the range
    dayCount?: number;
    tasks?: Task[];
    /** When set, restores vertical scroll (px). When unset, opens at 6:00 AM. */
    savedScrollTop?: number;
    onDateChange?: (date: string) => void;
    onTaskClick?: (task: Task) => void;
    onScrollTopChange?: (scrollTop: number) => void;
  } = $props();

  // Current time state for real-time indicator
  let currentTime = $state(new Date());

  // Timer for real-time updates (every 30 seconds)
  $effect(() => {
    const interval = setInterval(() => {
      currentTime = new Date();
    }, 30000);
    return () => clearInterval(interval);
  });

  const hourHeight = 60;
  const MINUTES_PER_DAY = 24 * 60;
  const DEFAULT_SCROLL_TOP = 6 * 60;

  let gridScrollEl = $state<HTMLDivElement | null>(null);
  let scrollPersistTimer: ReturnType<typeof setTimeout> | null = null;
  let scrollRestored = $state(false);
  let suppressScrollPersist = $state(true);

  function handleGridScroll() {
    if (!gridScrollEl || !onScrollTopChange || suppressScrollPersist) return;
    if (scrollPersistTimer) clearTimeout(scrollPersistTimer);
    scrollPersistTimer = setTimeout(() => {
      onScrollTopChange?.(gridScrollEl!.scrollTop);
      scrollPersistTimer = null;
    }, 150);
  }

  // Apply saved or default (6 AM) scroll once the scroller is bound
  $effect(() => {
    if (scrollRestored || !gridScrollEl) return;
    scrollRestored = true;
    const el = gridScrollEl;
    const y = savedScrollTop !== undefined ? savedScrollTop : DEFAULT_SCROLL_TOP;
    suppressScrollPersist = true;
    tick().then(() => {
      requestAnimationFrame(() => {
        el.scrollTop = y;
        setTimeout(() => {
          suppressScrollPersist = false;
        }, 200);
      });
    });
  });

  // Shift + wheel on day grid: change range start by one day per event (chevrons).
  // Positive dominant delta (e.g. scroll down) → previous day.
  $effect(() => {
    const el = gridScrollEl;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (!e.shiftKey || !onDateChange) return;
      const dominant =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (dominant === 0) return;
      e.preventDefault();
      if (dominant > 0) goToPreviousDay();
      else goToNextDay();
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  // Time blocks state - map of date to blocks
  let timeBlocksMap = $state<Map<string, TimeBlock[]>>(new Map());
  let loadingBlocks = $state(true);

  // Generate date range based on dayCount
  function getDateRange(startDate: string, count: number): string[] {
    const dates: string[] = [];
    const start = new Date(startDate + "T00:00:00");
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d));
    }
    return dates;
  }

  // Format date as YYYY-MM-DD
  function formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // Format date for column header (e.g., "Mon 26" or "Apr 26")
  function formatColumnDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
    const dayNum = d.getDate();
    return `${weekday} ${dayNum}`;
  }

  // Get formatted date for header (first day only) - short format
  const formattedDate = $derived.by(() => {
    const d = new Date(date + "T00:00:00");
    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
    const month = d.toLocaleDateString(undefined, { month: "short" });
    const day = d.getDate();
    return `${weekday} ${month} ${day}`;
  });

  // Get date range for current view
  const dateRange = $derived(getDateRange(date, dayCount));

  const gridHeightPx = MINUTES_PER_DAY;

  // Fetch time blocks when date range changes
  $effect(() => {
    fetchTimeBlocksForRange(dateRange);
  });

  // Update AI context when date or time blocks change
  $effect(() => {
    const blocksSummary =
      timeBlocksMap.size > 0
        ? Array.from(timeBlocksMap.entries())
            .map(([d, blocks]) => {
              const dateLabel = formatColumnDate(d);
              const blockList = blocks
                .map((b) => `${b.start_time.slice(0, 5)}: ${b.title}`)
                .join(", ");
              return `${dateLabel}: ${blockList || "No blocks"}`;
            })
            .join(" | ")
        : "No time blocks scheduled";

    chatState.updateUserContext(
      `The user is currently looking at ${formattedDate} (${dayCount} day view). Time blocks: ${blocksSummary}`,
    );
  });

  onMount(() => {
    const handleRefresh = () => fetchTimeBlocksForRange(dateRange);
    window.addEventListener("app-refresh-data", handleRefresh);

    return () => {
      window.removeEventListener("app-refresh-data", handleRefresh);
      chatState.updateUserContext(null);
      if (scrollPersistTimer) clearTimeout(scrollPersistTimer);
    };
  });

  async function fetchTimeBlocksForRange(dates: string[]) {
    loadingBlocks = true;
    try {
      const blocksMap = new Map<string, TimeBlock[]>();
      // Fetch blocks for each date in parallel
      const promises = dates.map(async (dateStr) => {
        const blocks = await invoke<TimeBlock[]>("get_time_blocks", {
          date: dateStr,
        });
        return { date: dateStr, blocks };
      });

      const results = await Promise.all(promises);
      results.forEach(({ date, blocks }) => {
        blocksMap.set(date, blocks);
      });

      timeBlocksMap = blocksMap;
    } catch (error) {
      console.error("Failed to fetch time blocks:", error);
      timeBlocksMap = new Map();
    } finally {
      loadingBlocks = false;
    }
  }

  // Parse time string (HH:MM or H:MM AM/PM) to hours
  function parseTimeToHours(time: string | undefined): number {
    if (!time) return 0;
    const cleanTime = time.trim().toUpperCase();

    // Handle 12-hour format
    const isPM = cleanTime.includes("PM");
    const isAM = cleanTime.includes("AM");
    const timePart = cleanTime.replace(/\s*(AM|PM)/i, "");
    const [h, m] = timePart.split(":").map(Number);
    let hours = h;

    if (isNaN(hours)) return 0;

    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours + (m || 0) / 60;
  }

  // Calculate minutes from midnight
  function timeToMinutes(time: string | undefined): number {
    const hours = parseTimeToHours(time);
    return hours * 60;
  }

  // Calculate end time in minutes for a time block
  function getBlockEndMinutes(block: TimeBlock): number {
    const startMinutes = timeToMinutes(block.start_time.slice(0, 5));
    return startMinutes + block.duration;
  }

  // Check if two time blocks are adjacent (end of one = start of another)
  function areBlocksAdjacent(block1: TimeBlock, block2: TimeBlock): boolean {
    const end1 = getBlockEndMinutes(block1);
    const start2 = timeToMinutes(block2.start_time.slice(0, 5));
    return Math.abs(end1 - start2) < 1;
  }

  // Add border classes for adjacent blocks
  function getAdjacentClasses(
    blockIndex: number,
    timeBlocks: TimeBlock[],
  ): string {
    const currentBlock = timeBlocks[blockIndex];
    let classes = "";

    if (blockIndex > 0) {
      const prevBlock = timeBlocks[blockIndex - 1];
      if (areBlocksAdjacent(prevBlock, currentBlock)) {
        classes += " border-t-0 ";
      }
    }

    return classes.trim();
  }

  // Filter tasks for a specific date
  function getTasksForDate(tasks: Task[], dateStr: string): Task[] {
    return tasks.filter((t) => t.due_date === dateStr);
  }

  // Group due-only tasks by due_time for markers
  function getDueTasksByTime(tasksForDate: Task[]): Map<string, Task[]> {
    const grouped = new Map<string, Task[]>();

    // Tasks with no due_time go at the top (position -1)
    grouped.set(
      "__top__",
      tasksForDate.filter((t) => !t.due_time),
    );

    // Group remaining by due_time
    tasksForDate
      .filter((t) => t.due_time)
      .forEach((t) => {
        const key = t.due_time!;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(t);
      });

    return grouped;
  }

  // Hours 0–23 (12 AM through 11 PM)
  const hours = $derived(() => {
    const result: number[] = [];
    for (let h = 0; h < 24; h++) {
      result.push(h);
    }
    return result;
  });

  /** Top edge in px; 1px ≈ 1 minute from midnight. */
  function getTopOffset(time: string | undefined): number {
    return Math.min(timeToMinutes(time), MINUTES_PER_DAY - 1);
  }

  function getBlockLayout(block: TimeBlock): { top: number; height: number } {
    const startMin = timeToMinutes(block.start_time.slice(0, 5));
    const top = Math.min(startMin, MINUTES_PER_DAY - 1);
    const rawHeight = (block.duration / 60) * hourHeight;
    const maxHeight = Math.max(0, MINUTES_PER_DAY - top);
    return { top, height: Math.min(rawHeight, maxHeight) };
  }

  // Format hour for display
  function formatHour(h: number): string {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  }

  // Navigation - always moves by 1 day regardless of dayCount
  function goToPreviousDay() {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() - 1);
    onDateChange?.(formatDate(d));
  }

  function goToNextDay() {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + 1);
    onDateChange?.(formatDate(d));
  }

  // Check if a date is today
  function isToday(dateStr: string): boolean {
    const today = new Date();
    const d = new Date(dateStr + "T00:00:00");
    return (
      today.getFullYear() === d.getFullYear() &&
      today.getMonth() === d.getMonth() &&
      today.getDate() === d.getDate()
    );
  }

  // Check if first date in range is today
  const showingToday = $derived(isToday(date));

  // Calculate column width based on dayCount
  const columnWidth = $derived(dayCount > 1 ? `${100 / dayCount}%` : "100%");
</script>

<div class="flex flex-col h-full">
  <div class="flex items-center justify-between gap-4 px-4 py-3 border-b">
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" onclick={goToPreviousDay}>
        <ChevronLeft class="size-4" />
      </Button>
      <div class="flex items-center gap-2 min-w-[140px] justify-center">
        <h2 class="text-lg font-semibold text-center">
          {#if showingToday}
            <span class="text-primary">Today</span>
          {:else}
            {formattedDate}
          {/if}
          {#if dayCount > 1}
            <span class="text-sm font-normal text-muted-foreground ml-1">
              ({dayCount}d)
            </span>
          {/if}
        </h2>
      </div>
      <Button variant="ghost" size="icon" onclick={goToNextDay}>
        <ChevronRight class="size-4" />
      </Button>
    </div>
  </div>

  <div class="flex top-0 z-35 bg-background border-b">
    {#each dateRange as dateStr}
      {@const thisIsToday = isToday(dateStr)}
      <div
        class="flex-shrink-0 border-r last:border-r-0 px-2 py-1 text-center text-sm font-medium"
        style="width: {columnWidth};"
      >
        {formatColumnDate(dateStr)}
        {#if thisIsToday}
          <span class="ml-1 text-xs text-primary font-normal"> Today </span>
        {/if}
      </div>
    {/each}
  </div>
  <!-- Day view grid with N columns -->
  <div
    class="flex-1 overflow-y-auto min-h-0"
    bind:this={gridScrollEl}
    onscroll={handleGridScroll}
  >
    <div class="flex" style="height: {gridHeightPx}px;">
      {#each dateRange as dateStr, colIndex}
        {@const thisIsToday = isToday(dateStr)}
        {@const dayTasks = getTasksForDate(tasks, dateStr)}
        {@const dayBlocks = timeBlocksMap.get(dateStr) || []}
        {@const dueTasksByTime = getDueTasksByTime(dayTasks)}

        <div
          class="relative flex-shrink-0 border-r last:border-r-0"
          style="width: {columnWidth}; height: {gridHeightPx}px;"
        >
          <!-- Hour grid lines -->
          <div class="relative h-full">
            {#each hours() as hour, i}
              <div
                class="absolute left-0 right-0 border-t border-border/50"
                style="top: {i * hourHeight}px;"
              >
                <span
                  class="absolute top-1 right-0 z-30 text-[10px] text-muted-foreground/60 px-1"
                >
                  {formatHour(hour)}
                </span>
              </div>
            {/each}

            <!-- Current time indicator (only on today's column) -->
            {#if thisIsToday}
              {@const nowMinutes =
                currentTime.getHours() * 60 + currentTime.getMinutes()}
              {#if nowMinutes >= 0 && nowMinutes < MINUTES_PER_DAY}
                {@const topOffset = nowMinutes}
                <div
                  class="absolute left-0 right-0 z-30 pointer-events-none"
                  style="top: {topOffset}px;"
                >
                  <div class="h-px w-full bg-destructive"></div>
                </div>
              {/if}
            {/if}

            <!-- Time blocks -->
            {#if loadingBlocks && colIndex === 0}
              <div class="absolute top-4 left-1/2 -translate-x-1/2">
                <Spinner class="size-4" />
              </div>
            {:else if dayBlocks.length === 0}
              <div
                class="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground"
              ></div>
            {:else}
              {#each dayBlocks as block, i}
                {@const task = {
                  id: block.id,
                  title: block.title,
                  notes: block.notes || undefined,
                  priority: block.priority || undefined,
                  due_time: block.start_time.slice(0, 5),
                  duration: block.duration,
                  completed: block.completed,
                  created_at: block.created_at,
                  updated_at: block.updated_at,
                }}
                {@const layout = getBlockLayout(block)}
                {@const adjacentClasses = getAdjacentClasses(i, dayBlocks)}
                <TaskBlock
                  {task}
                  topOffset={layout.top}
                  height={layout.height}
                  {onTaskClick}
                  {adjacentClasses}
                />
              {/each}
            {/if}

            <!-- Due date markers -->
            {#each [...dueTasksByTime.entries()] as [timeKey, tasksAtTime]}
              {@const top = timeKey === "__top__" ? -10 : getTopOffset(timeKey)}
              <TaskMarker tasks={tasksAtTime} topOffset={top} {onTaskClick} />
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
