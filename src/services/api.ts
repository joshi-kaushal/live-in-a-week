import { Task, ServerTask } from '../types/task';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export interface UserProfile {
  id: string;
  phone_number: string;
  display_name: string | null;
  profile_picture_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

async function getStoredToken(): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  const result = await chrome.storage.local.get('auth_token') as { auth_token?: string };
  return result.auth_token ?? null;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    let parsed: unknown = body;
    let message = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(body) as { detail?: string; message?: string };
      parsed = json;
      message = json.detail ?? json.message ?? message;
    } catch {
      if (body) message = body;
    }
    throw new ApiError(res.status, message, parsed);
  }
  return res.json() as Promise<T>;
}

export async function requestOtp(phoneNumber: string): Promise<void> {
  await apiFetch('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber }),
  });
}

export async function verifyOtp(phoneNumber: string, code: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber, code }),
  });
}

export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/me');
}

export async function updateMe(data: { display_name?: string | null }): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ===== Tasks =====

function toServerCreate(task: Task): Record<string, unknown> {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    completed_at: task.completedAt ?? null,
    due_date: task.dueDate,
    due_time: task.dueTime ?? null,
    energy_level: task.energyLevel,
    priority: task.priority,
    priority_override: task.priorityOverride ?? false,
    color: task.color ?? null,
    recurrence: task.recurrence ?? null,
    next_occurrence: task.nextOccurrence ?? null,
    parent_task_id: task.parentTaskId ?? null,
    instance_date: task.instanceDate ?? null,
    reminders: task.reminders ?? [],
  };
}

function toServerUpdate(updates: Partial<Task>, version: number): Record<string, unknown> {
  const out: Record<string, unknown> = { version };
  const map: Array<[keyof Task, string]> = [
    ['title', 'title'],
    ['description', 'description'],
    ['status', 'status'],
    ['completedAt', 'completed_at'],
    ['dueDate', 'due_date'],
    ['dueTime', 'due_time'],
    ['energyLevel', 'energy_level'],
    ['priority', 'priority'],
    ['priorityOverride', 'priority_override'],
    ['color', 'color'],
    ['recurrence', 'recurrence'],
    ['nextOccurrence', 'next_occurrence'],
    ['parentTaskId', 'parent_task_id'],
    ['instanceDate', 'instance_date'],
    ['reminders', 'reminders'],
  ];
  for (const [k, s] of map) {
    if (k in updates) out[s] = updates[k] ?? null;
  }
  return out;
}

export function fromServer(t: ServerTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    status: t.status,
    completedAt: t.completed_at ?? undefined,
    dueDate: t.due_date,
    dueTime: t.due_time ?? undefined,
    energyLevel: t.energy_level,
    priority: t.priority,
    priorityOverride: t.priority_override,
    color: t.color ?? undefined,
    recurrence: t.recurrence ?? undefined,
    nextOccurrence: t.next_occurrence ?? undefined,
    parentTaskId: t.parent_task_id ?? undefined,
    instanceDate: t.instance_date ?? undefined,
    reminders: t.reminders ?? [],
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    syncStatus: 'synced',
    serverVersion: t.version,
    localVersion: t.version,
    lastSyncedAt: new Date().toISOString(),
  };
}

export const tasksApi = {
  async list(): Promise<Task[]> {
    const data = await apiFetch<ServerTask[]>('/tasks');
    return data.map(fromServer);
  },

  async create(task: Task): Promise<Task> {
    const data = await apiFetch<ServerTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(toServerCreate(task)),
    });
    return fromServer(data);
  },

  async update(taskId: string, updates: Partial<Task>, version: number): Promise<Task> {
    const data = await apiFetch<ServerTask>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(toServerUpdate(updates, version)),
    });
    return fromServer(data);
  },

  async remove(taskId: string): Promise<void> {
    await apiFetch<ServerTask>(`/tasks/${taskId}`, { method: 'DELETE' });
  },

  /** Bulk push (used for first-login migration). Server creates if missing, updates if present. */
  async bulkPush(tasks: Task[]): Promise<{ accepted: number; conflicts: number; errors: number }> {
    if (tasks.length === 0) return { accepted: 0, conflicts: 0, errors: 0 };
    const payload = {
      changes: tasks.map((t) => ({
        id: t.id,
        task_data: toServerCreate(t),
        client_version: t.localVersion ?? 1,
      })),
    };
    const res = await apiFetch<{ results: Array<{ status: string }> }>('/sync/push', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const tally = { accepted: 0, conflicts: 0, errors: 0 };
    for (const r of res.results) {
      if (r.status === 'accepted') tally.accepted += 1;
      else if (r.status === 'conflict') tally.conflicts += 1;
      else tally.errors += 1;
    }
    return tally;
  },
};

export function formatIndianNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    const n = digits.slice(2);
    return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}
