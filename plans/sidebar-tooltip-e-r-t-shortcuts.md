# Plan: Disable sidebar nav tooltips + E/R/T route shortcuts

## Goal

Remove the hover name labels on collapsed sidebar nav items (redundant now that the sidebar expands on hover), and add **single-key** shortcuts **E → Tasks**, **R → Calendar**, **T → Notes** so users can jump routes from the keyboard.

## Investigation summary (questions answered)

1. **Where do the “little name description” labels come from?** `src/lib/components/main-nav.svelte` passes `tooltipContent="Tasks" | "Calendar" | "Notes"` into `Sidebar.SidebarMenuButton`. `sidebar-menu-button.svelte` wraps the button in `Tooltip.Root` whenever `tooltipContent` is set; tooltip content is shown when `sidebar.state === "collapsed"` and not mobile (`hidden={sidebar.state !== "collapsed" || sidebar.isMobile}`). **Only `main-nav.svelte` supplies `tooltipContent` in this repo** (no other call sites).
2. **Where does global keyboard handling live today?** `Sidebar.SidebarProvider` (`sidebar-provider.svelte`) attaches `<svelte:window onkeydown={sidebar.handleShortcutKeydown} />`. `SidebarState.handleShortcutKeydown` in `context.svelte.ts` handles **Ctrl/Cmd + `b`** for sidebar toggle. Navigation shortcuts should **not** be bolted onto `SidebarState` unless you want navigation coupled to the sidebar package; a separate window handler keeps concerns separate.
3. **What are the Tasks / Calendar / Notes URLs?** From `main-nav.svelte`: `/tasks` (also active for `/`), `/calendar`, `/notes`.

## Files to change

| Path | Reason |
|------|--------|
| `src/lib/components/main-nav.svelte` | Remove the three `tooltipContent="..."` props so collapsed items no longer get the shadcn tooltip wrapper (behavior is already “no tooltip” when `tooltipContent` is omitted). |
| `src/routes/+layout.svelte` | Attach a small **app-level** `keydown` handler (or render a tiny child component that owns `<svelte:window onkeydown={...} />`) so **E / R / T** call SvelteKit `goto` for `/tasks`, `/calendar`, `/notes`. Keeps shortcuts on every page without modifying vendored sidebar internals. |
| **Optional new file** e.g. `src/lib/components/main-route-shortcuts.svelte` | If you prefer the layout script to stay minimal: one component with `<svelte:window>` + guards + `goto`, imported once from `+layout.svelte`. |
| `CHANGELOG.md` | User-facing: tooltips removed on main nav when collapsed; keyboard shortcuts E/R/T for main routes (per project changelog rules). |

**Likely unchanged:** `sidebar-menu-button.svelte` (generic primitive), `context.svelte.ts` / `sidebar-provider.svelte` (unless you deliberately centralize all shortcuts there—discouraged for readability).

## Implementation steps

1. **Turn off nav tooltips:** In `main-nav.svelte`, delete the `tooltipContent="Tasks"`, `tooltipContent="Calendar"`, and `tooltipContent="Notes"` attributes from the three `Sidebar.SidebarMenuButton` instances. Verify collapsed hover: icons only, no floating label, sidebar still expands on hover as today.
2. **Add route shortcuts (behavior):** Implement a `keydown` listener that:
   - Maps **`e` / `r` / `t`** (recommend **case-insensitive** via `e.key.toLowerCase()`) to **`goto("/tasks")`**, **`goto("/calendar")`**, **`goto("/notes")`** respectively, using `$app/navigation`’s `goto`.
   - **Ignores** the event when the user is typing in a field: e.g. target is `input`, `textarea`, `select`, or `[contenteditable="true"]` (use `closest(...)` on `event.target` if it’s an `HTMLElement`).
   - **Ignores** when **modifier keys** are held (`ctrlKey`, `metaKey`, `altKey`) so **browser shortcuts** (e.g. **Ctrl+R** refresh, **Ctrl+T** new tab) keep working; only handle “plain” E/R/T.
   - Optionally ignore `e.repeat === true` to avoid navigation spam while holding a key.
   - Call **`e.preventDefault()`** only when you actually handle the key (after guards pass), to avoid stealing defaults unnecessarily.
3. **Wire the listener once:** Add `<svelte:window onkeydown={handler} />` in `+layout.svelte` (or the optional wrapper component) **inside** the app tree so it runs for all main routes. No need to duplicate per-route.
4. **Manual QA:** Collapsed sidebar: no tooltips; expanded: unchanged labels. Press **e / r / t** on a blank area: navigates. Focus inside a text input in a future Notes UI: keys type normally. **Ctrl+R** still refreshes. Mobile: same shortcuts if desired (no change to mobile sheet); confirm tooltips were desktop-only anyway.
5. **`npm run check`** then update **`CHANGELOG.md`** under `[Unreleased]` with one short **Changed** or **Added** bullet for shortcuts + tooltip removal.

## Open questions

- **Exact key policy:** This plan assumes **lowercase and uppercase** both work (`E`/`e` etc.) and **no modifiers**. If the product owner wants **Shift+E** only or **g-** style prefixes, adjust the guard logic accordingly.
- **Scope of “typing”:** Using `input/textarea/select/contenteditable` is standard; rich editors or custom widgets may need extra `data-no-shortcuts` hooks later—none required for current placeholder pages.
- **Accessibility / discoverability:** Single-letter shortcuts are not self-evident; consider a future **Help** surface or `aria-keyshortcuts` on nav items—out of scope unless requested.

## Submit for review

This document is ready for review; **no implementation** has been performed per instructions.
