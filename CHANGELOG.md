# Changelog

## [Unreleased]

### Added

- **App shell (SvelteKit + shadcn-svelte):** three-region layout with a toggleable **sidebar** (shadcn `Sidebar`, icon collapse), a **main** area for route content, and a right **“Agent chat”** placeholder column with `ScrollArea` and a vertical `Separator`. Global styles remain in `src/app.css` (Inter, theme tokens).
- **Routes:** `/` redirects to `/tasks`; **Tasks** (`/tasks`) and **Calendar** (`/calendar`) are placeholder `Card` views. Top **main navigation** uses `Button` links (`src/lib/components/main-nav.svelte`); the sidebar body is a stub in `src/lib/components/app-sidebar.svelte`.
