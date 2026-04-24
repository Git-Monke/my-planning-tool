<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button/index.js";

	const pathname = $derived(page.url.pathname);
</script>

<nav class="flex flex-wrap items-center gap-1" aria-label="Main">
	<Button
		variant={pathname.startsWith("/tasks") || pathname === "/" ? "secondary" : "ghost"}
		href="/tasks"
		aria-current={pathname === "/tasks" || pathname === "/" ? "page" : undefined}
	>
		Tasks
	</Button>
	<Button
		variant={pathname.startsWith("/calendar") ? "secondary" : "ghost"}
		href="/calendar"
		aria-current={pathname.startsWith("/calendar") ? "page" : undefined}
	>
		Calendar
	</Button>
	<Button
		variant={pathname.startsWith("/notes") ? "secondary" : "ghost"}
		href="/notes"
		aria-current={pathname.startsWith("/notes") ? "page" : undefined}
	>
		Notes
	</Button>
</nav>
