<script lang="ts">
	import type { Task, TimeBlock } from "$lib/types";
	import { Input } from "$lib/components/ui/input";
	import { Button } from "$lib/components/ui/button";
	import TaskMarker from "./task-marker.svelte";
	import TaskBlock from "./task-block.svelte";
	import ChevronLeft from "@lucide/svelte/icons/chevron-left";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import { invoke } from "@tauri-apps/api/core";
	import { Spinner } from "$lib/components/ui/spinner";
	import { chatState } from "$lib/ai.svelte.ts";

	let {
		date,
		dayCount = 1,
		tasks = [],
		onDateChange,
		onTaskClick,
	}: {
		date: string; // YYYY-MM-DD - the first day in the range
		dayCount?: number;
		tasks?: Task[];
		onDateChange?: (date: string) => void;
		onTaskClick?: (task: Task) => void;
	} = $props();

	// Time range state (default 6 AM to 10 PM)
	let startHour = $state(6);
	let endHour = $state(22);

	// Calculate hour height in pixels (adjustable)
	const hourHeight = 60;

	// Time blocks state - map of date to blocks
	let timeBlocksMap = $state<Map<string, TimeBlock[]>>(new Map());
	let loadingBlocks = $state(true);

	// Generate date range based on dayCount
	function getDateRange(startDate: string, count: number): string[] {
		const dates: string[] = [];
		const start = new Date(startDate + "T00:00:00");
		for (let i = 0; i < count; i++) {
			const d = new Date(start);
			d.setDate(d.getDate() + i);
			dates.push(formatDate(d));
		}
		return dates;
	}

	// Format date as YYYY-MM-DD
	function formatDate(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`;
	}

	// Format date for column header (e.g., "Mon 26" or "Apr 26")
	function formatColumnDate(dateStr: string): string {
		const d = new Date(dateStr + "T00:00:00");
		const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
		const dayNum = d.getDate();
		return `${weekday} ${dayNum}`;
	}

	// Get full formatted date for header (first day only)
	const formattedDate = $derived.by(() => {
		const d = new Date(date + "T00:00:00");
		return d.toLocaleDateString(undefined, {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	});

	// Get date range for current view
	const dateRange = $derived(getDateRange(date, dayCount));

	// Fetch time blocks when date range changes
	$effect(() => {
		fetchTimeBlocksForRange(dateRange);
	});

	// Update AI context when date or time blocks change
	$effect(() => {
		const blocksSummary =
			timeBlocksMap.size > 0
				? Array.from(timeBlocksMap.entries())
						.map(([d, blocks]) => {
							const dateLabel = formatColumnDate(d);
							const blockList = blocks
								.map((b) => `${b.start_time.slice(0, 5)}: ${b.title}`)
								.join(", ");
							return `${dateLabel}: ${blockList || "No blocks"}`;
						})
						.join(" | ")
				: "No time blocks scheduled";

		chatState.updateUserContext(
			`The user is currently looking at ${formattedDate} (${dayCount} day view). Time blocks: ${blocksSummary}`,
		);
	});

	import { onMount } from "svelte";
	onMount(() => {
		const handleRefresh = () => fetchTimeBlocksForRange(dateRange);
		window.addEventListener("app-refresh-data", handleRefresh);
		return () => {
			window.removeEventListener("app-refresh-data", handleRefresh);
			chatState.updateUserContext(null);
		};
	});

	async function fetchTimeBlocksForRange(dates: string[]) {
		loadingBlocks = true;
		try {
			const blocksMap = new Map<string, TimeBlock[]>();
			// Fetch blocks for each date in parallel
			const promises = dates.map(async (dateStr) => {
				const blocks = await invoke<TimeBlock[]>("get_time_blocks", {
					date: dateStr,
				});
				return { date: dateStr, blocks };
			});

			const results = await Promise.all(promises);
			results.forEach(({ date, blocks }) => {
				blocksMap.set(date, blocks);
			});

			timeBlocksMap = blocksMap;
		} catch (error) {
			console.error("Failed to fetch time blocks:", error);
			timeBlocksMap = new Map();
		} finally {
			loadingBlocks = false;
		}
	}

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

	// Calculate end time in minutes for a time block
	function getBlockEndMinutes(block: TimeBlock): number {
		const startMinutes = timeToMinutes(block.start_time.slice(0, 5));
		return startMinutes + block.duration;
	}

	// Check if two time blocks are adjacent (end of one = start of another)
	function areBlocksAdjacent(block1: TimeBlock, block2: TimeBlock): boolean {
		const end1 = getBlockEndMinutes(block1);
		const start2 = timeToMinutes(block2.start_time.slice(0, 5));
		return Math.abs(end1 - start2) < 1;
	}

	// Add border classes for adjacent blocks
	function getAdjacentClasses(
		blockIndex: number,
		timeBlocks: TimeBlock[],
	): string {
		const currentBlock = timeBlocks[blockIndex];
		let classes = "";

		if (blockIndex > 0) {
			const prevBlock = timeBlocks[blockIndex - 1];
			if (areBlocksAdjacent(prevBlock, currentBlock)) {
				classes += " border-t-0 ";
			}
		}

		return classes.trim();
	}

	// Filter tasks for a specific date
	function getTasksForDate(tasks: Task[], dateStr: string): Task[] {
		return tasks.filter((t) => t.due_date === dateStr);
	}

	// Group due-only tasks by due_time for markers
	function getDueTasksByTime(tasksForDate: Task[]): Map<string, Task[]> {
		const grouped = new Map<string, Task[]>();

		// Tasks with no due_time go at the top (position -1)
		grouped.set(
			"__top__",
			tasksForDate.filter((t) => !t.due_time),
		);

		// Group remaining by due_time
		tasksForDate
			.filter((t) => t.due_time)
			.forEach((t) => {
				const key = t.due_time!;
				if (!grouped.has(key)) {
					grouped.set(key, []);
				}
				grouped.get(key)!.push(t);
			});

		return grouped;
	}

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

	// Navigation - always moves by 1 day regardless of dayCount
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

	// Check if a date is today
	function isToday(dateStr: string): boolean {
		const today = new Date();
		const d = new Date(dateStr + "T00:00:00");
		return (
			today.getFullYear() === d.getFullYear() &&
			today.getMonth() === d.getMonth() &&
			today.getDate() === d.getDate()
		);
	}

	// Check if first date in range is today
	const showingToday = $derived(isToday(date));

	// Handle time input changes
	function handleStartTimeChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const h = parseTimeToHours(input.value);
		if (!isNaN(h) && h >= 0 && h < 24) {
			startHour = Math.floor(h);
		}
	}

	function handleEndTimeChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const h = parseTimeToHours(input.value);
		if (!isNaN(h) && h > 0 && h <= 24) {
			endHour = Math.ceil(h);
		}
	}

	// Calculate column width based on dayCount
	const columnWidth = $derived(dayCount > 1 ? `${100 / dayCount}%` : "100%");
</script>

<div class="flex flex-col h-full">
	<!-- Header with date navigation and time range inputs -->
	<div class="flex items-center justify-between gap-4 px-4 py-3 border-b">
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="icon" onclick={goToPreviousDay}>
				<ChevronLeft class="size-4" />
			</Button>
			<h2 class="text-lg font-semibold min-w-[200px] text-center">
				{#if showingToday}
					<span class="text-primary">Today</span>
				{:else}
					{formattedDate}
				{/if}
				{#if dayCount > 1}
					<span class="text-sm font-normal text-muted-foreground">
						({dayCount} days)
					</span>
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

	<!-- Day view grid with N columns -->
	<div class="flex-1 overflow-hidden relative">
		<div
			class="flex h-full"
			style="height: {(endHour - startHour + 1) * hourHeight}px;"
		>
			{#each dateRange as dateStr, colIndex}
				{@const dayTasks = getTasksForDate(tasks, dateStr)}
				{@const dayBlocks = timeBlocksMap.get(dateStr) || []}
				{@const dueTasksByTime = getDueTasksByTime(dayTasks)}
				{@const thisIsToday = isToday(dateStr)}

				<div
					class="relative flex-shrink-0 border-r last:border-r-0"
					style="width: {columnWidth};"
				>
					<!-- Date header for column -->
					<div
						class="sticky top-0 z-20 bg-background border-b px-2 py-1 text-center text-sm font-medium"
					>
						{formatColumnDate(dateStr)}
						{#if thisIsToday}
							<span
								class="ml-1 text-xs text-primary font-normal"
							>
								Today
							</span>
						{/if}
					</div>

					<!-- Hour grid lines -->
					<div class="relative h-full overflow-y-auto">
						<div
							class="relative"
							style="height: {(endHour - startHour + 1) * hourHeight}px;"
						>
							{#each hours() as hour, i}
								<div
									class="absolute left-0 right-0 border-t border-border/50"
									style="top: {i * hourHeight}px;"
								>
									<span
										class="absolute -top-4 right-0 z-30 text-[10px] text-muted-foreground/60 px-1"
									>
										{formatHour(hour)}
									</span>
								</div>
							{/each}

							<!-- Current time indicator (only on today's column) -->
							{#if thisIsToday}
								{@const now = new Date()}
								{@const nowMinutes = now.getHours() * 60 + now.getMinutes()}
								{@const startMinutes = startHour * 60}
								{@const endMinutes = endHour * 60}
								{#if nowMinutes >= startMinutes && nowMinutes <= endMinutes}
									{@const topOffset =
										((nowMinutes - startMinutes) / 60) * hourHeight}
									<div
										class="absolute left-0 right-0 z-30 pointer-events-none"
										style="top: topOffset={top}px;"
									>
										<div class="h-px w-full bg-destructive"></div>
									</div>
								{/if}
							{/if}

							<!-- Time blocks -->
							{#if loadingBlocks && colIndex === 0}
								<div
									class="absolute top-4 left-1/2 -translate-x-1/2"
								>
									<Spinner class="size-4" />
								</div>
							{:else if dayBlocks.length === 0}
								<div
									class="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground"
								>
									No blocks
								</div>
							{:else}
								{#each dayBlocks as block, i}
									{@const task = {
										id: block.id,
										title: block.title,
										notes: block.notes || undefined,
										priority: block.priority || undefined,
										due_time: block.start_time.slice(0, 5),
										duration: block.duration,
										completed: block.completed,
										created_at: block.created_at,
										updated_at: block.updated_at,
									}}
									{@const top = getTopOffset(block.start_time)}
									{@const height =
										(block.duration / 60) * hourHeight}
									{@const adjacentClasses = getAdjacentClasses(
										i,
										dayBlocks,
									)}
									<TaskBlock
										{task}
										topOffset={top}
										{height}
										{onTaskClick}
										{adjacentClasses}
									/>
								{/each}
							{/if}

							<!-- Due date markers -->
							{#each [...dueTasksByTime.entries()] as [timeKey, tasksAtTime]}
								{@const top =
									timeKey === "__top__"
										? -10
										: getTopOffset(timeKey)}
								<TaskMarker
									tasks={tasksAtTime}
									topOffset={top}
									{onTaskClick}
								/>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
