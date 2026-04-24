<script lang="ts">
	import { goto } from "$app/navigation";

	function isTypingContext(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		return Boolean(target.closest("input, textarea, select, [contenteditable=true]"));
	}

	function handleMainRouteKeydown(e: KeyboardEvent) {
		if (e.repeat) return;
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		if (isTypingContext(e.target)) return;

		const k = e.key.length === 1 ? e.key.toLowerCase() : "";
		let href: string | null = null;
		if (k === "e") href = "/tasks";
		else if (k === "r") href = "/calendar";
		else if (k === "t") href = "/notes";
		else return;

		e.preventDefault();
		void goto(href);
	}
</script>

<svelte:window onkeydown={handleMainRouteKeydown} />
