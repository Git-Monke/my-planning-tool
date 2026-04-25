<script lang="ts">
  import type { Task } from "$lib/types.js";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import HourglassIcon from "@lucide/svelte/icons/hourglass";

  let {
    task,
    editing = false,
    isNew = false,
    onSave,
    onCancel,
    onStartEdit,
  }: {
    task: Task;
    editing?: boolean;
    isNew?: boolean;
    onSave?: (task: Task) => void;
    onCancel?: (taskId: string) => void;
    onStartEdit?: (taskId: string) => void;
  } = $props();

  // Time validation (accepts both 24h and 12h formats)
  function isValidTime(time: string): boolean {
    if (!time) return true; // Empty is valid (optional field)
    // Accept formats like: 9:30, 09:30, 9:30 AM, 09:30 AM, 9:30am, 9:30pm, etc.
    return /^(1[0-2]|[1-9]):[0-5][0-9](\s*(AM|PM|am|pm))?$|^([01]?[0-9]|2[0-3]):[0-5][0-9]$/i.test(time);
  }

  // Local editing state
  let editTitle = $state(task.title);
  let editNotes = $state(task.notes || "");
  let editPriority = $state(task.priority || null);
  let editDueTime = $state(task.due_time || "");
  let editDuration = $state(task.duration || null);

  let timeValid = $derived(isValidTime(editDueTime));

  let titleInputEl: HTMLInputElement | null = $state(null);

  // Sync local state when task changes
  $effect(() => {
    editTitle = task.title;
    editNotes = task.notes || "";
    editPriority = task.priority || null;
    editDueTime = task.due_time || "";
    editDuration = task.duration || null;
  });

  // Auto-focus title input when editing starts
  $effect(() => {
    if (editing && titleInputEl) {
      titleInputEl.focus();
    }
  });

  // Global keydown handler for shift+enter
  $effect(() => {
    if (editing) {
      function handleGlobalKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && e.shiftKey) {
          e.preventDefault();
          handleSave();
        }
      }
      document.addEventListener("keydown", handleGlobalKeydown);
      return () => document.removeEventListener("keydown", handleGlobalKeydown);
    }
  });

  function handleSave() {
    // Don't save if time is invalid
    if (!timeValid) return;

    const updatedTask: Task = {
      ...task,
      title: editTitle,
      notes: editNotes || undefined,
      priority: editPriority || undefined,
      due_time: editDueTime || undefined,
      duration: editDuration || undefined,
    };
    onSave?.(updatedTask);
  }

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

{#if editing}
  <!-- Editing Mode -->
  <div class="py-3 px-2 bg-muted/30 rounded-xl border border-border">
    <div class="flex items-start gap-4">
      <div class="pt-0.5">
        <Checkbox
          checked={task.completed}
          class={cn("size-5 rounded-lg transition-colors", checkboxClass)}
        />
      </div>

      <div class="flex-1 min-w-0 space-y-3">
        <!-- Title -->
        <Input
          bind:value={editTitle}
          bind:ref={titleInputEl}
          placeholder="Task title..."
          class="h-auto py-0 px-1 text-[15px] font-medium border-0 bg-transparent focus:bg-background focus:ring-1 rounded"
        />

        <!-- Notes -->
        <Textarea
          bind:value={editNotes}
          placeholder="Add notes..."
          class="min-h-[60px] py-1 px-2 text-sm border border-transparent hover:border-border/90 bg-transparent focus:bg-background focus:ring-1 focus:border-border rounded resize-none transition-colors"
        />

        <!-- Priority Buttons -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground/60">Priority:</span>
          <div class="flex gap-1">
            <Button
              size="xs"
              variant={editPriority === 1 ? "secondary" : "ghost"}
              onclick={() => (editPriority = editPriority === 1 ? null : 1)}
              class={cn(
                "h-6 px-2 text-xs",
                editPriority === 1 && "bg-muted-foreground/20",
              )}
            >
              Low
            </Button>
            <Button
              size="xs"
              variant={editPriority === 2 ? "secondary" : "ghost"}
              onclick={() => (editPriority = editPriority === 2 ? null : 2)}
              class={cn(
                "h-6 px-2 text-xs",
                editPriority === 2 &&
                  "bg-amber-500/20 text-amber-600 dark:text-amber-400",
              )}
            >
              Medium
            </Button>
            <Button
              size="xs"
              variant={editPriority === 3 ? "secondary" : "ghost"}
              onclick={() => (editPriority = editPriority === 3 ? null : 3)}
              class={cn(
                "h-6 px-2 text-xs",
                editPriority === 3 && "bg-destructive/20 text-destructive",
              )}
            >
              High
            </Button>
          </div>
        </div>

        <!-- Time and Duration -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <ClockIcon class="size-3 text-muted-foreground/60" />
            <Input
              type="text"
              bind:value={editDueTime}
              placeholder="9:30 AM"
              class={cn(
                "h-6 w-20 py-0 px-2 text-xs border bg-transparent focus:ring-1 rounded",
                !timeValid && editDueTime
                  ? "border-destructive focus:border-destructive"
                  : "border-transparent focus:border-border",
              )}
            />
          </div>
          <div class="flex items-center gap-2">
            <HourglassIcon class="size-3 text-muted-foreground/60" />
            <Input
              type="number"
              bind:value={editDuration}
              placeholder="min"
              class="h-6 w-16 py-0 px-2 text-xs border-0 bg-transparent focus:bg-background focus:ring-1 rounded"
              min="1"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- Display Mode -->
  <div
    class="flex items-start gap-4 py-3 px-2 hover:bg-muted/30 rounded-xl transition-all group cursor-pointer"
    ondblclick={() => onStartEdit?.(task.id)}
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
{/if}
