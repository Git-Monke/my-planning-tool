<script lang="ts">
  import type { Note } from "$lib/types.js";
  import { Input } from "$lib/components/ui/input";
  import { Spinner } from "$lib/components/ui/spinner";
  import { cn } from "$lib/utils.js";
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";

  // Debounce utility
  let updateTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  function updateNoteLocal(
    id: string,
    field: "title" | "description",
    value: string,
  ) {
    notes = notes.map((note) =>
      note.id === id
        ? { ...note, [field]: value, updated_at: new Date().toISOString() }
        : note,
    );
  }

  function debounceUpdate(
    id: string,
    field: "title" | "description",
    value: string,
  ) {
    // Clear existing timeout for this note
    const existingTimeout = updateTimeouts.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Update local state immediately for responsive UI
    updateNoteLocal(id, field, value);

    // Set new timeout to persist to backend
    const timeout = setTimeout(async () => {
      const note = notes.find((n) => n.id === id);
      if (note) {
        try {
          await invoke("update_note", {
            id,
            input: {
              title: note.title,
              description: note.description,
            },
          });
        } catch (error) {
          console.error("Failed to update note:", error);
        }
      }
      updateTimeouts.delete(id);
    }, 500);

    updateTimeouts.set(id, timeout);
  }

  // Notes state - starts empty, populated from backend
  let notes = $state<Note[]>([]);

  let searchQuery = $state("");
  let loading = $state(true);
  let expandedNotes = $state(new Set<string>());

  // Fetch notes on mount
  async function loadNotes() {
    try {
      notes = await invoke<Note[]>("get_notes");
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadNotes();
    window.addEventListener("app-refresh-data", loadNotes);
    return () => window.removeEventListener("app-refresh-data", loadNotes);
  });

  function toggleExpanded(id: string) {
    const newSet = new Set(expandedNotes);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    expandedNotes = newSet;
  }

  function handleTextareaInput(id: string, event: Event) {
    const target = event.currentTarget as HTMLTextAreaElement;
    // Auto-resize if expanded
    if (expandedNotes.has(id)) {
      target.style.height = "auto";
      target.style.height = target.scrollHeight + "px";
    }
  }

  // Effect to auto-resize textarea when expanded/collapsed
  $effect(() => {
    // Track expandedNotes so effect re-runs on changes
    const _ = expandedNotes;
    for (const note of notes) {
      const textarea = document.querySelector(
        `[data-textarea-id="${note.id}"]`,
      ) as HTMLTextAreaElement | null;
      if (textarea) {
        if (expandedNotes.has(note.id)) {
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
        } else {
          textarea.style.height = "";
        }
      }
    }
  });

  // Filtered notes based on search
  const filteredNotes = $derived(
    searchQuery.trim()
      ? notes.filter(
          (note) =>
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (note.description &&
              note.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase())),
        )
      : notes,
  );

  async function addNewNote() {
    try {
      const newNote = await invoke<Note>("create_note", {
        input: {
          title: "New Note",
          description: "Remember this information...",
        },
      });
      notes = [newNote, ...notes];
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }

  async function deleteNote(id: string) {
    try {
      await invoke("delete_note", { id });
      notes = notes.filter((note) => note.id !== id);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-4 border-b">
    <h1 class="text-xl font-semibold">Notes</h1>
  </div>

  <!-- Main content -->
  <div class="flex-1 overflow-y-auto">
    <div class="max-w-2xl mx-auto flex flex-col">
      <!-- Search bar - full width, square, flush -->
      <Input
        type="search"
        placeholder="Search notes..."
        bind:value={searchQuery}
        class="rounded-none border-l-0 border-r-0 border-t-0 py-8.5 bg-transparent focus-visible:ring-1 focus-visible:border-t-1"
      />

      <!-- + New Note button -->
      <button
        onclick={addNewNote}
        class="flex items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/30 transition-colors py-6 text-muted-foreground/60 hover:text-muted-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        <span class="text-sm font-medium">New Note</span>
      </button>

      <!-- Notes list -->
      {#if loading}
        <div class="flex justify-center">
          <Spinner class="size-6" />
        </div>
      {:else if filteredNotes.length === 0}
        <div class="flex flex-col items-center justify-center py-6 text-center">
          {#if searchQuery}
            <p class="text-muted-foreground">No notes match your search.</p>
          {:else}
            <p class="text-sm text-muted-foreground">
              No notes yet. Click "New Note" to get started.
            </p>
          {/if}
        </div>
      {:else}
        {#each filteredNotes as note (note.id)}
          <div
            class="rounded-lg border bg-card p-4 flex flex-col gap-2 relative group"
          >
            <!-- Action buttons container -->
            <div
              class="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <!-- Delete button (left) -->
              <button
                onclick={() => deleteNote(note.id)}
                class="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                title="Delete"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 6h18" /><path
                    d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                  /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>

              <!-- Expand/Collapse button (right) -->
              <button
                onclick={() => toggleExpanded(note.id)}
                class="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                title={expandedNotes.has(note.id) ? "Collapse" : "Expand"}
              >
                {#if expandedNotes.has(note.id)}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                {:else}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                {/if}
              </button>
            </div>

            <!-- Title input -->
            <input
              type="text"
              value={note.title}
              oninput={(e) =>
                debounceUpdate(note.id, "title", e.currentTarget.value)}
              placeholder="Note title"
              class="text-base font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 pr-8 placeholder:text-muted-foreground/50"
            />
            <!-- Description textarea -->
            <div
              class="relative note-content"
              class:expanded={expandedNotes.has(note.id)}
            >
              <textarea
                data-textarea-id={note.id}
                value={note.description}
                oninput={(e) => {
                  handleTextareaInput(note.id, e);
                  debounceUpdate(
                    note.id,
                    "description",
                    (e.target as HTMLTextAreaElement).value,
                  );
                }}
                onclick={() =>
                  !expandedNotes.has(note.id) && toggleExpanded(note.id)}
                placeholder="Write your note..."
                rows={3}
                class="text-sm text-muted-foreground bg-transparent border-none outline-none focus:ring-0 p-0 pr-6 resize-none placeholder:text-muted-foreground/50 w-full"
              ></textarea>
              <!-- Collapsed indicator gradient -->
              {#if !expandedNotes.has(note.id)}
                <div
                  class="absolute bottom-0 left-0 right-6 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none"
                ></div>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .note-content textarea {
    max-height: 5rem;
    overflow: hidden;
  }

  .note-content.expanded textarea {
    max-height: none;
    overflow: visible;
  }
</style>
