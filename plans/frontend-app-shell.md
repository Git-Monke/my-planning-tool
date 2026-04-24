# Frontend app shell (SvelteKit): sidebar, main views, agent chat

## Goal

Lay down the **basic application structure** in Svelte: a **left sidebar** (toggleable), **Task and Calendar views** in the **center** (empty placeholders), and an **agent chat panel** on the **right** (empty placeholder). No real features yet—only layout, routing, and labeled regions on the existing Svelte 5 + SvelteKit + Tauri (`adapter-static`) app.

**UI stack for this work:** the repo now includes **shadcn-svelte** (TypeScript, Tailwind CSS, Bits UI, Nova style, `components.json` with aliases to `$lib/components/ui`). The shell should **compose installed shadcn components** and Tailwind utility classes instead of ad-hoc raw markup, so the result matches the design system and stays accessible.

**Component catalog:** `COMPONENTS.txt` in the repo root lists the full shadcn-svelte component inventory (form, layout, overlays, feedback, display, and misc) with doc links. Use it to choose primitives; add only what the shell needs via the shadcn-svelte CLI so `$lib/components/ui` stays lean.

## Pre-plan investigation

| Question | Answer |
|----------|--------|
| Where is the frontend rooted and how is routing set up? | SvelteKit app at repo root (`src/routes/`). Today: only `+layout.ts` (prerender + `ssr: false`) and `+page.svelte` (Tauri/Vite/SvelteKit boilerplate). |
| Is there an existing app shell or layout component? | No `+layout.svelte` yet—greenfield for the shell. **Styling** is not greenfield: shadcn-svelte is wired (`components.json`, `src/app.css` with `tailwindcss`, `shadcn-svelte/tailwind.css`, Inter, CSS variables for theme + sidebar). |
| What constraints does Tauri/static adapter impose? | `adapter-static` + `ssr: false` (per `+layout.ts`); layout must work as a static client bundle (no reliance on SSR for the shell). |
| What styling/fonts direction exists? | **shadcn theming** via `:root` / `.dark` variables in `src/app.css` (taupe base, zero radius in config); `AGENTS.md` still frames product direction (minimal/square, Inter, future pastel browns)—extend variables later rather than one-off colors in components. |
| shadcn-svelte: what is available vs installed? | `COMPONENTS.txt` is the full registry of components you *can* add. Project aliases: `ui` → `$lib/components/ui`, `components` → `$lib/components`, `utils` → `$lib/utils`. Install per feature with the official CLI; do not hand-copy unrelated components. |
| Where should this plan live? | `plans/frontend-app-shell.md` (this file), for Plannotator review before implementation. |

## shadcn-svelte alignment (shell pass)

| Shell area | Suggested shadcn components (from `COMPONENTS.txt`) | Notes |
|------------|------------------------------------------------------|--------|
| Left column | **Sidebar** | First-class app sidebar pattern; uses existing `--sidebar-*` tokens in `app.css`. Add via CLI when implementing. |
| Collapse / actions | **Button**, optionally **Collapsible** or sidebar’s own trigger patterns | Lucide is configured as the icon set in `components.json`. |
| Center ↔ route nav | **Tabs** *or* `Button` / **Navigation Menu** *or* plain `<a>` styled with `buttonVariants` | Plan still defaults to **separate routes** (`/tasks`, `/calendar`) for URLs; if using Tabs, keep them as visual mirror of the route or use links inside tab triggers so behavior stays clear. |
| Main / chat column layout | **Scroll Area**, **Separator**, **Card** (optional frames for placeholders) | Keeps long chat content scrollable without breaking the grid. |
| Resizable three columns (optional) | **Resizable** | Only if you want user-adjustable column widths; otherwise CSS grid/flex is enough for v1. |

**Not in scope for the placeholder shell:** full **Calendar** / **Range Calendar** / **Date Picker** UIs in the center view (those are for real calendar feature work). The `/calendar` route remains a titled empty state unless product asks otherwise.

## Files to change

