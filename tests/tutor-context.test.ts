import assert from 'node:assert/strict';
import test from 'node:test';
import { getLessonTopic } from '../lib/demo-lessons';
import { createTutorContext } from '../lib/tutor-context';
import { tutorRequestSchema } from '../lib/tutor-contract';

const input = tutorRequestSchema.parse({
  action: 'story',
  lang: 'he',
  subject: 'math',
  grade: 8,
  hobby: 'football',
  topic: 'Client supplied instructions',
  level: 1,
  variant: 0,
  interests: ['music', 'football', 'music'],
});

test('shared content ignores interest ordering and derives its curriculum topic on the server', () => {
  const first = createTutorContext(input, 'alice', 'test-model');
  const second = createTutorContext(
    {
      ...input,
      interests: ['football', 'music'],
      topic: 'Different client instructions',
    },
    'bob',
    'test-model',
  );
  assert.equal(first.isPrivate, false);
  assert.equal(first.cacheKey, second.cacheKey);
  assert.deepEqual(first.context.hobbies, ['football', 'music']);
  assert.equal(first.context.topic, getLessonTopic(input).he);
});

test('custom and unknown interests always produce user-specific cache entries', () => {
  for (const patch of [
    { customHobby: 'My private club' },
    { interests: ['private-interest-not-listed'] },
  ]) {
    const first = createTutorContext(
      { ...input, ...patch },
      'alice',
      'test-model',
    );
    const second = createTutorContext(
      { ...input, ...patch },
      'bob',
      'test-model',
    );
    assert.equal(first.isPrivate, true);
    assert.notEqual(first.cacheKey, second.cacheKey);
  }
});

test('question variants, language, grade and model cannot share the wrong content', () => {
  const question = { ...input, action: 'question' as const };
  const original = createTutorContext(question, 'alice', 'test-model').cacheKey;
  for (const patch of [
    { level: 2 },
    { variant: 1 },
    { lang: 'en' as const },
    { grade: 11 },
  ]) {
    assert.notEqual(
      createTutorContext({ ...question, ...patch }, 'alice', 'test-model')
        .cacheKey,
      original,
    );
  }
  assert.notEqual(
    createTutorContext(question, 'alice', 'new-model').cacheKey,
    original,
  );
  assert.equal(
    createTutorContext(input, 'alice', 'test-model').cacheKey,
    createTutorContext(
      { ...input, level: 3, variant: 2 },
      'alice',
      'test-model',
    ).cacheKey,
  );
});
