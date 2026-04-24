<script lang="ts">
	import MainNav from "$lib/components/main-nav.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	const { class: className = "" } = $props<{
		class?: string;
	}>();
</script>

<Sidebar.Content class="gap-0 {className}" id="app-sidebar">
	<Sidebar.Group>
		<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			<MainNav />
		</Sidebar.GroupContent>
	</Sidebar.Group>
</Sidebar.Content>
