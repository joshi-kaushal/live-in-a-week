import { Task, RecurringTaskTemplate } from '../types/task';

// Toggle between 'sync' and 'local' - that's it!
const STORAGE_TYPE: 'sync' | 'local' = 'sync';

// chrome.storage.sync has 100KB limit, .local has ~10MB
const getStorage = () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage[STORAGE_TYPE];
  }
  throw new Error('Chrome storage API not available');
};

const TASKS_KEY = 'tasks';
const TEMPLATES_KEY = 'templates';

/**
 * Chrome Storage adapter for extension storage
 * Switching between local/sync: Just change STORAGE_TYPE above!
 */

// ===== TASK OPERATIONS =====

export async function saveTask(task: Task): Promise<void> {
  const storage = getStorage();
  const tasks = await getAllTasks();
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  taskMap.set(task.id, task);
  await storage.set({ [TASKS_KEY]: Array.from(taskMap.values()) });
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const storage = getStorage();
  await storage.set({ [TASKS_KEY]: tasks });
}

export async function getTask(id: string): Promise<Task | undefined> {
  const tasks = await getAllTasks();
  return tasks.find(t => t.id === id);
}

export async function getAllTasks(): Promise<Task[]> {
  const storage = getStorage();
  const result = await storage.get(TASKS_KEY) as { [key: string]: Task[] };
  return result[TASKS_KEY] || [];
}

export async function deleteTaskFromDB(id: string): Promise<void> {
  const storage = getStorage();
  const tasks = await getAllTasks();
  const filtered = tasks.filter(t => t.id !== id);
  await storage.set({ [TASKS_KEY]: filtered });
}

export async function loadAllTasks(): Promise<Task[]> {
  return getAllTasks();
}

export async function getTasksByDueDate(date: string): Promise<Task[]> {
  const tasks = await getAllTasks();
  return tasks.filter(t => t.dueDate === date);
}

export async function getTasksByStatus(status: 'pending' | 'completed'): Promise<Task[]> {
  const tasks = await getAllTasks();
  return tasks.filter(t => t.status === status);
}

// ===== TEMPLATE OPERATIONS =====

export async function saveTemplate(template: RecurringTaskTemplate): Promise<void> {
  const storage = getStorage();
  const templates = await getAllTemplates();
  const templateMap = new Map(templates.map(t => [t.id, t]));
  templateMap.set(template.id, template);
  await storage.set({ [TEMPLATES_KEY]: Array.from(templateMap.values()) });
}

export async function getTemplate(id: string): Promise<RecurringTaskTemplate | undefined> {
  const templates = await getAllTemplates();
  return templates.find(t => t.id === id);
}

export async function getAllTemplates(): Promise<RecurringTaskTemplate[]> {
  const storage = getStorage();
  const result = await storage.get(TEMPLATES_KEY) as { [key: string]: RecurringTaskTemplate[] };
  return result[TEMPLATES_KEY] || [];
}

export async function loadAllTemplates(): Promise<RecurringTaskTemplate[]> {
  return getAllTemplates();
}

export async function deleteTemplate(id: string): Promise<void> {
  const storage = getStorage();
  const templates = await getAllTemplates();
  const filtered = templates.filter(t => t.id !== id);
  await storage.set({ [TEMPLATES_KEY]: filtered });
}

// Clear all data (useful for testing)
export async function clearAllData(): Promise<void> {
  const storage = getStorage();
  await storage.clear();
}