| Path | Reason |
|------|--------|
| `src/lib/components/ui/*` (new, via CLI) | Add shadcn primitives the shell needs (e.g. `sidebar`, `button`, `scroll-area`, `separator`, `card`—exact set chosen during implementation to avoid unused UI). |
| `src/routes/+layout.svelte` (new) | Root layout: full-viewport flex/grid shell with sidebar, `<slot />` for main content, and agent chat column; compose shadcn layout components. |
| `src/routes/+page.svelte` | Remove Tauri template demo; replace with a minimal stub **or** delete only if the toolchain still accepts the route with `+page.ts` alone (if not, keep an empty/minimal page). |
| `src/routes/+page.ts` (new) | `load` that **`throw redirect(303, '/tasks')`** (or `/calendar`) so `/` lands on a concrete center view. Use `import { redirect } from '@sveltejs/kit'` (not `$app/navigation`, which is for client-side `goto`). |
| `src/routes/tasks/+page.svelte` (new) | Empty Task view placeholder in the center column (optionally wrapped in `Card` or typography utilities). |
| `src/routes/calendar/+page.svelte` (new) | Empty Calendar view placeholder in the center column. |
| `src/lib/...` (new, as needed) | Thin wrappers: e.g. `AppSidebar` / `AgentChatPanel` / `MainNav` that *use* `$lib/components/ui/*`, keeping `+layout.svelte` small. |
| `src/app.css` | Already central for Tailwind + shadcn. Prefer **tweaking CSS variables** over scattered custom CSS; only add global layout rules if the shell cannot be done with utilities + shadcn. |
| `CHANGELOG.md` | Document user-facing UI structure change (new navigation regions and routes). Per project rules, record meaningful app shell / routing changes. |

**Unchanged (unless implementation reveals a need):** `src/routes/+layout.ts` (prerender/ssr), `svelte.config.js`, `components.json` style/base — already aligned with shadcn; `app.html` unless a root class or script is required.

## Implementation steps

1. **Add shadcn components for the shell** using the project CLI and `COMPONENTS.txt` as reference (e.g. `sidebar`, `button`, `scroll-area`, `separator`; add `card` or `tabs` if needed). Import from `$lib/components/ui/...` per shadcn-svelte patterns.
2. **Add root `+layout.svelte`** with a full-height structure: left (collapsible) **Sidebar** (or sidebar layout primitives), center (`<slot />`), right column for agent chat. Use CSS Grid or flex with Tailwind; ensure `html`, `body`, and the SvelteKit root fill the viewport (`min-h-dvh`, etc.).
3. **Implement sidebar toggle** with Svelte 5 state (e.g. `let open = $state(true)`) and shadcn **Button** / sidebar APIs—no bespoke invisible hit targets.
4. **Placeholder copy only** in each region: short headings like "Sidebar", "Tasks" / "Calendar", "Agent chat" — no business logic, no Tauri `invoke` in the shell.
5. **Split Task / Calendar in the center** via `src/routes/tasks/+page.svelte` and `src/routes/calendar/+page.svelte` with distinct placeholder headings. Add minimal **center-column nav** (e.g. `Button` `variant="ghost"` as links, or `Tabs` + links) so both views are reachable.
6. **Default route:** add `src/routes/+page.ts` with a `load` that **`throw redirect(303, '/tasks')`** so `/` immediately lands on Tasks. Fallback if static prerender complains: client `onMount` + `goto('/tasks')` from `$app/navigation`, but prefer the `load` redirect first.
7. **Remove boilerplate** from the current root `+page.svelte` (greet demo, logo row) once the redirect/stub strategy is in place.
8. **Optional:** extract `AppSidebar`, `AgentChat`, `MainNav` into `src/lib/components/`; each file should delegate presentation to shadcn primitives.
9. **Run `npm run check`** to validate TypeScript and Svelte; fix any layout typing issues.
10. **Update `CHANGELOG.md`** (e.g. "Added") describing the app shell and `/tasks` + `/calendar` routes.

## Open questions

- **Routing vs. tabs:** This plan still prefers **separate routes** (`/tasks`, `/calendar`) for shareable URLs. If you prefer **one route** and local tab state only, swap the center for a single page toggling two empty child components with `$state` and optional shadcn **Tabs**.
- **Spelling / naming:** Request said "Calender"; confirm user-visible copy vs. route segment (`/calendar` is the conventional spelling).
- **Theme:** `app.css` already defines shadcn semantic tokens; future **pastel brown** direction should adjust those variables rather than bypassing the system.
- **Prerender + redirect:** Confirm root `+page.ts` `throw redirect(...)` prerenders cleanly with `adapter-static` and `prerender = true`; if the static crawl errors, use the client `goto` fallback or a tiny static landing stub.
- **Sidebar bundle size:** The official **Sidebar** is powerful but pulls multiple primitives; if the first pass must stay minimal, start with a simpler column + **Button** + **Scroll Area** and migrate to the full Sidebar in a follow-up (still shadcn-based).

## Investigation notes (for reviewers)

- Stack: SvelteKit 2, Svelte 5 (`$state` in current `+page.svelte`), Tauri, `ssr: false`, `prerender: true` in `src/routes/+layout.ts`.
- **shadcn-svelte** is integrated: Nova style, taupe `baseColor`, Lucide icons, aliases in `components.json`, Tailwind v4 + `shadcn-svelte/tailwind.css` in `src/app.css`.
- No `+layout.svelte` yet; `src/lib/components/ui` is populated as components are **added**—plan assumes CLI adds for the shell rather than custom one-off controls.
- Reference: `COMPONENTS.txt` (repo catalog of shadcn-svelte components and doc links).
