const API_BASE = '/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('ffd_token', token);
  } else {
    localStorage.removeItem('ffd_token');
  }
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem('ffd_token');
  }
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem('ffd_token');
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Auth
export async function login(email: string, password: string) {
  const result = await apiFetch<{
    accessToken: string;
    expiresIn: number;
    user: any;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  setAccessToken(result.accessToken);
  return result;
}

export async function getCurrentUser() {
  return apiFetch<any>('/auth/me');
}

export function logout() {
  clearAccessToken();
}

// Locations
export async function getLocations() {
  return apiFetch<any[]>('/locations?isActive=true');
}

// Job Roles
export async function getJobRoles() {
  return apiFetch<any[]>('/jobroles?isActive=true');
}

// Templates
export async function getActiveTemplate() {
  return apiFetch<any>('/templates/active');
}

export async function getTemplates() {
  return apiFetch<any[]>('/templates');
}

// Assessments
export async function getAssessments(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/assessments${query}`);
}

export async function getAssessment(id: string) {
  return apiFetch<any>(`/assessments/${id}`);
}

export async function createAssessment(data: any) {
  return apiFetch<any>('/assessments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAssessment(id: string, data: any) {
  return apiFetch<any>(`/assessments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitAssessment(id: string, data: any) {
  return apiFetch<any>(`/assessments/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function voidAssessment(id: string, reason: string) {
  return apiFetch<any>(`/assessments/${id}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function previewDecision(data: any) {
  return apiFetch<{ decision: string; warnings: string[] }>('/assessments/preview-decision', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Reports
export async function getReportSummary(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<any>(`/reports/summary${query}`);
}

// Users (Admin)
export async function getUsers() {
  return apiFetch<any[]>('/users');
}

export async function createUser(data: any) {
  return apiFetch<any>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: any) {
  return apiFetch<any>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string) {
  return apiFetch<any>(`/users/${id}`, {
    method: 'DELETE',
  });
}
