<script lang="ts">
  import type { Task } from "$lib/types.js";
  import ViewToggle from "$lib/components/calendar/view-toggle.svelte";
  import DayView from "$lib/components/calendar/day-view.svelte";
  import { Spinner } from "$lib/components/ui/spinner";
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import HourglassIcon from "@lucide/svelte/icons/hourglass";

  let currentView = $state<"day" | "3days" | "month">("day");
  let selectedDate = $state(getTodayString());
  let allTasks = $state<Task[]>([]);
  let loading = $state(true);

  // Modal state
  let selectedTask = $state<Task | null>(null);
  let isModalOpen = $state(false);

  // Local editing state for modal
  let editTitle = $state("");
  let editNotes = $state("");
  let editPriority = $state<number | null>(null);
  let editDueTime = $state("");
  let editDuration = $state<number | null>(null);
  let editCompleted = $state(false);

  function getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  onMount(async () => {
    try {
      // Load all tasks (no date filter for calendar view)
      const tasks = await invoke<Task[]>("get_tasks", { fromDate: null });
      allTasks = tasks;
    } catch (error) {
      console.error("Failed to load tasks:", error);
      // Still set loading to false so UI is usable
      allTasks = [];
    } finally {
      loading = false;
    }
  });

  function handleDateChange(newDate: string) {
    selectedDate = newDate;
  }

  function handleViewChange(view: "day" | "3days" | "month") {
    currentView = view;
  }

  function handleTaskClick(task: Task) {
    // Open modal with task details
    selectedTask = task;
    editTitle = task.title;
    editNotes = task.notes || "";
    editPriority = task.priority || null;
    editDueTime = task.due_time || "";
    editDuration = task.duration || null;
    editCompleted = task.completed;
    isModalOpen = true;
  }

  async function handleSaveTask(close = true) {
    if (!selectedTask) return;

    try {
      const updatedTask = await invoke<Task>("update_task", {
        id: selectedTask.id,
        input: {
          title: editTitle,
          notes: editNotes || null,
          priority: editPriority || null,
          due_date: selectedTask.due_date || null,
          due_time: editDueTime || null,
          duration: editDuration || null,
          completed: editCompleted,
        },
      });

      // Update local state
      allTasks = allTasks.map((t) =>
        t.id === updatedTask.id ? updatedTask : t,
      );
      selectedTask = updatedTask;
      if (close) {
        isModalOpen = false;
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      // If we're in a textarea, only close on Shift+Enter or Ctrl+Enter
      if (target.tagName === "TEXTAREA" && !e.shiftKey && !e.ctrlKey) {
        return;
      }
      e.preventDefault();
      handleSaveTask(true);
    }
  }

  const priorityColors = {
    3: "border-destructive/50 data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground",
    2: "border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white",
    1: "border-muted-foreground/30 data-[state=checked]:bg-muted-foreground/50 data-[state=checked]:text-white",
  };
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3 border-b">
    <h1 class="text-xl font-semibold">Calendar</h1>
    <ViewToggle bind:currentView onViewChange={handleViewChange} />
  </div>

  <!-- Main content -->
  <div class="flex-1 overflow-hidden">
    {#if loading}
      <div class="flex items-center justify-center h-full">
        <Spinner class="size-6" />
      </div>
    {:else if currentView === "day"}
      <DayView
        date={selectedDate}
        tasks={allTasks}
        onDateChange={handleDateChange}
        onTaskClick={handleTaskClick}
      />
    {:else}
      <div
        class="flex items-center justify-center h-full text-muted-foreground"
      >
        <p>{currentView === "3days" ? "3 Day" : "Monthly"} view coming soon</p>
      </div>
    {/if}
  </div>
</div>

<!-- Task Detail Modal -->
<Dialog.Root bind:open={isModalOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Task Details</Dialog.Title>
    </Dialog.Header>

    {#if selectedTask}
      <div class="space-y-4 py-2" onkeydown={handleKeyDown} role="none">
        <!-- Completed checkbox -->
        <div class="flex items-center gap-3">
          <Checkbox
            bind:checked={editCompleted}
            onCheckedChange={() => handleSaveTask(false)}
            class={cn(
              "size-5 rounded-lg",
              selectedTask.priority
                ? priorityColors[
                    selectedTask.priority as keyof typeof priorityColors
                  ]
                : "",
            )}
          />
          <span class="text-sm text-muted-foreground">
            {editCompleted ? "Completed" : "Mark as complete"}
          </span>
        </div>

        <!-- Title -->
        <div>
          <Input
            bind:value={editTitle}
            placeholder="Task title..."
            class="text-base font-medium"
          />
        </div>

        <!-- Notes -->
        <div>
          <Textarea
            bind:value={editNotes}
            placeholder="Add notes..."
            class="min-h-[80px]"
          />
        </div>

        <!-- Priority -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Priority:</span>
          <div class="flex gap-1">
            <Button
              size="sm"
              variant={editPriority === 1 ? "secondary" : "ghost"}
              onclick={() => (editPriority = editPriority === 1 ? null : 1)}
              class={cn(
                "h-7 px-3 text-xs",
                editPriority === 1 && "bg-muted-foreground/20",
              )}
            >
              Low
            </Button>
            <Button
              size="sm"
              variant={editPriority === 2 ? "secondary" : "ghost"}
              onclick={() => (editPriority = editPriority === 2 ? null : 2)}
              class={cn(
                "h-7 px-3 text-xs",
                editPriority === 2 &&
                  "bg-amber-500/20 text-amber-600 dark:text-amber-400",
              )}
            >
              Medium
            </Button>
            <Button
              size="sm"
              variant={editPriority === 3 ? "secondary" : "ghost"}
              onclick={() => (editPriority = editPriority === 3 ? null : 3)}
              class={cn(
                "h-7 px-3 text-xs",
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
            <ClockIcon class="size-4 text-muted-foreground" />
            <Input
              type="text"
              bind:value={editDueTime}
              placeholder="9:30 AM"
              class="h-8 w-24"
            />
          </div>
          <div class="flex items-center gap-2">
            <HourglassIcon class="size-4 text-muted-foreground" />
            <Input
              type="number"
              bind:value={editDuration}
              placeholder="min"
              class="h-8 w-20"
              min="1"
            />
          </div>
        </div>
      </div>

      <Dialog.Footer>
        <Button variant="outline" onclick={() => (isModalOpen = false)}>
          Close
        </Button>
        <Button onclick={handleSaveTask}>Save changes</Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
