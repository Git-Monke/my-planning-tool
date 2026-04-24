<script lang="ts">
	import type { Task } from "$lib/types.js";
	import TaskItem from "./task-item.svelte";

	let { title, tasks }: { title: string; tasks: Task[] } = $props();
</script>

{#if tasks.length > 0}
	<div class="mb-6 last:mb-0">
		<p class="mb-2 px-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
			{title}
		</p>
		<div class="flex flex-col gap-0.5">
			{#each tasks as task (task.id)}
				<TaskItem {task} />
			{/each}
		</div>
	</div>
{/if}
