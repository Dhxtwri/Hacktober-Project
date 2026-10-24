import assert from 'node:assert/strict';
import test from 'node:test';
import { requestEligibility } from './eligibilityApi';

const profile = { age: 70, gender: 'female' as const, aadhaar_available: 'yes' as const };

test('requestEligibility sends the current profile and returns backend results', async () => {
  let requestBody = '';
  const response = new Response(JSON.stringify({
    results: [{ scheme_id: 'ab-pmjay-70-plus', status: 'likely_eligible' }],
    screening_notice: 'preliminary',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const result = await requestEligibility(profile, async (input, init) => {
    assert.equal(input, '/api/eligibility');
    assert.equal(init?.method, 'POST');
    requestBody = String(init?.body);
    return response;
  });

  assert.deepEqual(JSON.parse(requestBody), { profile });
  assert.equal(result.results[0].scheme_id, 'ab-pmjay-70-plus');
});

test('requestEligibility surfaces backend errors without a mock fallback', async () => {
  const response = new Response(JSON.stringify({ error: { message: 'service unavailable' } }), { status: 503 });
  await assert.rejects(
    requestEligibility(profile, async () => response),
    { message: 'service unavailable' },
  );
});

test('requestEligibility rejects malformed success responses', async () => {
  const response = new Response(JSON.stringify({ schemes: [] }), { status: 200 });
  await assert.rejects(
    requestEligibility(profile, async () => response),
    { message: 'The eligibility service returned an invalid response.' },
  );
});
