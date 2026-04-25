<script lang="ts">
  import type { Task } from "$lib/types.js";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { cn } from "$lib/utils";
  import Checkbox from "@lucide/svelte/icons/square";
  import CheckIcon from "@lucide/svelte/icons/check";

  let {
    tasks,
    topOffset = 0,
    onTaskClick,
  }: {
    tasks: Task[];
    topOffset?: number;
    onTaskClick?: (task: Task) => void;
  } = $props();

  // Group tasks by priority for color coding
  function getPriorityColor(priority?: number): string {
    switch (priority) {
      case 3:
        return "bg-destructive";
      case 2:
        return "bg-amber-500";
      case 1:
        return "bg-muted-foreground";
      default:
        return "bg-primary";
    }
  }

  // Format time for display
  function formatTime(time: string | undefined): string {
    if (!time) return "";
    return time;
  }

  // Create tooltip content with all tasks
  const tooltipContent = $derived(
    tasks
      .map((t) => {
        const priority = t.priority
          ? ` [${t.priority === 3 ? "High" : t.priority === 2 ? "Med" : "Low"}]`
          : "";
        const completed = t.completed ? " ✓" : "";
        const time = t.due_time ? ` @ ${t.due_time}` : "";
        return `• ${t.title}${priority}${time}${completed}`;
      })
      .join("\n"),
  );
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger
      class="absolute left-0 right-0 h-2 cursor-pointer group flex items-center"
      style="top: {topOffset}px;"
      onclick={() => onTaskClick?.(tasks[0])}
    >
      <!-- Thick line -->
      <div
        class={cn(
          "flex-1 h-1 transition-opacity",
          getPriorityColor(tasks[0]?.priority),
          "opacity-90 group-hover:opacity-100",
        )}
      ></div>

      <!-- Show count if multiple tasks -->
      {#if tasks.length > 1}
        <span
          class={cn(
            "absolute right-0 -mr-1 text-[10px] font-bold px-1 py-0.5 rounded",
            getPriorityColor(tasks[0]?.priority),
            "text-background",
          )}
        >
          {tasks.length}
        </span>
      {/if}

      <!-- Show checkbox if task is completed -->
      {#if tasks[0]?.completed}
        <div class="absolute left-0 -ml-1.5 z-20">
          <CheckIcon
            class="size-3 text-muted-foreground bg-background rounded-full"
          />
        </div>
      {/if}
    </Tooltip.Trigger>
    <Tooltip.Content side="right" class="max-w-xs">
      <div class="text-xs whitespace-pre-wrap">{tooltipContent}</div>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
