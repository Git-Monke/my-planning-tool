export interface Note {
	id: string;
	title: string;
	description: string | null;
	created_at: string;
	updated_at: string;
}

export interface Task {
	id: string;
	title: string;
	notes?: string;
	priority?: number; // 1 (low), 2 (medium), 3 (high)
	due_date?: string; // YYYY-MM-DD
	due_time?: string; // HH:MM
	duration?: number; // minutes
	completed: boolean;
	created_at: string;
	updated_at: string;
}

export interface TimeBlock {
	id: string;
	title: string;
	notes: string | null;
	priority: number | null;
	start_date: string; // YYYY-MM-DD
	start_time: string; // HH:MM:SS
	duration: number; // minutes
	completed: boolean;
	created_at: string;
	updated_at: string;
}
