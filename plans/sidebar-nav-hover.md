# Sidebar navigation + hover open/close

## Pre-plan scope (questions we needed answered)

1. **Where is "Tasks / Calendar / Notes" rendered?** In `src/lib/components/main-nav.svelte`, included from the `SidebarInset` header in `src/routes/+layout.svelte` next to `Sidebar.SidebarTrigger`.
2. **Where is the app sidebar defined and what lives in it today?** The shadcn `Sidebar` tree is in `src/routes/+layout.svelte` (`Sidebar.Sidebar` + header + `AppSidebar`). `src/lib/components/app-sidebar.svelte` is a placeholder "Sidebar" group (no route links yet).
3. **How does open/close work on desktop?** `Sidebar.SidebarProvider` is bound to `sidebarOpen` in the layout. `Sidebar.SidebarTrigger` calls `useSidebar().toggle()`. The sidebar uses `collapsible="icon"` (from layout), so "closed" is **icon-collapsed** rather than full off-canvas. State lives in `src/lib/components/ui/sidebar/context.svelte.ts` (`setOpen`, `toggle`, `isMobile` for the mobile sheet).
4. **What UI primitives exist for edge interaction?** `src/lib/components/ui/sidebar/sidebar-rail.svelte` is a thin **click**-to-toggle rail; it is exported as `SidebarRail` but the root layout does not currently render it. Hover classes exist for off-canvas in the rail, but behavior is still **toggle on click**, not open-on-hover.
5. **Can `useSidebar()` be used from the layout script?** No — context is only available to **descendants** of `Sidebar.SidebarProvider`. Any hover/keyboard fallbacks that call `setOpen` should live in a child component (or a wrapper placed under the provider), not the layout `<script>` alone.

## Goal

Move the main route navigation (Tasks, Calendar, Notes) from the top header into the **left sidebar**, and change desktop behavior so the sidebar **expands on pointer hover** and **collapses on pointer leave** of the combined hover region, **replacing the primary open/close interaction via the header trigger button**.

**Decided product rules:** on desktop, the sidebar is **`collapsible="icon"` with `open` / expanded only while hovered**; when not hovered it stays in **icon mode** (it does not disappear off-canvas). The **default on load** is **collapsed (icon mode)** until the user hovers. **Collapsing** is driven by **`mouseleave` only**—no extra “collapse on navigation click” behavior for now. Mobile/touch and existing keyboard affordances (e.g. `SidebarTrigger` on small screens, `Cmd/Ctrl+b` hotkey) stay available; do **not** add cookie/persistence work or `prefers-reduced-motion` handling in this pass unless a bug forces it.

## Files to change

| Path | Reason |
|------|--------|
| `src/routes/+layout.svelte` | Remove `MainNav` from the `SidebarInset` header; remove or gate `Sidebar.SidebarTrigger` for desktop; set **`let sidebarOpen = $state(false)`** so the shell starts in **icon mode**; keep **`collapsible="icon"`** (no switch to `offcanvas` for “closed”); ensure sidebar + `AppSidebar` still compose cleanly. |
| `src/lib/components/app-sidebar.svelte` (and/or a small new wrapper) | Mount the main navigation in the sidebar body (e.g. `Sidebar.Group` + `Sidebar.Menu` + `MainNav` or inlined links using `SidebarMenuButton`), replacing or augmenting the placeholder copy. This is the natural home for the moved links. |
| `src/lib/components/main-nav.svelte` | Refactor to use **shadcn sidebar menu** primitives for visual/behavioral consistency (optional but recommended) or keep `Button` links but with classes aligned to `SidebarMenuButton` / active states; update `aria`/`data-active` to match the sidebar’s active item pattern. |
| **New (recommended):** `src/lib/components/sidebar-desktop-hover.svelte` (name flexible) | Encapsulate **desktop-only** `mouseenter` / `mouseleave` (and optional `focusin` / `focusout` or leave-delay) and call `useSidebar().setOpen(true|false)`, skipping when `sidebar.isMobile` so the mobile **Sheet** flow stays explicit. Sits **inside** `Sidebar.SidebarProvider` as a child. |
| `src/lib/components/ui/sidebar/sidebar.svelte` or `sidebar-rail.svelte` | **Only if** the generic hover behavior is implemented by extending the existing rail/edge affordance; prefer **not** to fork shadcn unless necessary—first try a dedicated hover wrapper to avoid large upstream diffs. |
| `CHANGELOG.md` | Per project rules, record the user-facing navigation and sidebar interaction change. |

