<script lang="ts">
  import { chatState } from "$lib/ai.svelte.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Send from "@lucide/svelte/icons/send";
  import Settings from "@lucide/svelte/icons/settings";
  import Trash2 from "@lucide/svelte/icons/trash-2";

  let inputVal = $state("");
  let showSettings = $state(false);
  let tempKey = $state("");
  let scrollRef = $state<HTMLDivElement | null>(null);

  function scrollToBottom() {
    if (scrollRef) {
      scrollRef.scrollTop = scrollRef.scrollHeight;
    }
  }

  function handleSend(e?: Event) {
    if (e) e.preventDefault();
    if (!inputVal.trim() || chatState.isLoading) return;

    chatState.sendMessage(inputVal);
    inputVal = "";
    scrollToBottom();
  }

  function saveKey() {
    chatState.setApiKey(tempKey);
    showSettings = false;
  }

  function toggleSettings() {
    tempKey = chatState.apiKey;
    showSettings = !showSettings;
  }

  // Auto scroll when messages change
  $effect(() => {
    const count = chatState.messages.length;
    if (count > 0) scrollToBottom();
  });
</script>

<div class="flex w-full flex-1 flex-col min-h-0">
  <!-- Header -->
  <div class="flex shrink-0 items-center justify-between border-b px-3 py-2">
    <h2 class="text-sm font-medium">Agent chat</h2>
    <div class="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        class="h-6 w-6"
        onclick={() => chatState.clearChat()}
        title="Refresh chat"
      >
        <Trash2 class="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-6 w-6"
        onclick={toggleSettings}
        title="Settings"
      >
        <Settings class="h-4 w-4" />
      </Button>
    </div>
  </div>

  <!-- Main Chat Area -->
  {#if showSettings}
    <div class="p-4 flex flex-col gap-3">
      <p class="text-sm font-medium">Groq API Settings</p>
      <p class="text-xs text-muted-foreground">
        Bring your own key from Groq to enable the AI agent.
      </p>
      <Input type="password" placeholder="gsk_..." bind:value={tempKey} />
      <div class="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={toggleSettings}
          >Cancel</Button
        >
        <Button size="sm" onclick={saveKey}>Save</Button>
      </div>
    </div>
  {:else if !chatState.apiKey}
    <div
      class="flex flex-1 flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground"
    >
      <p class="mb-4">No API Key configured.</p>
      <Button variant="secondary" onclick={toggleSettings}>Set API Key</Button>
    </div>
  {:else}
    <ScrollArea class="flex-1 min-h-0 w-full" bind:viewportRef={scrollRef}>
      <div class="flex flex-col gap-4 p-4">
        {#if chatState.messages.filter((m) => m.role !== "system").length === 0}
          <div class="text-muted-foreground text-center text-sm mt-10">
            Send a message to schedule tasks, take notes, or ask for advice!
          </div>
        {/if}

        {#each chatState.messages.filter((m) => m.role !== "system" && !(m.role === "user" && (m.content.startsWith("Tool error:") || m.content.startsWith("The previous tool call failed")))) as msg}
          <div
            class="flex flex-col {msg.role === 'user'
              ? 'items-end'
              : 'items-start'}"
          >
            {#if msg.role === "user"}
              <div
                class="bg-primary text-primary-foreground max-w-[85%] rounded-lg px-3 py-2 text-sm"
              >
                {msg.content}
              </div>
            {:else if msg.role === "assistant"}
              <div
                class="bg-muted text-foreground max-w-[95%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
              >
                {#if msg.content}
                  {msg.content}
                {:else if msg.tool_calls && msg.tool_calls.length > 0}
                  <span
                    class="italic text-muted-foreground flex items-center gap-2"
                  >
                    <Spinner class="h-3 w-3" />
                    Executing tool: {msg.tool_calls[0].function.name}...
                  </span>
                {/if}
              </div>
            {:else if msg.role === "tool"}
              {#if !msg.content.startsWith('Tool error:')}
                <div
                  class="text-xs text-muted-foreground flex items-center gap-1 pl-2"
                >
                  ✓ {msg.name} completed
                </div>
              {/if}
            {/if}
          </div>
        {/each}

        {#if chatState.isLoading && (!chatState.messages.length || chatState.messages[chatState.messages.length - 1].role !== "assistant" || chatState.messages[chatState.messages.length - 1].tool_calls)}
          <div class="flex items-start">
            <div
              class="bg-muted text-foreground rounded-lg px-3 py-2 text-sm flex items-center gap-2"
            >
              <Spinner class="h-4 w-4" />
              <span class="text-muted-foreground">Thinking...</span>
            </div>
          </div>
        {/if}
      </div>
    </ScrollArea>

    <!-- Input Area -->
    <div class="shrink-0 border-t p-3">
      <form onsubmit={handleSend} class="flex gap-2">
        <Input
          class="flex-1"
          placeholder="Ask the agent..."
          bind:value={inputVal}
          disabled={chatState.isLoading}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!inputVal.trim() || chatState.isLoading}
        >
          <Send class="h-4 w-4" />
        </Button>
      </form>
    </div>
  {/if}
</div>
