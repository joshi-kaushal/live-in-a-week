import { format, isBefore, parse, startOfWeek } from "date-fns";
import { Task } from "../types";

const LOCAL_STORAGE_KEY = 'tasks';

/**
 * Get all tasks from local storage.
 * @returns {Array} - Array of task objects
 */
export const getAllTasks = () => {
	const tasks: Task[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]") || [];
	return tasks;
};

/**
 * Get a single task by its ID.
 * @param {number} taskId - The ID of the task to retrieve.
 * @returns {Object | undefined} - The task object or undefined if not found.
 */
export const getTaskById = (taskId: number) => {
	const tasks = getAllTasks();
	return tasks.find((task) => task.id === taskId);
};

/**
 * Add a new task to local storage.
 * @param {Object} task - The task object to add.
 * @param {string} task.title - Task title.
 * @param {string} task.description - Task description.
 * @param {string} task.status - Task status (pending, completed).
 * @param {string} task.energy_level - Task energy level (low, medium, high).
 * @param {string} task.time_required - Time required (low, medium, high).
 * @param {string | null} task.due_date - Task due date (nullable).
 */

// export const addTask = (task: Task) => {
// 	const tasks = getAllTasks();
// 	const newTask = {
// 		...task,
// 		id: Date.now(), // Generate a unique ID using the current timestamp
// 		createdAt: new Date().toISOString(),
// 		updatedAt: new Date().toISOString(),
// 	};
// 	tasks.push(newTask);
// 	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
// };

export const addTask = (title: string, dueDate?: Date): void => {
	const formattedDueDate = dueDate ? format(dueDate, 'MM-dd-yyyy') : '';

	// Create a new task
	const newTask: Task = {
		title: title,
		description: '',
		status: 'pending',
		energyLevel: 'medium',
		timeRequired: 'medium',
		dueDate: formattedDueDate,
		id: Date.now(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	// Add the new task to local storage
	const tasks = getAllTasks(); // Get existing tasks
	tasks.push(newTask); // Add the new task
	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks)); // Save back to local storage
};

/**
 * Update an existing task in local storage by its ID.
 * @param {number} taskId - The ID of the task to update.
 * @param {Object} updatedTask - The updated task data.
 */
export const updateTask = (taskId: number, updatedTask: Partial<Task>) => {
	const tasks = getAllTasks();
	const taskIndex = tasks.findIndex((task) => task.id === taskId);

	if (taskIndex !== -1) {
		tasks[taskIndex] = {
			...tasks[taskIndex],
			...updatedTask,
			updatedAt: new Date().toISOString(), // Update the `updated_at` timestamp
		};
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
	} else {
		throw new Error('Task not found');
	}
};

/**
 * Delete a task from local storage by its ID.
 * @param {number} taskId - The ID of the task to delete.
 */
export const deleteTask = (taskId: number) => {
	const tasks = getAllTasks();
	const updatedTasks = tasks.filter((task) => task.id !== taskId);
	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));
};

export const getSomedayTasks = (): Task[] => {
	const tasks = getAllTasks();

	return tasks.filter(task => {
		return task.dueDate === ""
	})
}

export const getPendingTasks = (): Task[] => {
	const tasks = getAllTasks(); // Fetch all tasks from local storage

	const today = new Date();
	const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 }); // Get the start of the current week (Monday, or Sunday if week starts on Sunday)

	// Parse the due date from 'MM-dd-yyyy' format and check if it's before the start of the current week
	return tasks.filter((task) => {
		const dueDate = parse(task.dueDate, 'MM-dd-yyyy', new Date()); // Parse dueDate from local storage
		const isTaskPending = task.status === 'pending';
		const isDueBeforeCurrentWeek = isBefore(dueDate, currentWeekStart);

		return isTaskPending && isDueBeforeCurrentWeek;
	});
};

export const getTaskForDueDate = (dueDate: string): Task[] => {
	const tasks = getAllTasks();

	return tasks.filter(task => {
		const taskDueDate = task.dueDate
		return taskDueDate === dueDate;
	});
};