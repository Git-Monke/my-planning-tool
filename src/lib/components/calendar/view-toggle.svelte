<script lang="ts">
	import { Button } from "$lib/components/ui/button";

	type ViewType = "day" | "month";

	let {
		currentView = $bindable("day"),
		onViewChange,
	}: {
		currentView?: ViewType;
		onViewChange?: (view: ViewType) => void;
	} = $props();

	const views: { value: ViewType; label: string }[] = [
		{ value: "day", label: "Day" },
		{ value: "month", label: "Month" },
	];

	function selectView(view: ViewType) {
		currentView = view;
		onViewChange?.(view);
	}
</script>

<div class="flex items-center gap-1 rounded-md bg-muted p-1">
	{#each views as view}
		<Button
			variant="ghost"
			size="sm"
			class="h-7 px-3 text-xs {currentView === view.value
				? 'bg-background shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => selectView(view.value)}
		>
			{view.label}
		</Button>
	{/each}
</div>
