<script lang="ts">
  import type { Task } from "$lib/types.js";
  import TaskList from "$lib/components/tasks/task-list.svelte";
  import { Spinner } from "$lib/components/ui/spinner";
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";

  let allDatedTasks = $state<Task[]>([]);
  let undatedTasks = $state<Task[]>([]);
  let loading = $state(true);
  let isLoadingMore = $state(false);
  let hasMoreDays = $state(true);
  let editingTaskId = $state<string | null>(null);
  let newTaskId = $state<string | null>(null);
  let sentinelEl = $state<HTMLDivElement | null>(null);

  // How many days to load at a time
  const DAYS_PER_LOAD = 30;

  // Calculate today's date as YYYY-MM-DD in local timezone
  let loadedDaysUpTo = $state<string>(getDateString(DAYS_PER_LOAD));

  function getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Calculate date N days from now as YYYY-MM-DD in local timezone
  function getDateString(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Get initial date range (today to 30 days out)
  const initialFromDate = getTodayString();
  const initialToDate = getDateString(DAYS_PER_LOAD);

  async function loadTasks() {
    try {
      // Load undated tasks (no from_date filter)
      const allTasks = await invoke<Task[]>("get_tasks", { fromDate: null });
      undatedTasks = allTasks
        .filter((t) => !t.due_date)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Load dated tasks starting from today
      const datedTasks = await invoke<Task[]>("get_tasks", {
        fromDate: initialFromDate,
      });
      allDatedTasks = datedTasks;
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      loading = false;
    }
  }

  // Load initial undated tasks and dated tasks for first 30 days
  onMount(() => {
    loadTasks();
    window.addEventListener("app-refresh-data", loadTasks);
    return () => window.removeEventListener("app-refresh-data", loadTasks);
  });

  // Set up intersection observer for infinite scroll
  $effect(() => {
    if (!sentinelEl) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoadingMore && hasMoreDays) {
          await loadMoreDays();
        }
      },
      { rootMargin: "200px" }, // Trigger 200px before reaching bottom
    );

    observer.observe(sentinelEl);

    return () => {
      observer.disconnect();
    };
  });

  // Load more days when sentinel is visible
  async function loadMoreDays() {
    if (isLoadingMore || !hasMoreDays) return;

    isLoadingMore = true;

    try {
      const today = getTodayString();

      // Extend the loaded date range by 30 more days
      const nextDaysUpTo = getDateStringFromString(
        loadedDaysUpTo,
        DAYS_PER_LOAD,
      );

      // Fetch all tasks from today up to the new date range
      const newTasks = await invoke<Task[]>("get_tasks", { fromDate: today });

      // Update state
      allDatedTasks = newTasks;
      loadedDaysUpTo = nextDaysUpTo;

      // Continue allowing infinite scroll (user can keep scrolling indefinitely)
    } catch (error) {
      console.error("Failed to load more tasks:", error);
    } finally {
      isLoadingMore = false;
    }
  }

  // Helper to add days to a YYYY-MM-DD string
  function getDateStringFromString(dateStr: string, daysToAdd: number): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + daysToAdd);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Combined tasks list for CRUD operations
  const tasks = $derived([...undatedTasks, ...allDatedTasks]);

  // CRUD operations
  async function handleAddTask(date?: string) {
    try {
      const newTask = await invoke<Task>("create_task", {
        input: {
          title: "",
          notes: null,
          priority: null,
          due_date: date || null,
          due_time: null,
          duration: null,
          completed: false,
        },
      });
      // Add to correct list based on date
      if (date) {
        allDatedTasks = [newTask, ...allDatedTasks];
      } else {
        undatedTasks = [newTask, ...undatedTasks];
      }
      editingTaskId = newTask.id;
      newTaskId = newTask.id;
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  }

  async function handleUpdateTask(task: Task) {
    try {
      const updatedTask = await invoke<Task>("update_task", {
        id: task.id,
        input: {
          title: task.title,
          notes: task.notes || null,
          priority: task.priority || null,
          due_date: task.due_date || null,
          due_time: task.due_time || null,
          duration: task.duration || null,
          completed: task.completed,
        },
      });

      // Update in appropriate list
      if (updatedTask.due_date) {
        // Move to dated tasks
        undatedTasks = undatedTasks.filter((t) => t.id !== updatedTask.id);
        const existingIndex = allDatedTasks.findIndex(
          (t) => t.id === updatedTask.id,
        );
        if (existingIndex >= 0) {
          allDatedTasks = allDatedTasks.map((t) =>
            t.id === updatedTask.id ? updatedTask : t,
          );
        } else {
          allDatedTasks = [...allDatedTasks, updatedTask];
        }
      } else {
        // Move to undated tasks
        allDatedTasks = allDatedTasks.filter((t) => t.id !== updatedTask.id);
        undatedTasks = undatedTasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        );
      }

      if (editingTaskId === task.id) {
        editingTaskId = null;
        newTaskId = null;
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }

  async function handleDeleteTask(id: string) {
    try {
      await invoke("delete_task", { id });
      undatedTasks = undatedTasks.filter((t) => t.id !== id);
      allDatedTasks = allDatedTasks.filter((t) => t.id !== id);
      if (editingTaskId === id) {
        editingTaskId = null;
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }

  function handleSaveTask(task: Task) {
    if (!task.title.trim()) {
      // Don't save empty tasks, delete the new task
      handleDeleteTask(task.id);
    } else {
      handleUpdateTask(task);
    }
  }

  function handlePersistCompletion(task: Task) {
    if (!task.title.trim()) return;
    handleUpdateTask(task);
  }

  function handleStartEdit(taskId: string) {
    editingTaskId = taskId;
  }

  function handleCancelEdit(taskId: string) {
    const task =
      undatedTasks.find((t) => t.id === taskId) ||
      allDatedTasks.find((t) => t.id === taskId);
    if (task && !task.title.trim()) {
      // Empty new task - delete it
      handleDeleteTask(taskId);
    } else {
      editingTaskId = null;
    }
  }

  // Generate date groups - one for each day from today to loadedDaysUpTo
  const datedGroups = $derived.by(() => {
    const today = getTodayString();
    const taskMap = new Map<string, Task[]>();

    // Group tasks by date
    allDatedTasks.forEach((t) => {
      const date = t.due_date!;
      if (!taskMap.has(date)) {
        taskMap.set(date, []);
      }
      taskMap.get(date)!.push(t);
    });

    // Generate groups for every day from today to loadedDaysUpTo
    const groups: { date: string; formattedDate: string; tasks: Task[] }[] = [];
    let currentDate = new Date(today + "T00:00:00");
    const endDate = new Date(loadedDaysUpTo + "T00:00:00");

    while (currentDate <= endDate) {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, "0");
      const d = String(currentDate.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const dayTasks = taskMap.get(dateStr) || [];

      // Sort tasks: by priority descending, then by due_time ascending
      dayTasks.sort((a, b) => {
        const pDiff = (b.priority || 0) - (a.priority || 0);
        if (pDiff !== 0) return pDiff;
        if (a.due_time && b.due_time)
          return a.due_time.localeCompare(b.due_time);
        if (a.due_time) return -1;
        if (b.due_time) return 1;
        return 0;
      });

      groups.push({
        date: dateStr,
        formattedDate: formatDate(dateStr),
        tasks: dayTasks,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return groups;
  });

  function formatDate(dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const tomorrow = new Date(todayDate);
    tomorrow.setDate(todayDate.getDate() + 1);

    if (date.getTime() === todayDate.getTime()) return "Today";
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow";

    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-4 border-b">
    <h1 class="text-xl font-semibold">Tasks</h1>
  </div>

  <!-- Main content -->
  <div class="flex-1 overflow-y-auto">
    <div class="max-w-2xl mx-auto py-6 px-6">
      {#if loading}
        <div class="flex justify-center py-8">
          <Spinner class="size-6" />
        </div>
      {:else}
        <TaskList
          title="Undated"
          tasks={undatedTasks}
          onAddTask={handleAddTask}
          {newTaskId}
          {editingTaskId}
          onSave={handleSaveTask}
          onStartEdit={handleStartEdit}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteTask}
          onPersistCompletion={handlePersistCompletion}
        />

        {#each datedGroups as group}
          <TaskList
            title={group.formattedDate}
            tasks={group.tasks}
            date={group.date}
            onAddTask={handleAddTask}
            {newTaskId}
            {editingTaskId}
            onSave={handleSaveTask}
            onStartEdit={handleStartEdit}
            onCancel={handleCancelEdit}
            onDelete={handleDeleteTask}
            onPersistCompletion={handlePersistCompletion}
          />
        {/each}

        <!-- Infinite scroll sentinel -->
        <div
          bind:this={sentinelEl}
          class="flex justify-center py-4 min-h-[60px]"
        >
          {#if isLoadingMore}
            <Spinner class="size-6" />
          {:else if !hasMoreDays && datedGroups.length > 0}
            <p class="text-xs text-muted-foreground/50">All caught up!</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
