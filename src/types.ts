export interface Task {
	id?: number;
	title: string;
	description: string;
	status: "pending" | "completed";
	energyLevel: "low" | "medium" | "high";
	timeRequired: "low" | "medium" | "high";
	dueDate: | string | "someday";
	createdAt?: string;
	updatedAt?: string
}