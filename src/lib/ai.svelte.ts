import { invoke } from "@tauri-apps/api/core";
import type { Task, Note, TimeBlock } from "./types.js";

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
      name: "get_notes",
      description: "Get all notes.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_time_blocks_for_date",
      description: "Get time blocks for a specific date.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD" }
        },
        required: ["date"]
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
      description: "Update an existing task.",
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
      description: "Update an existing note.",
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
      description: "Update a time block on the calendar.",
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
    const today = new Date().toISOString().split("T")[0];

    return {
      role: "system",
      content: `You are a helpful AI assistant in a local-first productivity app. Be brief and get shit done. You manage tasks, notes, and calendar time blocks.
Today's date is: ${today}.

TOOLS:
- get_tasks: Get all tasks, optionally filtered by date (from_date: YYYY-MM-DD)
- get_notes: Get all notes
- get_time_blocks_for_date: Get time blocks for a specific date (date: YYYY-MM-DD required)
- create_task: Create task (title required, optional notes/priority/due_date/due_time/duration)
- complete_task: Mark task complete (id required)
- update_task: Update task (id required)
- delete_task: Delete task (id required)
- create_note: Create note (title required, optional description)
- update_note: Update note (id required)
- delete_note: Delete note (id required)
- create_time_block: Schedule calendar block (title/start_date/start_time/duration required)
- update_time_block: Update time block (id required)
- delete_time_block: Delete time block (id required)

RULES:
- NEVER pass null for optional parameters - omit them entirely
- NEVER include fields with null values in tool calls
- NEVER show users IDs - just format data nicely
- Unless you can alreadya see the relevant data, call get_tasks, get_notes, or get_time_blocks_for_date first to find what you need to know before making changes
- After creating/updating/deleting time blocks, show the day's schedule using get_time_blocks_for_date
- Priorty 1 is the LOWEST priority, priority 3 is the HIGHEST
- DO NOT RETURN DATA AS A TABLE, The user cannot read tables. 

Answer questions directly from the data you fetch.`
    };
  }

  private async executeToolCall(call: any): Promise<any> {
    try {
      const rawArgs = JSON.parse(call.function.arguments) as Record<string, unknown>;
      const args = Object.fromEntries(
        Object.entries(rawArgs).filter(([, v]) => v !== null)
      ) as Record<string, string | number | boolean>;
      const toolName = call.function.name;

      switch (toolName) {
        case "get_tasks":
          return await invoke("get_tasks", { fromDate: args.from_date as string || null });

        case "get_notes":
          return await invoke<Note[]>("get_notes");

        case "get_time_blocks_for_date":
          return await invoke<TimeBlock[]>("get_time_blocks", { date: args.date as string });

        case "create_task":
          return await invoke("create_task", { input: args });

        case "update_task":
          return await invoke("update_task", { id: args.id, input: args });

        case "complete_task":
        case "delete_task":
          return await invoke(toolName === "complete_task" ? "update_task" : "delete_task", {
            id: args.id,
            ...(toolName === "complete_task" ? { input: { completed: true } } : {})
          });

        case "create_note":
        case "update_note":
          return await invoke(toolName, {
            id: toolName === "update_note" ? args.id : undefined,
            input: args
          });

        case "delete_note":
          return await invoke("delete_note", { id: args.id });

        case "create_time_block":
          return await invoke("create_time_block", { input: args });

        case "update_time_block":
          return await invoke("update_time_block", { id: args.id, input: args });

        case "delete_time_block":
          return await invoke("delete_time_block", { id: args.id });

        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (err) {
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
        "Authorization": `Bearer ${this.apiKey}`
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
      throw new Error(match ? `Tool parameter error: ${match[0]}` : `API error: ${msg.slice(0, 200)}`);
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
            content: `[UI Context]: ${this.currentUserContext}`
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
      this.addMessage("assistant", `Exception: ${String(err)}`);
    } finally {
      this.isLoading = false;
    }
  }
}

export const chatState = new ChatState();
