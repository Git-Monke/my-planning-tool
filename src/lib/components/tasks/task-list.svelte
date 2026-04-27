<script lang="ts">
  import type { Task } from "$lib/types.js";
  import TaskItem from "./task-item.svelte";
  import { Button } from "$lib/components/ui/button";
  import Plus from "@lucide/svelte/icons/plus";

  let { 
    title, 
    tasks, 
    onAddTask,
    date = undefined,
    newTaskId = null,
    editingTaskId = null,
    onSave,
    onCancel,
    onStartEdit,
    onDelete
  }: { 
    title: string; 
    tasks: Task[];
    onAddTask: (date?: string) => void;
    date?: string;
    newTaskId?: string | null;
    editingTaskId?: string | null;
    onSave: (task: Task) => void;
    onCancel: (taskId: string) => void;
    onStartEdit?: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
  } = $props();

  // Sort tasks: new task first, then by priority
  const sortedTasks = $derived(() => {
    const newTask = tasks.find(t => t.id === newTaskId);
    const otherTasks = tasks.filter(t => t.id !== newTaskId);
    
    // Sort other tasks by priority (highest first)
    otherTasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // If there's a new task, put it at the top
    if (newTask) {
      return [newTask, ...otherTasks];
    }
    return otherTasks;
  });
</script>

<div class="mb-6 last:mb-0">
  <div class="flex items-center justify-between mb-2 px-3">
    <p
      class="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60"
    >
      {title}
    </p>
    <Button 
      variant="ghost" 
      size="xs" 
      onclick={() => onAddTask(date)}
      class="h-5 text-xs text-muted-foreground/60 hover:text-foreground"
    >
      <Plus class="size-3 mr-1" />
      New Task
    </Button>
  </div>
  <div class="flex flex-col gap-0.5">
    {#each sortedTasks() as task (task.id)}
      <TaskItem 
        {task} 
        editing={editingTaskId === task.id}
        isNew={newTaskId === task.id}
        onSave={onSave}
        onCancel={onCancel}
        onStartEdit={onStartEdit}
        onDelete={onDelete}
      />
    {/each}
  </div>
</div>
