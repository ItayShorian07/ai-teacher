import assert from 'node:assert/strict';
import test from 'node:test';
import { isPhoneVerified } from '../lib/auth-validation';
import {
  createHumanVerificationToken,
  verifyHumanVerificationToken,
} from '../lib/human-verification-token';
import {
  generatedQuestionSchema,
  isValidPdf,
  MAX_PDF_BYTES,
  tutorRequestSchema,
} from '../lib/tutor-contract';
test('human challenge proof rejects a different user, altered signature, expiry and key rotation', () => {
  const now = 1000000,
    token = createHumanVerificationToken('alice', 'test-secret', now);
  assert.equal(
    verifyHumanVerificationToken(token, 'alice', 'test-secret', now + 1),
    true,
  );
  for (const [value, user, key, time] of [
    [token, 'bob', 'test-secret', now],
    [token, 'alice', 'other-key', now],
    [token, 'alice', 'test-secret', now + 1800000],
    [token + '.x', 'alice', 'test-secret', now],
    [token.replace('a', 'b'), 'alice', 'test-secret', now],
  ] as const)
    assert.equal(verifyHumanVerificationToken(value, user, key, time), false);
  assert.equal(
    verifyHumanVerificationToken(undefined, 'alice', 'test-secret', now),
    false,
  );
});
test('tutor boundary rejects client supplied answer keys, identity, malformed tracks and oversized drafts', () => {
  const input = {
    action: 'check',
    lang: 'he',
    subject: 'math',
    stage: 'middle',
    hobby: 'football',
    topic: 'אלגברה',
    level: 1,
    variant: 0,
    studentAnswer: '5',
  };
  assert.equal(tutorRequestSchema.safeParse(input).success, true);
  for (const patch of [
    { correctAnswer: '5' },
    { userId: 'victim' },
    { level: 0 },
    { level: Infinity },
    { stage: 'college' },
    { studentAnswer: 'x'.repeat(8001) },
    { action: 'admin' },
    { customHobby: 'x'.repeat(61) },
    { questionId: 'not-a-uuid' },
  ])
    assert.equal(
      tutorRequestSchema.safeParse({ ...input, ...patch }).success,
      false,
    );
});
test('PDF byte validation rejects renamed text and oversized documents', () => {
  assert.equal(isValidPdf(Buffer.from('%PDF-1.7\nexample')), true);
  assert.equal(isValidPdf(Buffer.from('not a PDF')), false);
  const large = Buffer.alloc(MAX_PDF_BYTES + 1);
  large.write('%PDF-');
  assert.equal(isValidPdf(large), false);
});
test('invalid generated questions cannot silently become questions with answer zero', () => {
  assert.equal(
    generatedQuestionSchema.safeParse({
      prompt: 'Solve',
      expression: '?',
      answer: '',
    }).success,
    false,
  );
});
test('optional SMS verification must belong to the same account and exact phone', () => {
  const user = {
    id: 'alice',
    phone: '972501234567',
    phone_confirmed_at: '2026-09-17',
  };
  assert.equal(isPhoneVerified(user, '+972501234567', 'alice'), true);
  assert.equal(isPhoneVerified(user, '+972509999999', 'alice'), false);
  assert.equal(isPhoneVerified(user, '+972501234567', 'bob'), false);
  assert.equal(
    isPhoneVerified(
      { ...user, phone_confirmed_at: null },
      '+972501234567',
      'alice',
    ),
    false,
  );
});

test('body limits reject forged lengths and stop oversized streams before parsing', async () => {
  const { readRequestBody: boundedBody } = await import('../lib/request-body');
  const request = (body: string, declared?: string) =>
    new Request('http://localhost', {
      method: 'POST',
      body,
      headers: declared ? { 'content-length': declared } : {},
    });
  assert.equal((await boundedBody(request('שלום'), 8)).toString(), 'שלום');
  await assert.rejects(boundedBody(request('שלום', '1'), 7), /BODY_TOO_LARGE/);
  await assert.rejects(boundedBody(request('ok', '100'), 8), /BODY_TOO_LARGE/);
  await assert.rejects(
    boundedBody(new Request('http://localhost'), 8),
    /EMPTY_BODY/,
  );
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(9));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    boundedBody(
      new Request('http://localhost', {
        method: 'POST',
        body: stream,
        duplex: 'half',
      } as RequestInit),
      8,
    ),
    /BODY_TOO_LARGE/,
  );
  assert.equal(cancelled, true);
});