**Likely unchanged:** `src/routes/+layout.ts` (ssr/prerender), route pages, `context.svelte.ts` API (unless a small, justified extension is needed—prefer `setOpen` from a child first).

## Implementation steps

1. **Relocate the nav (structure only).** In `+layout.svelte`, remove `MainNav` from the `header` next to the trigger. Import and render it inside the left `Sidebar` column—`app-sidebar.svelte` is a good first location so the header stays a thin top bar (or only chat-related controls if any are added later).
2. **Style the nav in the sidebar.** Either refactor `main-nav.svelte` to use `Sidebar.Menu` / `Sidebar.SidebarMenuButton` + `isActive` (via `page` from `$app/state`) or keep semantic `<a>`/buttons with classnames copied from the sidebar button variants. Preserve route highlighting (`/`, `/tasks`, `/calendar`, `/notes`) consistent with current `pathname` logic.
3. **Add a desktop hover controller component.** Create a child of `Sidebar.SidebarProvider` that calls `useSidebar()` and:
   - On **non-mobile** (`!sidebar.isMobile`), attach pointer hover handlers to: (a) a **left-edge hit strip** and/or (b) the **sidebar surface** (including the expanded panel), so moving between edge and content does not accidentally fire `mouseleave` and collapse (often solved by a **single wrapper** around both the hit strip and the fixed sidebar, or a short **debounced leave** timer, e.g. 150–300ms).
   - On **enter**, `setOpen(true)`; on **leave** of the combined hover region, `setOpen(false)` — **this is the only automatic collapse on desktop** (do not add “collapse when a nav link is clicked” in this pass).
4. **Adjust the header trigger for touch and keyboard fallbacks.**
   - **Mobile:** keep `SidebarTrigger` (or equivalent) for opening the `Sheet` sidebar—hover does not exist on touch.
   - **Desktop:** hide the header trigger visually (e.g. `class="md:hidden"`) so hover is the primary expand interaction; the existing **`Cmd/Ctrl+b`** handler in the sidebar context remains available without extra work.
5. **Initial state:** in `+layout.svelte` use **`let sidebarOpen = $state(false)`** so the first paint is **icon mode**; the **icon rail remains visible** as the hover target (per `collapsible="icon"`).
6. **Verify responsive behavior** at the `isMobile` breakpoint used by `IsMobile` (`$lib/hooks/is-mobile.svelte.js`): sheet open/close, no desktop hover listeners firing incorrectly.
7. **Run `npm run check`** and fix any Svelte/TS issues from moved imports or new components.
8. **Update `CHANGELOG.md`** with a user-facing line: main nav in sidebar; desktop expands on hover and returns to icon mode on leave; default collapsed on load.

## Open questions

- **None for now** — the items below were **decided** during plan review: default **collapsed (icon) until hover**, **`collapsible="icon"` / “closed” = icon mode** (not off-canvas), **collapse via `mouseleave` only** (not on link click), and **no** cookie/persistence or `prefers-reduced-motion` work in this iteration.

## Investigation notes (for reviewers)

- **Main nav** is only `src/lib/components/main-nav.svelte` (three `Button` links with `href` and active state from `page.url.pathname`).
- **App shell** is `src/routes/+layout.svelte`: `SidebarProvider` → `Sidebar` (with header "App" + `AppSidebar`) → `SidebarInset` (header: trigger + `MainNav`, then main + chat columns).
- **Open state API:** `setOpen(boolean)`, `toggle()`, `isMobile` in `context.svelte.ts`.
- **SidebarRail** exists (`sidebar-rail.svelte`) for edge toggle but is **not** in the app layout; it may inform hover-zone placement or be left unused if a custom hover wrapper is simpler.
