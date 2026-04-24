<script lang="ts">
	import { page } from "$app/state";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ListTodoIcon from "@lucide/svelte/icons/list-todo";

	const pathname = $derived(page.url.pathname);
</script>

<Sidebar.SidebarMenu aria-label="Main">
	<Sidebar.SidebarMenuItem>
		<Sidebar.SidebarMenuButton isActive={pathname.startsWith("/tasks") || pathname === "/"}>
			{#snippet child({ props })}
				<a
					{...props}
					href="/tasks"
					aria-current={pathname === "/tasks" || pathname === "/" ? "page" : undefined}
				>
					<ListTodoIcon class="shrink-0" />
					<span class="truncate group-data-[state=collapsed]:hidden">Tasks</span>
				</a>
			{/snippet}
		</Sidebar.SidebarMenuButton>
	</Sidebar.SidebarMenuItem>
	<Sidebar.SidebarMenuItem>
		<Sidebar.SidebarMenuButton isActive={pathname.startsWith("/calendar")}>
			{#snippet child({ props })}
				<a
					{...props}
					href="/calendar"
					aria-current={pathname.startsWith("/calendar") ? "page" : undefined}
				>
					<CalendarIcon class="shrink-0" />
					<span class="truncate group-data-[state=collapsed]:hidden">Calendar</span>
				</a>
			{/snippet}
		</Sidebar.SidebarMenuButton>
	</Sidebar.SidebarMenuItem>
	<Sidebar.SidebarMenuItem>
		<Sidebar.SidebarMenuButton isActive={pathname.startsWith("/notes")}>
			{#snippet child({ props })}
				<a
					{...props}
					href="/notes"
					aria-current={pathname.startsWith("/notes") ? "page" : undefined}
				>
					<FileTextIcon class="shrink-0" />
					<span class="truncate group-data-[state=collapsed]:hidden">Notes</span>
				</a>
			{/snippet}
		</Sidebar.SidebarMenuButton>
	</Sidebar.SidebarMenuItem>
</Sidebar.SidebarMenu>
