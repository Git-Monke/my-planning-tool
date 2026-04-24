<script lang="ts">
	import "../app.css";
	import type { Snippet } from "svelte";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import MainRouteShortcuts from "$lib/components/main-route-shortcuts.svelte";
	import SidebarDesktopHover from "$lib/components/sidebar-desktop-hover.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	const { children }: { children: Snippet } = $props();

	let sidebarOpen = $state(false);
</script>

<Sidebar.SidebarProvider bind:open={sidebarOpen} class="min-h-svh w-full">
	<MainRouteShortcuts />
	<SidebarDesktopHover>
		<Sidebar.Sidebar
			collapsible="icon"
			class="border-sidebar-border border-r"
			variant="sidebar"
		>
			<AppSidebar />
		</Sidebar.Sidebar>
	</SidebarDesktopHover>
	<Sidebar.SidebarInset class="min-w-0">
		<header
			class="bg-background/95 flex h-12 shrink-0 items-center gap-2 border-b px-2 supports-backdrop-filter:bg-background/60 md:hidden"
		>
			<Sidebar.SidebarTrigger />
		</header>
		<div class="flex min-h-0 w-full min-w-0 flex-1">
			<div class="min-h-0 min-w-0 flex-1 overflow-auto p-4">
				{@render children()}
			</div>
			<Separator orientation="vertical" class="h-auto" />
			<div class="bg-muted/15 flex w-64 min-w-0 shrink-0 flex-col border-l md:w-72">
				<div class="border-b px-3 py-2">
					<h2 class="text-sm font-medium">Agent chat</h2>
				</div>
				<ScrollArea class="min-h-0 w-full flex-1">
					<div class="text-muted-foreground p-3 text-sm">Placeholder — conversation will go here.</div>
				</ScrollArea>
			</div>
		</div>
	</Sidebar.SidebarInset>
</Sidebar.SidebarProvider>
