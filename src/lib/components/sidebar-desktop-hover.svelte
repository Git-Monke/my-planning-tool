<script lang="ts">
	import type { Snippet } from "svelte";
	import { useSidebar } from "$lib/components/ui/sidebar/context.svelte.js";

	const { children }: { children: Snippet } = $props();

	const sidebar = useSidebar();

	const LEAVE_MS = 200;
	let leaveTimer: ReturnType<typeof setTimeout> | undefined;

	function clearLeave() {
		if (leaveTimer !== undefined) {
			clearTimeout(leaveTimer);
			leaveTimer = undefined;
		}
	}

	function handleEnter() {
		if (sidebar.isMobile) return;
		clearLeave();
		sidebar.setOpen(true);
	}

	function handleLeave() {
		if (sidebar.isMobile) return;
		clearLeave();
		leaveTimer = setTimeout(() => {
			sidebar.setOpen(false);
			leaveTimer = undefined;
		}, LEAVE_MS);
	}
</script>

{#if sidebar.isMobile}
	{@render children?.()}
{:else}
	<div
		class="h-full min-h-svh shrink-0"
		role="presentation"
		onmouseenter={handleEnter}
		onmouseleave={handleLeave}
	>
		{@render children?.()}
	</div>
{/if}
