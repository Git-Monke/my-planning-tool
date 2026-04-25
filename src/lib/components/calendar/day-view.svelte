<script lang="ts">
	import type { Task } from "$lib/types.js";
	import { Input } from "$lib/components/ui/input";
	import { Button } from "$lib/components/ui/button";
	import TaskMarker from "./task-marker.svelte";
	import TaskBlock from "./task-block.svelte";
	import ChevronLeft from "@lucide/svelte/icons/chevron-left";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import ClockIcon from "@lucide/svelte/icons/clock";

	let {
		date,
		tasks = [],
		onDateChange,
		onTaskClick,
	}: {
		date: string; // YYYY-MM-DD
		tasks?: Task[];
		onDateChange?: (date: string) => void;
		onTaskClick?: (task: Task) => void;
	} = $props();

	// Time range state (default 6 AM to 10 PM)
	let startHour = $state(6);
	let endHour = $state(22);

	// Calculate hour height in pixels (adjustable)
	const hourHeight = 60;

	// Parse time string (HH:MM or H:MM AM/PM) to hours
	function parseTimeToHours(time: string | undefined): number {
		if (!time) return 0;
		const cleanTime = time.trim().toUpperCase();

		// Handle 12-hour format
		const isPM = cleanTime.includes("PM");
		const isAM = cleanTime.includes("AM");
		const timePart = cleanTime.replace(/\s*(AM|PM)/i, "");
		const [h, m] = timePart.split(":").map(Number);
		let hours = h;

		if (isNaN(hours)) return 0;

		if (isPM && hours !== 12) hours += 12;
		if (isAM && hours === 12) hours = 0;

		return hours + (m || 0) / 60;
	}

	// Calculate minutes from midnight
	function timeToMinutes(time: string | undefined): number {
		const hours = parseTimeToHours(time);
		return hours * 60;
	}

	// Filter tasks for this date
	const tasksForDate = $derived(
		tasks.filter((t) => {
			const dueDateMatch = t.due_date === date;
			// Also include tasks with start_time on this date
			const startDate = t.start_time?.split("T")[0];
			const startDateMatch = startDate === date;
			return dueDateMatch || startDateMatch;
		}),
	);

	// Separate time-blocked tasks (have start_time) from due-only tasks
	const timeBlockedTasks = $derived(
		tasksForDate.filter((t) => t.start_time && t.duration),
	);

	const dueOnlyTasks = $derived(
		tasksForDate.filter((t) => !t.start_time && t.due_date),
	);

	// Group due-only tasks by due_time for markers
	const dueTasksByTime = $derived.by(() => {
		const grouped = new Map<string, Task[]>();

		// Tasks with no due_time go at the top (position -1)
		grouped.set("__top__", dueOnlyTasks.filter((t) => !t.due_time));

		// Group remaining by due_time
		dueOnlyTasks
			.filter((t) => t.due_time)
			.forEach((t) => {
				const key = t.due_time!;
				if (!grouped.has(key)) {
					grouped.set(key, []);
				}
				grouped.get(key)!.push(t);
			});

		return grouped;
	});

	// Generate hours array for the grid
	const hours = $derived(() => {
		const result = [];
		for (let h = startHour; h <= endHour; h++) {
			result.push(h);
		}
		return result;
	});

	// Calculate top offset for a time (in minutes from midnight)
	function getTopOffset(time: string | undefined): number {
		const minutes = timeToMinutes(time);
		const startMinutes = startHour * 60;
		return ((minutes - startMinutes) / 60) * hourHeight;
	}

	// Format hour for display
	function formatHour(h: number): string {
		if (h === 0) return "12 AM";
		if (h === 12) return "12 PM";
		if (h < 12) return `${h} AM`;
		return `${h - 12} PM`;
	}

	// Navigation
	function goToPreviousDay() {
		const d = new Date(date + "T00:00:00");
		d.setDate(d.getDate() - 1);
		onDateChange?.(formatDate(d));
	}

	function goToNextDay() {
		const d = new Date(date + "T00:00:00");
		d.setDate(d.getDate() + 1);
		onDateChange?.(formatDate(d));
	}

	function formatDate(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`;
	}

	// Format date for display
	const formattedDate = $derived.by(() => {
		const d = new Date(date + "T00:00:00");
		return d.toLocaleDateString(undefined, {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	});

	// Check if it's today
	const isToday = $derived.by(() => {
		const today = new Date();
		const d = new Date(date + "T00:00:00");
		return (
			today.getFullYear() === d.getFullYear() &&
			today.getMonth() === d.getMonth() &&
			today.getDate() === d.getDate()
		);
	});

	// Handle time input changes
	function handleStartTimeChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const hours = parseTimeToHours(input.value);
		if (!isNaN(hours) && hours >= 0 && hours < 24) {
			startHour = Math.floor(hours);
		}
	}

	function handleEndTimeChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const hours = parseTimeToHours(input.value);
		if (!isNaN(hours) && hours > 0 && hours <= 24) {
			endHour = Math.ceil(hours);
		}
	}
</script>

<div class="flex flex-col h-full">
	<!-- Header with date navigation and time range inputs -->
	<div class="flex items-center justify-between gap-4 px-4 py-3 border-b">
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="icon" onclick={goToPreviousDay}>
				<ChevronLeft class="size-4" />
			</Button>
			<h2 class="text-lg font-semibold min-w-[200px] text-center">
				{#if isToday}
					<span class="text-primary">Today</span>
				{:else}
					{formattedDate}
				{/if}
			</h2>
			<Button variant="ghost" size="icon" onclick={goToNextDay}>
				<ChevronRight class="size-4" />
			</Button>
		</div>

		<!-- Time range inputs -->
		<div class="flex items-center gap-2">
			<ClockIcon class="size-4 text-muted-foreground" />
			<div class="flex items-center gap-1">
				<Input
					type="text"
					value={formatHour(startHour)}
					onchange={handleStartTimeChange}
					class="h-8 w-20 text-xs text-center"
					placeholder="6 AM"
				/>
				<span class="text-xs text-muted-foreground">to</span>
				<Input
					type="text"
					value={formatHour(endHour)}
					onchange={handleEndTimeChange}
					class="h-8 w-20 text-xs text-center"
					placeholder="10 PM"
				/>
			</div>
		</div>
	</div>

	<!-- Day view grid -->
	<div class="flex-1 overflow-y-auto relative">
		<div class="relative" style="height: {(endHour - startHour + 1) * hourHeight}px;">
			<!-- Hour grid lines -->
			{#each hours() as hour, i}
				<div
					class="absolute left-0 right-0 border-t border-border/50"
					style="top: {i * hourHeight}px;"
				>
					<span class="absolute -top-3 left-0 text-[10px] text-muted-foreground/60 px-1">
						{formatHour(hour)}
					</span>
				</div>
			{/each}

			<!-- Current time indicator -->
			{#if isToday}
				{@const now = new Date()}
				{@const nowMinutes = now.getHours() * 60 + now.getMinutes()}
				{@const startMinutes = startHour * 60}
				{@const endMinutes = endHour * 60}
				{#if nowMinutes >= startMinutes && nowMinutes <= endMinutes}
					{@const topOffset = ((nowMinutes - startMinutes) / 60) * hourHeight}
					<div
						class="absolute left-0 right-0 z-30 pointer-events-none"
						style="top: {topOffset}px;"
					>
						<div class="absolute -left-1 size-2 rounded-full bg-destructive"></div>
						<div class="h-px w-full bg-destructive"></div>
					</div>
				{/if}
			{/if}

			<!-- Time-blocked tasks -->
			{#each timeBlockedTasks as task}
				{@const top = getTopOffset(task.start_time?.split("T")[1])}
				{@const duration = task.duration || 30}
				{@const height = (duration / 60) * hourHeight}
				<TaskBlock
					{task}
					topOffset={top}
					{height}
					{onTaskClick}
				/>
			{/each}

			<!-- Due date markers (tasks without start_time) -->
			{#each [...dueTasksByTime.entries()] as [timeKey, tasksAtTime]}
				{@const top = timeKey === "__top__" ? -10 : getTopOffset(timeKey)}
				<TaskMarker
					tasks={tasksAtTime}
					topOffset={top}
					{onTaskClick}
				/>
			{/each}
		</div>
	</div>
</div>
