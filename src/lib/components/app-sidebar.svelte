<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	const { class: className = "" } = $props<{
		class?: string;
	}>();
</script>

<Sidebar.Content class="gap-0 {className}" id="app-sidebar">
	<Sidebar.Group>
		<Sidebar.GroupLabel>Sidebar</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			<p class="text-muted-foreground px-2 text-sm">App navigation and lists will go here.</p>
		</Sidebar.GroupContent>
	</Sidebar.Group>
</Sidebar.Content>
