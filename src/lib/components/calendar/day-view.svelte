<script lang="ts">
  import type { Task, TimeBlock } from "$lib/types.js";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import TaskMarker from "./task-marker.svelte";
  import TaskBlock from "./task-block.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import { invoke } from "@tauri-apps/api/core";
  import { Spinner } from "$lib/components/ui/spinner";

  let {
    date,
    tasks = [],
    onDateChange,
    onTaskClick,
  }: {
    date: string; // YYYY-MM-DD
    tasks?: Task[];
    onDateChange?: (date: string) => void;
    onTaskClick?: (task: Task) => void;
  } = $props();

  // Time range state (default 6 AM to 10 PM)
  let startHour = $state(6);
  let endHour = $state(22);

  // Calculate hour height in pixels (adjustable)
  const hourHeight = 60;

  // Time blocks state
  let timeBlocks = $state<TimeBlock[]>([]);
  let loadingBlocks = $state(true);

  // Fetch time blocks when date changes
  $effect(() => {
    fetchTimeBlocks(date);
  });

  import { onMount } from "svelte";
  onMount(() => {
    const handleRefresh = () => fetchTimeBlocks(date);
    window.addEventListener("app-refresh-data", handleRefresh);
    return () => window.removeEventListener("app-refresh-data", handleRefresh);
  });

  async function fetchTimeBlocks(dateStr: string) {
    loadingBlocks = true;
    try {
      const blocks = await invoke<TimeBlock[]>("get_time_blocks", { date: dateStr });
      timeBlocks = blocks;
    } catch (error) {
      console.error("Failed to fetch time blocks:", error);
      timeBlocks = [];
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

  // Filter tasks for this date
  const tasksForDate = $derived(
    tasks.filter((t) => {
      const dueDateMatch = t.due_date === date;
      return dueDateMatch;
    }),
  );

  // Due-only tasks (no time blocks anymore - those are separate)
  const dueOnlyTasks = $derived(
    tasksForDate.filter((t) => !t.due_date),
  );

  // Group due-only tasks by due_time for markers
  const dueTasksByTime = $derived.by(() => {
    const grouped = new Map<string, Task[]>();

    // Tasks with no due_time go at the top (position -1)
    grouped.set(
      "__top__",
      dueOnlyTasks.filter((t) => !t.due_time),
    );

    // Group remaining by due_time
    dueOnlyTasks
      .filter((t) => t.due_time)
      .forEach((t) => {
        const key = t.due_time!;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(t);
      });

    return grouped;
  });

  // Generate hours array for the grid
  const hours = $derived(() => {
    const result = [];
    for (let h = startHour; h <= endHour; h++) {
      result.push(h);
    }
    return result;
  });

  // Calculate top offset for a time (in minutes from midnight)
  function getTopOffset(time: string | undefined): number {
    const minutes = timeToMinutes(time);
    const startMinutes = startHour * 60;
    return ((minutes - startMinutes) / 60) * hourHeight;
  }

  // Format hour for display
  function formatHour(h: number): string {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  }

  // Navigation
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

  function formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // Format date for display
  const formattedDate = $derived.by(() => {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  });

  // Check if it's today
  const isToday = $derived.by(() => {
    const today = new Date();
    const d = new Date(date + "T00:00:00");
    return (
      today.getFullYear() === d.getFullYear() &&
      today.getMonth() === d.getMonth() &&
      today.getDate() === d.getDate()
    );
  });

  // Handle time input changes
  function handleStartTimeChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const hours = parseTimeToHours(input.value);
    if (!isNaN(hours) && hours >= 0 && hours < 24) {
      startHour = Math.floor(hours);
    }
  }

  function handleEndTimeChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const hours = parseTimeToHours(input.value);
    if (!isNaN(hours) && hours > 0 && hours <= 24) {
      endHour = Math.ceil(hours);
    }
  }
</script>

