import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Task, RecurringTaskTemplate } from '../types/task';

// Define schema
interface TaskDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-dueDate': string;
      'by-status': string;
    };
  };
  templates: {
    key: string;
    value: RecurringTaskTemplate;
  };
}

const DB_NAME = 'live-in-a-week';
const DB_VERSION = 1;

let db: IDBPDatabase<TaskDB> | null = null;

/**
 * Initialize IndexedDB connection
 */
export async function initDB(): Promise<IDBPDatabase<TaskDB>> {
  if (db) return db;

  db = await openDB<TaskDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-dueDate', 'dueDate');
        taskStore.createIndex('by-status', 'status');
      }

      // Create templates store
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
    },
  });

  return db;
}

// ===== TASK OPERATIONS =====

export async function saveTask(task: Task): Promise<void> {
  const database = await initDB();
  await database.put('tasks', task);
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const database = await initDB();
  const tx = database.transaction('tasks', 'readwrite');
  for (const task of tasks) {
    await tx.store.put(task);
  }
  await tx.done;
}

export async function getTask(id: string): Promise<Task | undefined> {
  const database = await initDB();
  return await database.get('tasks', id);
}

export async function getAllTasks(): Promise<Task[]> {
  const database = await initDB();
  return await database.getAll('tasks');
}

export async function deleteTaskFromDB(id: string): Promise<void> {
  const database = await initDB();
  await database.delete('tasks', id);
}

export async function getTasksByDueDate(date: string): Promise<Task[]> {
  const database = await initDB();
  return await database.getAllFromIndex('tasks', 'by-dueDate', date);
}

export async function getTasksByStatus(status: 'pending' | 'completed'): Promise<Task[]> {
  const database = await initDB();
  return await database.getAllFromIndex('tasks', 'by-status', status);
}

// ===== TEMPLATE OPERATIONS =====

export async function saveTemplate(template: RecurringTaskTemplate): Promise<void> {
  const database = await initDB();
  await database.put('templates', template);
}

export async function getTemplate(id: string): Promise<RecurringTaskTemplate | undefined> {
  const database = await initDB();
  return await database.get('templates', id);
}

export async function getAllTemplates(): Promise<RecurringTaskTemplate[]> {
  const database = await initDB();
  return await database.getAll('templates');
}

export async function deleteTemplate(id: string): Promise<void> {
  const database = await initDB();
  await database.delete('templates', id);
}

// ===== BULK OPERATIONS =====

export async function loadAllTasks(): Promise<Task[]> {
  return getAllTasks();
}

export async function loadAllTemplates(): Promise<RecurringTaskTemplate[]> {
  return getAllTemplates();
}

export async function clearAllData(): Promise<void> {
  const database = await initDB();
  const tx = database.transaction(['tasks', 'templates'], 'readwrite');
  await tx.objectStore('tasks').clear();
  await tx.objectStore('templates').clear();
  await tx.done;
}
