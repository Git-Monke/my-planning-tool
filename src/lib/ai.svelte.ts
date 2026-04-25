import { invoke } from "@tauri-apps/api/core";
import type { Task, Note, TimeBlock } from "./types.js";

export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: Role;
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
  audio?: any;
  function_call?: any;
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          notes: { type: "string", nullable: true },
          priority: { type: "integer", enum: [1, 2, 3], description: "1=low, 2=medium, 3=high", nullable: true },
          due_date: { type: "string", description: "YYYY-MM-DD" },
          due_time: { type: "string", description: "HH:MM", nullable: true },
          duration: { type: "integer", description: "Duration in minutes", nullable: true }
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
          title: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          priority: { type: "integer", enum: [1, 2, 3], nullable: true },
          due_date: { type: "string", description: "YYYY-MM-DD", nullable: true },
          due_time: { type: "string", description: "HH:MM", nullable: true },
          duration: { type: "integer", nullable: true },
          completed: { type: "boolean", nullable: true }
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
        properties: {
          id: { type: "string" }
        },
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
        properties: {
          id: { type: "string" }
        },
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
          description: { type: "string", nullable: true }
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
          title: { type: "string", nullable: true },
          description: { type: "string", nullable: true }
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
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_time_block",
      description: "Schedule a task by creating a time block on the calendar.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          start_date: { type: "string", description: "YYYY-MM-DD" },
          start_time: { type: "string", description: "HH:MM:SS" },
          duration: { type: "integer", description: "Duration in minutes" }
        },
        required: ["task_id", "start_date", "start_time", "duration"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_time_block",
      description: "Update a scheduled time block.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          task_id: { type: "string", nullable: true },
          start_date: { type: "string", description: "YYYY-MM-DD", nullable: true },
          start_time: { type: "string", description: "HH:MM:SS", nullable: true },
          duration: { type: "integer", nullable: true }
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
        properties: {
          id: { type: "string" }
        },
        required: ["id"]
      }
    }
  }
];

export class ChatState {
  messages = $state<Message[]>([]);
  isLoading = $state(false);
  apiKey = $state<string>("");

  constructor() {
    // Try to load API key from local storage on init
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

  clearChat() {
    this.messages = [];
  }

  async buildContextSystemPrompt(): Promise<Message> {
    const tasks = await invoke<Task[]>("get_tasks", { fromDate: null });
    const notes = await invoke<Note[]>("get_notes");
    const timeBlocks = await invoke<TimeBlock[]>("get_time_blocks", { date: null });
    const today = new Date().toISOString().split("T")[0];

    const contextStr = `
You are a helpful AI assistant in a local-first productivity app. Act like a smart friend, who just wants to be brief and get shit done. You manage tasks, notes, and calendar time blocks.
Today's date is: ${today}.

AVAILABLE TOOLS:
- create_task: Create a new task (requires title, optional notes/priority/due_date/due_time/duration)
- complete_task: Mark a task as complete (requires id)
- update_task: Update a task's properties (requires id)
- delete_task: Delete a task (requires id)
- create_note: Create a note (requires title, optional description)
- update_note: Update a note (requires id)
- delete_note: Delete a note (requires id)
- create_time_block: Schedule a task on the calendar (requires task_id/start_date/start_time/duration)
- update_time_block: Update a time block (requires id)
- delete_time_block: Delete a time block (requires id)

Current Tasks:
${JSON.stringify(tasks, null, 2)}

Current Time Blocks:
${JSON.stringify(timeBlocks, null, 2)}

Current Notes:
${JSON.stringify(notes.map(n => ({ id: n.id, title: n.title, description: n.description?.substring(0, 500) + (n.description && n.description.length > 500 ? '...' : '') })), null, 2)}

IMPORTANT: Answer questions about tasks, notes, or time blocks DIRECTLY using the data provided above. NEVER call tools to answer questions - tools are ONLY for creating, updating, or deleting data when the user explicitly asks you to do something.

IMPORTANT: Make sure all the data you give to the user is formatted! It should be human readible and easy to understand. Do not show the user Task ID's! That info is not useful to the user. 
`;
    return { role: "system", content: contextStr };
  }

  async executeToolCall(call: any): Promise<any> {
    const args = JSON.parse(call.function.arguments);
    const toolName = call.function.name;

    let result;
    try {
      if (toolName === "create_task" || toolName === "update_task") {
        const payload = { input: { ...args } };
        // if updating, extract id
        if (toolName === "update_task") {
          const id = args.id;
          delete args.id;
          result = await invoke("update_task", { id, input: args });
        } else {
          result = await invoke("create_task", payload);
        }
      } else if (toolName === "complete_task") {
        result = await invoke("update_task", { id: args.id, input: { completed: true } });
        result = { success: true };
      } else if (toolName === "delete_task") {
        result = await invoke("delete_task", { id: args.id });
        result = { success: true };
      } else if (toolName === "create_note" || toolName === "update_note") {
        const payload = { input: { ...args } };
        if (toolName === "update_note") {
          const id = args.id;
          delete args.id;
          result = await invoke("update_note", { id, input: args });
        } else {
          result = await invoke("create_note", payload);
        }
      } else if (toolName === "delete_note") {
        result = await invoke("delete_note", { id: args.id });
        result = { success: true };
      } else if (toolName === "create_time_block" || toolName === "update_time_block") {
        const payload = { input: { ...args } };
        if (toolName === "update_time_block") {
          const id = args.id;
          delete args.id;
          result = await invoke("update_time_block", { id, input: args });
        } else {
          result = await invoke("create_time_block", payload);
        }
      } else if (toolName === "delete_time_block") {
        result = await invoke("delete_time_block", { id: args.id });
        result = { success: true };
      } else {
        result = { error: "Unknown tool" };
      }

      // Dispatch event so UI refreshes
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app-refresh-data"));
      }

      return result;
    } catch (err: any) {
      return { error: err.toString() };
    }
  }

