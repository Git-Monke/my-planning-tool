export interface Note {
	id: string;
	title: string;
	description: string;
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
	start_time?: string;
	duration?: number;
	completed: boolean;
	created_at: string;
	updated_at: string;
}
