<script lang="ts">
	import { page } from "$app/state";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	const pathname = $derived(page.url.pathname);
</script>

<Sidebar.SidebarMenu aria-label="Main">
	<Sidebar.SidebarMenuItem>
		<Sidebar.SidebarMenuButton
			isActive={pathname.startsWith("/tasks") || pathname === "/"}
			tooltipContent="Tasks"
		>
			{#snippet child({ props })}
				<a
					{...props}
					href="/tasks"
					aria-current={pathname === "/tasks" || pathname === "/" ? "page" : undefined}
				>
					Tasks
				</a>
			{/snippet}
		</Sidebar.SidebarMenuButton>
	</Sidebar.SidebarMenuItem>
	<Sidebar.SidebarMenuItem>
		<Sidebar.SidebarMenuButton
			isActive={pathname.startsWith("/calendar")}
			tooltipContent="Calendar"
		>
			{#snippet child({ props })}
				<a
					{...props}
					href="/calendar"
					aria-current={pathname.startsWith("/calendar") ? "page" : undefined}
				>
					Calendar
				</a>
			{/snippet}
		</Sidebar.SidebarMenuButton>
	</Sidebar.SidebarMenuItem>
	<Sidebar.SidebarMenuItem>
		<Sidebar.SidebarMenuButton isActive={pathname.startsWith("/notes")} tooltipContent="Notes">
			{#snippet child({ props })}
				<a
					{...props}
					href="/notes"
					aria-current={pathname.startsWith("/notes") ? "page" : undefined}
				>
					Notes
				</a>
			{/snippet}
		</Sidebar.SidebarMenuButton>
	</Sidebar.SidebarMenuItem>
</Sidebar.SidebarMenu>
