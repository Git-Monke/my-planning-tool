<script lang="ts">
	import type { Task } from "$lib/types.js";
	import TaskList from "$lib/components/tasks/task-list.svelte";
	import { onMount } from "svelte";

	const now = new Date();
	const todayISO = now.toISOString().split('T')[0];
	const tomorrowDate = new Date(now);
	tomorrowDate.setDate(now.getDate() + 1);
	const tomorrowISO = tomorrowDate.toISOString().split('T')[0];

	let tasks = $state<Task[]>([
		{
			id: "1",
			title: "Design task list UI",
			notes: "Implement undated section and daily groups with priority colors.",
			priority: 3,
			completed: false,
			created_at: now.toISOString(),
			updated_at: now.toISOString()
		},
		{
			id: "2",
			title: "Setup Tauri backend",
			notes: "Configure SQLite and SQLx migrations.",
			priority: 2,
			completed: true,
			created_at: now.toISOString(),
			updated_at: now.toISOString()
		},
		{
			id: "7",
			title: "Research Groq Llama 3.3 capabilities",
			notes: "Focus on tool calling and context window limits.",
			priority: 2,
			completed: false,
			created_at: now.toISOString(),
			updated_at: now.toISOString()
		},
		{
			id: "3",
			title: "Groq API integration",
			priority: 3,
			due_date: todayISO,
			due_time: "10:00",
			completed: false,
			created_at: now.toISOString(),
			updated_at: now.toISOString()
		},
		{
			id: "4",
			title: "Polish mobile view",
			notes: "Ensure sidebar works on small screens.",
			priority: 1,
			due_date: todayISO,
			duration: 45,
			completed: false,
			created_at: now.toISOString(),
			updated_at: now.toISOString()
		},
		{
			id: "5",
			title: "Team meeting",
			priority: 2,
			due_date: tomorrowISO,
			due_time: "14:00",
			duration: 60,
			completed: false,
			created_at: now.toISOString(),
			updated_at: now.toISOString()
		},
		{
			id: "6",
			title: "Write documentation",
			priority: 1,
			completed: false,
			created_at: now.toISOString(),
			updated_at: now.toISOString()
		}
	]);

	const undatedTasks = $derived(
		tasks
			.filter(t => !t.due_date)
			.sort((a, b) => (b.priority || 0) - (a.priority || 0))
	);

	const datedGroups = $derived.by(() => {
		const groups: Record<string, Task[]> = {};
		tasks
			.filter(t => t.due_date)
			.forEach(t => {
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
					if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
					if (a.due_time) return -1;
					if (b.due_time) return 1;
					return 0;
				})
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
			weekday: 'long', 
			month: 'short', 
			day: 'numeric' 
		});
	}
</script>

<div class="max-w-2xl mx-auto py-8 px-6">
	<TaskList title="Undated" tasks={undatedTasks} />

	{#each datedGroups as group}
		<TaskList title={group.formattedDate} tasks={group.tasks} />
	{/each}
</div>