  async sendMessage(content: string) {
    if (!this.apiKey) {
      this.messages = [...this.messages, { role: "assistant", content: "Please set your Groq API Key first." }];
      return;
    }

    // Add user message
    this.messages = [...this.messages, { role: "user", content }];

    await this.runChatLoop();
  }

  private async runChatLoop() {
    this.isLoading = true;
    try {
      let loopRunning = true;
      while (loopRunning) {
        // Build the current list of messages to send
        // Prefix with a fresh context system prompt
        const systemPrompt = await this.buildContextSystemPrompt();
        const messagesToSend = [systemPrompt, ...this.messages];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: messagesToSend,
            tools: TOOLS,
            tool_choice: "auto"
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.messages = [...this.messages, { role: "assistant", content: `Error: ${response.status} ${errorText}` }];
          break;
        }

        const data = await response.json();
        const responseMessage = data.choices[0].message;

        // Append assistant's response to history
        this.messages = [...this.messages, responseMessage];

        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          // Execute tools and append results
          for (const call of responseMessage.tool_calls) {
            const toolResult = await this.executeToolCall(call);
            const resultContent = toolResult.error
              ? `ERROR: ${toolResult.error}`
              : JSON.stringify(toolResult);
            this.messages = [
              ...this.messages,
              {
                role: "tool",
                tool_call_id: call.id,
                name: call.function.name,
                content: resultContent
              }
            ];
          }
          // The loop continues so Groq can process tool results
        } else if (responseMessage.function_call) {
          // Handle legacy function_call format
          const call = responseMessage.function_call;
          const toolResult = await this.executeToolCall(call);
          const resultContent = toolResult.error
            ? `ERROR: ${toolResult.error}`
            : JSON.stringify(toolResult);
          this.messages = [
            ...this.messages,
            {
              role: "tool",
              name: call.name,
              content: resultContent
            }
          ];
          loopRunning = true;
        } else {
          // No more tools, final response reached
          loopRunning = false;
        }
      }
    } catch (e: any) {
      this.messages = [...this.messages, { role: "assistant", content: `Exception: ${e.toString()}` }];
    } finally {
      this.isLoading = false;
    }
  }
}

export const chatState = new ChatState();
