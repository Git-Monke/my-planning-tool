# Tasks Spacing Cleanup

## Goal
Establish a single consistent spacing scale across the tasks page and task-list component so that intra-list gaps, section-to-section gaps, and page chrome all feel intentionally related rather than arbitrary.

## Problem Diagnosis

### Current state (all values in Tailwind shorthand → px equivalent)

| Location | Class | Value |
|---|---|---|
| Page wrapper top/bottom | `py-12` | 48 px |
| Page wrapper sides | `px-6` | 24 px |
| Group-to-group gap | `mb-8` | 32 px |
| Card header padding | `px-1 py-2` | 4 / 8 px |
| Card content padding | `px-1 py-0` | 4 / 0 px |
| Item gap inside list | `space-y-1` | 4 px |
| TaskItem vertical pad | `py-3` | 12 px |
| TaskItem horizontal pad | `px-2` | 8 px |

### Root inconsistencies
1. **Cramped items vs. loose groups.** Items are only 4 px apart (`space-y-1`) but groups are 32 px apart (`mb-8`). The ratio is ~8 : 1, which is too extreme — the groups feel like separate pages rather than sections.
2. **`Card.Content` has no top padding** (`py-0`) so the section label and the first task item are separated only by the card header's `py-2` (8 px bottom), which reads as too tight.
3. **`px-1` on card wrappers vs. `px-2` on task items.** The card strips add 4 px of left offset, and the item adds another 8 px, producing an unequal indent compared to the section title which only has 4 px.
4. **`py-12` page top is excessive** — it pushes the first section header far down the viewport for no compositional reason.

## Files to Change

| File | Reason |
|---|---|
| `src/routes/tasks/+page.svelte` | Reduce outer page padding to something more proportionate |
| `src/lib/components/tasks/task-list.svelte` | Fix header/content padding and item gap |

> `task-item.svelte` internal padding (`py-3 px-2`) is fine — do **not** touch it.

## Implementation Steps

### Step 1 — Page wrapper: tighten vertical chrome

**File:** `src/routes/tasks/+page.svelte`

Change:
```svelte
<div class="max-w-2xl mx-auto py-12 px-6">
```
To:
```svelte
<div class="max-w-2xl mx-auto py-8 px-6">
```

Rationale: `py-8` (32 px) is still generous but now matches the group gap (`mb-8`), so the page top and the first section header have the same visual weight as two consecutive section gaps — feels intentional rather than accidental.

---

### Step 2 — Task list: fix header padding

**File:** `src/lib/components/tasks/task-list.svelte`

Change `Card.Header`:
```svelte
<Card.Header class="px-1 py-2">
```
To:
```svelte
<Card.Header class="px-0 pt-0 pb-3">
```

Rationale:
- `px-0` makes the section title's left edge flush with the task item checkbox column — consistent horizontal anchor.
- `pt-0` removes the stray 8 px above the title; the page or group gap above provides enough breathing room.
- `pb-3` (12 px) gives a deliberate gap between the section label and the first item.

---

### Step 3 — Task list: fix content padding and item gap

**File:** `src/lib/components/tasks/task-list.svelte`

Change `Card.Content`:
```svelte
<Card.Content class="px-1 py-0 space-y-1">
```
To:
```svelte
<Card.Content class="px-0 py-0 space-y-0.5">
```

Rationale:
- `px-0` aligns with the flush title (step 2) — the task item's own `px-2` provides the left visual indent.
- `space-y-0.5` (2 px) replaces `space-y-1` (4 px). Since each `TaskItem` already has `py-3` (12 px top + 12 px bottom), the effective visual gap between row hover-targets is `12 + 2 + 12 = 26 px` — proportionate and comfortable without being overly airy.

---

### Step 4 — Task list: tighten group-to-group gap

**File:** `src/lib/components/tasks/task-list.svelte`

Change `Card.Root`:
```svelte
<Card.Root class="mb-8 last:mb-0 border-none shadow-none bg-transparent">
```
To:
```svelte
<Card.Root class="mb-6 last:mb-0 border-none shadow-none bg-transparent">
```

Rationale: `mb-6` (24 px) is still clearly a section break but no longer dwarfs the inter-item rhythm. The final spacing hierarchy reads: page top 32 px → section gap 24 px → label-to-first-item 12 px → item-to-item ~26 px perceived (12 py + 2 gap + 12 py).

---

## Final Spacing Hierarchy (after changes)

| Level | Value | Tailwind |
|---|---|---|
| Page top/bottom chrome | 32 px | `py-8` |
| Section-to-section gap | 24 px | `mb-6` |
| Section label → first item | 12 px | `pb-3` on header |
| Item row perceived gap | ~26 px | `py-3` per item + `space-y-0.5` |
| Horizontal alignment | item's own `px-2` | title and items left-flush |

## Open Questions
- None. Scope is fully determined by reading the two target files.
