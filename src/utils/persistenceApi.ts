import { TrackedApplication } from '../types/scheme';

const SESSION_STORAGE_KEY = 'yojanasathi.client-session-id';

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface StoredApplication {
  id: string;
  scheme_id: string;
  scheme_name: string;
  applied_date: string;
  application_number: string;
  status: TrackedApplication['status'];
  stage_description: string;
  notes: string;
}

function toStoredApplication(application: TrackedApplication): StoredApplication {
  return {
    id: application.id,
    scheme_id: application.schemeId,
    scheme_name: application.schemeName,
    applied_date: application.appliedDate,
    application_number: application.applicationNumber,
    status: application.status,
    stage_description: application.stageDescription,
    notes: application.notes,
  };
}

function fromStoredApplication(application: StoredApplication): TrackedApplication {
  return {
    id: application.id,
    schemeId: application.scheme_id,
    schemeName: application.scheme_name,
    appliedDate: application.applied_date,
    applicationNumber: application.application_number,
    status: application.status,
    stageDescription: application.stage_description,
    updatedAt: 'Saved in Supabase',
    notes: application.notes,
  };
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ys-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getClientSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = createSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return createSessionId();
  }
}

async function requestJson(
  path: string,
  init: RequestInit = {},
  fetchImpl: FetchLike = fetch,
): Promise<unknown> {
  const response = await fetchImpl(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Session': getClientSessionId(),
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'The persistence service is unavailable.');
  }
  return payload;
}

export async function loadTrackedApplications(fetchImpl: FetchLike = fetch): Promise<TrackedApplication[]> {
  const payload = await requestJson('/api/applications', { method: 'GET' }, fetchImpl) as { applications?: StoredApplication[] };
  return Array.isArray(payload.applications) ? payload.applications.map(fromStoredApplication) : [];
}

export async function saveTrackedApplication(
  application: TrackedApplication,
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  await requestJson('/api/applications', {
    method: 'POST',
    body: JSON.stringify(toStoredApplication(application)),
  }, fetchImpl);
}

export async function updateTrackedApplication(
  application: TrackedApplication,
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  await requestJson(`/api/applications/${encodeURIComponent(application.id)}`, {
    method: 'PATCH',
    body: JSON.stringify(toStoredApplication(application)),
  }, fetchImpl);
}

export async function deleteTrackedApplication(
  applicationId: string,
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  await requestJson(`/api/applications/${encodeURIComponent(applicationId)}`, {
    method: 'DELETE',
  }, fetchImpl);
}
