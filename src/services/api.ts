const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

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
    try {
      const json = JSON.parse(body);
      throw new Error(json.detail ?? json.message ?? `HTTP ${res.status}`);
    } catch {
      throw new Error(body || `HTTP ${res.status}`);
    }
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
