<script lang="ts">
  import type { Task } from "$lib/types.js";
  import { cn } from "$lib/utils";
  import CheckIcon from "@lucide/svelte/icons/check";

  let {
    task,
    topOffset = 0,
    height = 60,
    onTaskClick,
    adjacentClasses = "",
  }: {
    task: Task;
    topOffset?: number;
    height?: number;
    onTaskClick?: (task: Task) => void;
    adjacentClasses?: string;
  } = $props();

  // Parse start_time (HH:MM) to minutes from midnight
  function parseTimeToMinutes(time: string | undefined): number {
    if (!time) return 0;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  }

  // Calculate end time in minutes
  const startMinutes = $derived(parseTimeToMinutes(task.due_time || "12:00"));
  const endMinutes = $derived(startMinutes + (task.duration || 30));

  // Group tasks by priority for color coding (pastel colors for time blocks)
  function getPriorityColor(priority?: number): {
    bg: string;
    border: string;
    text: string;
  } {
    switch (priority) {
      case 3:
        return {
          bg: "bg-rose-100 dark:bg-rose-950/40",
          border: "border-rose-300 dark:border-rose-800",
          text: "text-rose-900 dark:text-rose-200",
        };
      case 2:
        return {
          bg: "bg-amber-100 dark:bg-amber-950/40",
          border: "border-amber-300 dark:border-amber-800",
          text: "text-amber-900 dark:text-amber-200",
        };
      case 1:
        return {
          bg: "bg-slate-100 dark:bg-slate-800/40",
          border: "border-slate-300 dark:border-slate-700",
          text: "text-slate-700 dark:text-slate-300",
        };
      default:
        return {
          bg: "bg-blue-100 dark:bg-blue-950/40",
          border: "border-blue-300 dark:border-blue-800",
          text: "text-blue-900 dark:text-blue-200",
        };
    }
  }

  const colors = $derived(getPriorityColor(task.priority));
</script>

<div
  class={cn(
    "absolute left-0 right-0 border px-2 py-1 cursor-pointer transition-bg-opacity bg-opacity-50 group hover:bg-opacity-100",
    adjacentClasses,
    task.completed && "opacity-50",
    colors.bg,
    colors.border,
  )}
  style="top: {topOffset}px; height: {height}px;"
  onclick={() => onTaskClick?.(task)}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === "Enter" && onTaskClick?.(task)}
>
  <div class="flex items-start justify-between h-full gap-2 overflow-hidden">
    <div class="flex-1 min-w-0">
      <h4
        class={cn(
          "text-sm font-medium leading-tight truncate",
          task.completed && "line-through opacity-60",
          colors.text,
        )}
      >
        {task.title}
      </h4>
      {#if task.notes}
        <p
          class={cn(
            "text-xs leading-relaxed truncate mt-0.5 opacity-75",
            colors.text,
          )}
        >
          {task.notes}
        </p>
      {/if}
    </div>

    {#if task.completed}
      <div class="shrink-0">
        <CheckIcon class={cn("size-4", colors.text, "opacity-60")} />
      </div>
    {/if}
  </div>
</div>
