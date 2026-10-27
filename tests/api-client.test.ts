import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import { parseResponse, postJson } from '../lib/api-client';

test('JSON requests encode their input and validate successful responses', async (context) => {
  context.mock.method(
    globalThis,
    'fetch',
    async (url: string, options: RequestInit) => {
      assert.equal(url, '/api/example');
      assert.equal(options.method, 'POST');
      assert.equal(
        new Headers(options.headers).get('content-type'),
        'application/json',
      );
      assert.deepEqual(JSON.parse(String(options.body)), { value: 5 });
      return Response.json({ saved: true, unused: 'not part of the contract' });
    },
  );
  assert.deepEqual(
    await postJson(
      '/api/example',
      { value: 5 },
      z.object({ saved: z.literal(true) }),
    ),
    { saved: true },
  );
});

test('malformed success payloads are rejected before reaching UI state', async () => {
  await assert.rejects(
    parseResponse(Response.json({ text: 12 }), z.object({ text: z.string() })),
  );
});

test('server failures preserve known codes without trusting malformed error objects', async () => {
  await assert.rejects(
    parseResponse(
      Response.json({ error: 'rate_limit' }, { status: 429 }),
      z.unknown(),
    ),
    /^Error: rate_limit$/,
  );
  await assert.rejects(
    parseResponse(
      Response.json({ error: { secret: 'untrusted' } }, { status: 503 }),
      z.unknown(),
    ),
    /^Error: unavailable$/,
  );
});
