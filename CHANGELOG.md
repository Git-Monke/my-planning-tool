# Changelog

## [Unreleased]

### Added

- **App shell (SvelteKit + shadcn-svelte):** three-region layout with a toggleable **sidebar** (shadcn `Sidebar`, icon collapse), a **main** area for route content, and a right **“Agent chat”** placeholder column with `ScrollArea` and a vertical `Separator`. Global styles remain in `src/app.css` (Inter, theme tokens).
- **Routes:** `/` redirects to `/tasks`; **Tasks** (`/tasks`), **Calendar** (`/calendar`), and **Notes** (`/notes`) are placeholder `Card` views. Top **main navigation** uses `Button` links (`src/lib/components/main-nav.svelte`); the sidebar body is a stub in `src/lib/components/app-sidebar.svelte`.

### Changed

- **Styling (Tailwind v4):** `app.css` now includes an explicit **`@source`** glob under `src/` so utility classes and `@apply` in components are picked up reliably. Base styles set `html` / `body` to `min-h-dvh` and `antialiased` on the root.
- **Sidebar motion:** Replaced `ease-linear` / `200ms` transitions on the main sidebar track, gap, rail, and group label with a **300ms** curve (`cubic-bezier(0.22, 1, 0.36, 1)`), with `will-change` on the sliding panel and `motion-reduce` support on the main container transition.
