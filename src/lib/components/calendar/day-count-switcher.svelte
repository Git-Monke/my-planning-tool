<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { cn } from "$lib/utils";

	let {
		dayCount = $bindable(1),
		disabled = false,
	}: {
		dayCount?: number;
		disabled?: boolean;
	} = $props();

	const options: { value: number; label: string }[] = [
		{ value: 1, label: "1 Day" },
		{ value: 3, label: "3 Days" },
		{ value: 7, label: "7 Days" },
	];

	function selectDayCount(value: number) {
		if (disabled && value > 1) return;
		dayCount = value;
	}
</script>

<div class="flex items-center gap-1 rounded-md bg-muted p-1">
	{#each options as option}
		{@const isActive = dayCount === option.value}
		{@const isDisabled = disabled && option.value > 1}
		<Button
			variant="ghost"
			size="sm"
			class={cn(
				"h-7 px-3 text-xs transition-all",
				isActive
					? "bg-background shadow-sm text-foreground"
					: "text-muted-foreground hover:text-foreground",
				isDisabled && "opacity-40 cursor-not-allowed",
			)}
			onclick={() => selectDayCount(option.value)}
			disabled={isDisabled}
		>
			{option.label}
		</Button>
	{/each}
</div>
