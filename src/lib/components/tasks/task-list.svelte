<script lang="ts">
	import type { Task } from "$lib/types.js";
	import TaskItem from "./task-item.svelte";
	import * as Card from "$lib/components/ui/card/index.js";

	let { title, tasks }: { title: string; tasks: Task[] } = $props();
</script>

{#if tasks.length > 0}
	<Card.Root class="mb-6 last:mb-0 border-none shadow-none bg-transparent">
		<Card.Header class="px-0 pt-0 pb-3">
			<Card.Title class="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">{title}</Card.Title>
		</Card.Header>
		<Card.Content class="px-0 py-0 space-y-0.5">
			{#each tasks as task (task.id)}
				<TaskItem {task} />
			{/each}
		</Card.Content>
	</Card.Root>
{/if}