<div class="flex flex-col h-full">
  <!-- Header with date navigation and time range inputs -->
  <div class="flex items-center justify-between gap-4 px-4 py-3 border-b">
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" onclick={goToPreviousDay}>
        <ChevronLeft class="size-4" />
      </Button>
      <h2 class="text-lg font-semibold min-w-[200px] text-center">
        {#if isToday}
          <span class="text-primary">Today</span>
        {:else}
          {formattedDate}
        {/if}
      </h2>
      <Button variant="ghost" size="icon" onclick={goToNextDay}>
        <ChevronRight class="size-4" />
      </Button>
    </div>

    <!-- Time range inputs -->
    <div class="flex items-center gap-2">
      <ClockIcon class="size-4 text-muted-foreground" />
      <div class="flex items-center gap-1">
        <Input
          type="text"
          value={formatHour(startHour)}
          onchange={handleStartTimeChange}
          class="h-8 w-20 text-xs text-center"
          placeholder="6 AM"
        />
        <span class="text-xs text-muted-foreground">to</span>
        <Input
          type="text"
          value={formatHour(endHour)}
          onchange={handleEndTimeChange}
          class="h-8 w-20 text-xs text-center"
          placeholder="10 PM"
        />
      </div>
    </div>
  </div>

  <!-- Day view grid -->
  <div class="flex-1 overflow-y-auto relative">
    <div
      class="relative"
      style="height: {(endHour - startHour + 1) * hourHeight}px;"
    >
      <!-- Hour grid lines -->
      {#each hours() as hour, i}
        <div
          class="absolute left-0 right-0 border-t border-border/50"
          style="top: {i * hourHeight}px;"
        >
          <span
            class="absolute -top-4 right-0 z-30 text-[10px] text-muted-foreground/60 px-1"
          >
            {formatHour(hour)}
          </span>
        </div>
      {/each}

      <!-- Current time indicator -->
      {#if isToday}
        {@const now = new Date()}
        {@const nowMinutes = now.getHours() * 60 + now.getMinutes()}
        {@const startMinutes = startHour * 60}
        {@const endMinutes = endHour * 60}
        {#if nowMinutes >= startMinutes && nowMinutes <= endMinutes}
          {@const topOffset = ((nowMinutes - startMinutes) / 60) * hourHeight}
          <div
            class="absolute left-0 right-0 z-30 pointer-events-none"
            style="top: {topOffset}px;"
          >
            <div class="h-px w-full bg-destructive"></div>
          </div>
        {/if}
      {/if}

      <!-- Time blocks from the new time_blocks table -->
      {#if loadingBlocks}
        <div class="absolute top-4 left-1/2 -translate-x-1/2">
          <Spinner class="size-4" />
        </div>
      {:else}
        {#each timeBlocks as block}
          {@const top = getTopOffset(block.start_time)}
          {@const height = (block.duration / 60) * hourHeight}
          <div
            class="absolute left-0 right-0 border px-2 py-1 cursor-pointer transition-all hover:shadow-md hover:z-20 group"
            style="top: {top}px; height: {height}px;"
          >
            <div class="flex items-start justify-between h-full gap-2 overflow-hidden">
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium leading-tight truncate text-slate-700 dark:text-slate-300">
                  Block {block.id.slice(0, 8)}
                </h4>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {block.duration} min
                </p>
              </div>
            </div>
            <div class="absolute bottom-0.5 left-2 text-[10px] opacity-60 font-medium text-muted-foreground">
              {block.start_time}
            </div>
          </div>
        {/each}
      {/if}

      <!-- Due date markers (tasks without start_time) -->
      {#each [...dueTasksByTime.entries()] as [timeKey, tasksAtTime]}
        {@const top = timeKey === "__top__" ? -10 : getTopOffset(timeKey)}
        <TaskMarker tasks={tasksAtTime} topOffset={top} {onTaskClick} />
      {/each}
    </div>
  </div>
</div>
