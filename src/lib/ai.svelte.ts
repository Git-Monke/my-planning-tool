import { invoke } from "@tauri-apps/api/core";
import type { Task, Note, NoteSummary, TimeBlock } from "./types.js";

export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: Role;
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_tasks",
      description: "Get all tasks (optional: filter by date).",
      parameters: {
        type: "object",
        properties: {
          from_date: { type: "string", description: "YYYY-MM-DD optional date filter" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_notes",
      description: "List all notes with id and title only. Use get_note to load description/body for a specific id.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_note",
      description: "Get the full content of a single note by id (title, description, timestamps).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The note's id from list_notes" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_date_range",
      description: "Get all tasks and time blocks for a date range. Returns tasks by due_date and time_blocks by start_date within the range.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "YYYY-MM-DD" },
          end_date: { type: "string", description: "YYYY-MM-DD" }
        },
        required: ["start_date", "end_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          notes: { type: "string" },
          priority: { type: "integer", enum: [1, 2, 3] },
          due_date: { type: "string" },
          due_time: { type: "string" },
          duration: { type: "integer" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update an existing task. All fields are optional.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          notes: { type: "string" },
          priority: { type: "integer", enum: [1, 2, 3] },
          due_date: { type: "string" },
          due_time: { type: "string" },
          duration: { type: "integer" },
          completed: { type: "boolean" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a task as complete.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete a task by ID.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Create a new note.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_note",
      description: "Update an existing note. All fields are optional.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_note",
      description: "Delete a note by ID.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_time_block",
      description: "Schedule a time block on the calendar.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          notes: { type: "string" },
          priority: { type: "integer", enum: [1, 2, 3] },
          start_date: { type: "string" },
          start_time: { type: "string" },
          duration: { type: "integer" },
          completed: { type: "boolean" }
        },
        required: ["title", "start_date", "start_time", "duration"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_time_block",
      description: "Update a time block on the calendar. All fields are optional.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          notes: { type: "string" },
          priority: { type: "integer", enum: [1, 2, 3] },
          start_date: { type: "string" },
          start_time: { type: "string" },
          duration: { type: "integer" },
          completed: { type: "boolean" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_time_block",
      description: "Delete a scheduled time block.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    }
  }
];

export class ChatState {
  messages = $state<Message[]>([]);
  isLoading = $state(false);
  apiKey = $state<string>("");
  currentUserContext = $state<string | null>(null);

  constructor() {
    if (typeof window !== "undefined") {
      this.apiKey = localStorage.getItem("groq_api_key") || "";
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
    if (typeof window !== "undefined") {
      localStorage.setItem("groq_api_key", key);
    }
  }

  updateUserContext(context: string | null) {
    this.currentUserContext = context;
  }

  clearChat() {
    this.messages = [];
  }

  private addMessage(role: Role, content: string, extra?: Partial<Message>): void {
    this.messages = [...this.messages, { role, content, ...extra }];
  }

  private addToolResult(callId: string, name: string, content: string): void {
    this.messages = [
      ...this.messages,
      { role: "tool", tool_call_id: callId, name, content }
    ];
  }

  private async buildContextSystemPrompt(): Promise<Message> {
    const now = new Date();
    const today = now.toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }); // HH:MM in 24hr format, local timezone

    return {
      role: "system",
      content: `## Role
You are a local-first productivity assistant. You manage tasks, notes, and calendar time blocks. Be brief. Execute immediately.

## Context
Today: ${today}
Time: ${time}
Priority scale: 1 = lowest, 3 = highest.

## Instructions
1. Clarify before and after fetching if needed. If a request is ambiguous upfront, ask first. 
   If fetched data reveals ambiguity (e.g. multiple matching items), ask before acting.
2. Time blocks should not overlap.
3. Fetch before mutating. Unless the relevant data is already in scope, call get_date_range or get_tasks before any create/update/delete.
4. For notes: call list_notes first to get IDs and titles. Call get_note only when you need the body.
6. After any time block create/update/delete, call get_date_range to confirm the change.
7. Omit null fields entirely. Never pass a parameter with a null value.
8. Never expose IDs to the user. Format all data as plain readable text — no tables, no raw IDs.
9. Answer directly from fetched data. Do not speculate or fill in missing information.

## Tools
- get_tasks — all tasks, optional filter: from_date (YYYY-MM-DD)
- list_notes — note IDs + titles only
- get_note — full note by ID
- get_date_range — tasks + time blocks for a range; start_date and end_date required (YYYY-MM-DD)
- create_task — required: title. Optional: notes, priority, due_date, due_time, duration
- complete_task — required: id
- update_task — required: id
- delete_task — required: id
- create_note — required: title. Optional: description
- update_note — required: id
- delete_note — required: id
- create_time_block — required: title, start_date, start_time, duration (an integer: e.g 60)
- update_time_block — required: id
- delete_time_block — required: id

## Output Format
Plain text only. No tables. No raw IDs. No greetings or filler phrases. Lead with the answer or confirmation.

## Examples

User: "Add a task to review the Q3 report"
Correct tool call: create_task({ title: "Review Q3 report" })
Wrong: create_task({ title: "Review Q3 report", due_date: null, priority: null })

User: "What's on my calendar this week?"
Correct: call get_date_range with start_date = Monday, end_date = Sunday, then summarize in plain text.
Wrong: guess or answer from memory without fetching.

User: "Can you extend my study time for the next test by like an hour"
Correct: call get_date_range with start_date = Today, end_date = 1 week. If there are 2 tests on Monday, ask which test they want extended, then do what the user asked for.
Wrong: guess or answer from memory without fetching.

User: "Extend my lunch break by 30 minutes"
Correct: fetch the day's blocks, check if extending lunch overlaps the next block, 
   warn the user if so and ask whether to shift the next block or adjust the extension.
Wrong: blindly extend the block without checking what comes after it.`
    };
  }

  private async executeToolCall(call: any): Promise<any> {
    try {
      const rawArgs = JSON.parse(call.function.arguments) as Record<string, unknown>;
      console.log(`[AI Tool Call]${call.function.name}: `, rawArgs);
      const args = Object.fromEntries(
        Object.entries(rawArgs).filter(([, v]) => v !== null)
      ) as Record<string, string | number | boolean>;
      const toolName = call.function.name;

      let result;
      switch (toolName) {
        case "get_tasks":
          result = await invoke("get_tasks", { fromDate: args.from_date as string || null });
          break;

        case "list_notes":
          result = await invoke<NoteSummary[]>("list_notes");
          break;

        case "get_note":
          result = await invoke<Note>("get_note", { id: args.id });
          break;

        case "get_date_range":
          result = await invoke("get_date_range", { startDate: args.start_date as string, endDate: args.end_date as string });
          break;

        case "create_task":
          result = await invoke("create_task", { input: args });
          break;

        case "update_task":
          result = await invoke("update_task", { id: args.id, input: args });
          break;

        case "complete_task":
        case "delete_task":
          result = await invoke(toolName === "complete_task" ? "update_task" : "delete_task", {
            id: args.id,
            ...(toolName === "complete_task" ? { input: { completed: true } } : {})
          });
          break;

        case "create_note":
        case "update_note":
          result = await invoke(toolName, {
            id: toolName === "update_note" ? args.id : undefined,
            input: args
          });
          break;

        case "delete_note":
          result = await invoke("delete_note", { id: args.id });
          break;

        case "create_time_block":
          result = await invoke("create_time_block", { input: args });
          break;

        case "update_time_block":
          result = await invoke("update_time_block", { id: args.id, input: args });
          break;

        case "delete_time_block":
          result = await invoke("delete_time_block", { id: args.id });
          break;

        default:
          result = { error: `Unknown tool: ${toolName} ` };
      }
      console.log(`[AI Tool Result] ${toolName}: `, result);
      return result;
    } catch (err) {
      console.error(`[AI Tool Error] ${call.function.name}: `, err);
      return { error: String(err) };
    } finally {
      // Refresh UI after any tool mutation
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app-refresh-data"));
      }
    }
  }

  private async sendApiRequest(messages: Message[]): Promise<Response> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey} `
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages,
        tools: TOOLS,
        tool_choice: "auto"
      })
    });

    if (!response.ok) {
      const errJson = JSON.parse(await response.text()).error;
      const msg = errJson?.message || "";
      const match = msg.match(/parameters for tool \w+ did not match schema:[^]*$/);
      throw new Error(match ? `Tool parameter error: ${match[0]} ` : `API error: ${msg.slice(0, 200)} `);
    }

    return response;
  }

  async sendMessage(content: string) {
    if (!this.apiKey) {
      this.addMessage("assistant", "Please set your Groq API Key first.");
      return;
    }

    this.addMessage("user", content);
    await this.runChatLoop();
  }

  private async runChatLoop() {
    this.isLoading = true;
    let toolRetryCount = 0;
    const maxToolRetries = 3;

    try {
      while (true) {
        if (toolRetryCount >= maxToolRetries) {
          this.addMessage("assistant", "Sorry, I encountered too many tool errors. Please try again.");
          break;
        }

        // Build context with fresh data
        const systemPrompt = await this.buildContextSystemPrompt();
        const messagesToSend = [systemPrompt, ...this.messages];

        if (this.currentUserContext) {
          messagesToSend.push({
            role: "user",
            content: `[UI Context]: ${this.currentUserContext} `
          });
        }

        const response = await this.sendApiRequest(messagesToSend);
        const data = await response.json();
        const responseMessage = data.choices[0].message;

        // Add assistant response to history
        this.addMessage("assistant", responseMessage.content || "", {
          tool_calls: responseMessage.tool_calls
        });

        // No more tool calls - we're done
        if (!responseMessage.tool_calls?.length) break;

        // Execute all tool calls
        for (const call of responseMessage.tool_calls) {
          const result = await this.executeToolCall(call);
          this.addToolResult(call.id, call.function.name, JSON.stringify(result));
        }
      }
    } catch (err) {
      this.addMessage("assistant", `Exception: ${String(err)} `);
    } finally {
      this.isLoading = false;
    }
  }
}

export const chatState = new ChatState();
