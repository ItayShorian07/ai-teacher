import assert from 'node:assert/strict';
import test from 'node:test';
import { accountProfileSchema } from '../lib/auth-validation';
import {
  getDefaultHobby,
  getNextPracticeLevel,
  toAnswerFeedback,
  type PracticeRecord,
} from '../lib/classroom-session';
import {
  questionResponseSchema,
  storyResponseSchema,
  transcriptionResponseSchema,
} from '../lib/tutor-contract';

test('profile interests select the matching demo track with a stable default', () => {
  const profile = accountProfileSchema.parse({
    username: 'noa_levi',
    first_name: 'נועה',
    last_name: 'לוי',
    city: 'חיפה',
    age: 14,
    grade: 8,
    phone: '+972501234567',
    locale: 'he',
    school: 'תיכון חיפה',
    custom_hobby: null,
  });
  assert.equal(getDefaultHobby(profile), 'football');
  assert.equal(getDefaultHobby({ ...profile, hobbies: ['music'] }), 'music');
  assert.equal(
    getDefaultHobby({ ...profile, custom_hobby: 'משחקי מחשב' }),
    'gaming',
  );
  assert.equal(
    getDefaultHobby({ ...profile, hobbies: ['space', 'music'] }),
    'space',
  );
});

test('difficulty advances after pairs of independent answers and stays bounded', () => {
  const independent: PracticeRecord = {
    question: 'x = 5',
    neededHelp: false,
    topic: 'Equations',
  };
  const assisted = { ...independent, neededHelp: true };
  assert.equal(getNextPracticeLevel([], 1), 1);
  assert.equal(getNextPracticeLevel([independent], 1), 1);
  assert.equal(getNextPracticeLevel([independent, independent], 1), 2);
  assert.equal(getNextPracticeLevel([independent, assisted], 1), 1);
  assert.equal(
    getNextPracticeLevel([independent, independent, independent], 2),
    2,
  );
  assert.equal(
    getNextPracticeLevel([assisted, assisted, independent, independent], 2),
    3,
  );
  assert.equal(getNextPracticeLevel([independent, independent], 3), 3);
});

test('incomplete AI answers remain unfinished in the practice UI', () => {
  const feedback = toAnswerFeedback({
    status: 'partial',
    feedback: 'Keep going.',
  });
  assert.equal(feedback.status, 'continue');
  assert.deepEqual(feedback.message, { en: 'Keep going.', he: 'Keep going.' });
  assert.equal(
    toAnswerFeedback({ status: 'mistake', feedback: 'Check this step.' })
      .status,
    'mistake',
  );
});

test('public question responses never expose answer keys or private rubrics', () => {
  const response = questionResponseSchema.parse({
    questionId: '00000000-0000-4000-8000-000000000001',
    cached: false,
    sources: [],
    question: {
      prompt: 'Solve',
      expression: 'x + 2 = 7',
      hint: 'Subtract two.',
      recovery: '2 + 3 = ?',
      answer: '5',
      recoveryAnswer: '5',
      explanation: 'Private rubric',
    },
  });
  assert.deepEqual(Object.keys(response.question).sort(), [
    'expression',
    'hint',
    'prompt',
    'recovery',
  ]);
  assert.equal(
    questionResponseSchema.safeParse({ ...response, questionId: '' }).success,
    false,
  );
  assert.equal(
    questionResponseSchema.safeParse({
      ...response,
      question: { ...response.question, prompt: '' },
    }).success,
    false,
  );
  assert.equal(
    storyResponseSchema.safeParse({
      text: 'Story',
      sources: 'not-an-array',
      cached: false,
    }).success,
    false,
  );
  assert.equal(
    transcriptionResponseSchema.safeParse({ text: 'x'.repeat(8001) }).success,
    false,
  );
});
