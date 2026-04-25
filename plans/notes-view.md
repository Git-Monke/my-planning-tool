# Notes View Implementation Plan

## Context
The user wants a simple notes view that mirrors the tasks view structure but for notes. It should have:
- A title bar with "Notes" header
- A full-width search bar (square/flush)
- A "+ New Note" button area
- Simple note boxes with title and description
- Real-time search filtering

## Approach
Build the notes view using SvelteKit with local state and sample data (no backend persistence yet). Reuse existing UI components (Input, Card) and follow the tasks view pattern for the header structure.

## Files to Modify
1. `src/routes/notes/+page.svelte` - Main notes page (replace existing placeholder)
2. `src/lib/types.ts` - Add a `Note` type interface

## Reuse
- `src/lib/components/ui/input/input.svelte` - Search input
- `src/lib/components/ui/card/card.svelte` - Note cards
- `src/lib/components/ui/spinner` - Loading state
- `src/routes/tasks/+page.svelte` - Reference for header pattern

## Implementation Steps

### Step 1: Add Note type to types.ts
```typescript
export interface Note {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}
```

### Step 2: Create the notes page structure
Following the tasks view pattern:
- Title bar with "Notes" heading (no extra padding beyond header)
- Full-width search input (no rounded corners, flush with edges)
- "+ New Note" card at top (same size as notes)
- Single column list of note cards
- Real-time filtering via `$derived` state

### Step 3: Implement note cards
Notes are **permanently editable** - no edit mode transitions needed:
- Title: Editable `<input>` that looks like regular text
- Description: Editable `<textarea>` or text area
- Click anywhere on the note to edit
- Auto-save on blur (like a scratchpad)
- Subtle visual feedback when editing

### Step 4: Add sample data
Sample notes for demo:
- "New Note" with "Remember this information..." as description
- 4-5 other sample notes with varied content (e.g., "Meeting Notes", "Ideas", "TODO", etc.)

### Step 5: Implement state management
- Notes stored in local `$state`
- Search filter updates via `$derived`
- New notes get generated UUID, title "New Note", description "Remember this information..."
- Changes auto-save to local state (no backend persistence yet)

## Verification
1. Run `npm run dev` or `npm run build` to check for TypeScript errors
2. Navigate to `/notes` via sidebar
3. Test search filtering (type and see notes filter in real-time)
4. Test "+ New Note" button creates a new note
5. Verify visual consistency with tasks view header
