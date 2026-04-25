<script lang="ts">
  import type { Task } from "$lib/types.js";
  import TaskList from "$lib/components/tasks/task-list.svelte";
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";

  let tasks = $state<Task[]>([]);
  let loading = $state(true);
  let editingTaskId = $state<string | null>(null);
  let newTaskId = $state<string | null>(null);

  // Load tasks from backend
  onMount(async () => {
    try {
      const loadedTasks = await invoke<Task[]>("get_tasks");
      tasks = loadedTasks;
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      loading = false;
    }
  });

  // CRUD operations
  async function handleAddTask() {
    try {
      const newTask = await invoke<Task>("create_task", {
        input: {
          title: "",
          notes: null,
          priority: null,
          due_date: null,
          due_time: null,
          duration: null,
          completed: false
        }
      });
      tasks = [newTask, ...tasks];
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
          completed: task.completed
        }
      });
      tasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
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
      tasks = tasks.filter(t => t.id !== id);
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

  function handleStartEdit(taskId: string) {
    editingTaskId = taskId;
  }

  function handleCancelEdit(taskId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.title.trim()) {
      // Empty new task - delete it
      handleDeleteTask(taskId);
    } else {
      editingTaskId = null;
    }
  }

  const undatedTasks = $derived(
    tasks
      .filter((t) => !t.due_date)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0)),
  );

  const datedGroups = $derived.by(() => {
    const groups: Record<string, Task[]> = {};
    tasks
      .filter((t) => t.due_date)
      .forEach((t) => {
        const date = t.due_date!;
        if (!groups[date]) groups[date] = [];
        groups[date].push(t);
      });

    return Object.entries(groups)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, tasks]) => ({
        date,
        formattedDate: formatDate(date),
        tasks: tasks.sort((a, b) => {
          // Sort by priority descending
          const pDiff = (b.priority || 0) - (a.priority || 0);
          if (pDiff !== 0) return pDiff;
          // Then by due_time ascending
          if (a.due_time && b.due_time)
            return a.due_time.localeCompare(b.due_time);
          if (a.due_time) return -1;
          if (b.due_time) return 1;
          return 0;
        }),
      }));
  });

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow";

    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="max-w-2xl mx-auto py-8 px-6">
  {#if loading}
    <p class="text-muted-foreground">Loading tasks...</p>
  {:else}
    <TaskList 
      title="Undated" 
      tasks={undatedTasks} 
      onAddTask={handleAddTask}
      newTaskId={newTaskId}
      editingTaskId={editingTaskId}
      onSave={handleSaveTask}
      onStartEdit={handleStartEdit}
      onCancel={handleCancelEdit}
    />

    {#each datedGroups as group}
      <TaskList 
        title={group.formattedDate} 
        tasks={group.tasks}
        onAddTask={handleAddTask}
        newTaskId={newTaskId}
        editingTaskId={editingTaskId}
        onSave={handleSaveTask}
        onStartEdit={handleStartEdit}
        onCancel={handleCancelEdit}
      />
    {/each}
  {/if}
</div>
