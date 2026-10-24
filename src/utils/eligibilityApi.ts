import { CitizenProfile, EligibilityResponse } from '../types/scheme';
import { getClientSessionId } from './persistenceApi';

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function requestEligibility(
  profile: CitizenProfile,
  fetchImpl: FetchLike = fetch,
): Promise<EligibilityResponse> {
  const response = await fetchImpl('/api/eligibility', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Session': getClientSessionId(),
    },
    body: JSON.stringify({ profile }),
  });
  const payload = await response.json().catch(() => null) as EligibilityResponse | { error?: { message?: string } } | null;

  if (!response.ok) {
    const message = payload && 'error' in payload && payload.error?.message
      ? payload.error.message
      : 'The eligibility service rejected this profile.';
    throw new Error(message);
  }

  if (!payload || !('results' in payload) || !Array.isArray(payload.results)) {
    throw new Error('The eligibility service returned an invalid response.');
  }

  return payload;
}
