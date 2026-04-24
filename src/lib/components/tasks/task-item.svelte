<script lang="ts">
  import type { Task } from "$lib/types.js";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { cn } from "$lib/utils";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import HourglassIcon from "@lucide/svelte/icons/hourglass";

  let { task }: { task: Task } = $props();

  const priorityColors = {
    3: "border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground",
    2: "border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white",
    1: "border-muted-foreground/30 data-[state=checked]:bg-muted-foreground/50 data-[state=checked]:text-white",
  };

  const checkboxClass = $derived(
    task.priority
      ? priorityColors[task.priority as keyof typeof priorityColors]
      : "",
  );
</script>

<div
  class="flex items-start gap-4 py-3 px-2 hover:bg-muted/30 rounded-xl transition-all group"
>
  <div class="pt-0.5">
    <Checkbox
      bind:checked={task.completed}
      class={cn("size-5 rounded-lg transition-colors", checkboxClass)}
    />
  </div>

  <div class="flex-1 min-w-0">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1 flex-1 min-w-0">
        <h3
          class={cn(
            "text-[15px] font-medium leading-tight",
            task.completed
              ? "text-muted-foreground/60 line-through"
              : "text-foreground",
          )}
        >
          {task.title}
        </h3>

        {#if task.notes}
          <p
            class={cn(
              "text-sm leading-relaxed whitespace-pre-wrap break-words",
              task.completed
                ? "text-muted-foreground/40"
                : "text-muted-foreground",
            )}
          >
            {task.notes}
          </p>
        {/if}
      </div>

      {#if task.due_time || task.duration}
        <div
          class="flex flex-col items-end gap-1.5 text-[11px] text-muted-foreground/70 shrink-0 tabular-nums font-medium pt-0.5"
        >
          {#if task.due_time}
            <div class="flex items-center gap-1.5">
              <span>{task.due_time}</span>
              <ClockIcon class="size-3" />
            </div>
          {/if}
          {#if task.duration}
            <div class="flex items-center gap-1.5">
              <span>{task.duration}m</span>
              <HourglassIcon class="size-3" />
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
