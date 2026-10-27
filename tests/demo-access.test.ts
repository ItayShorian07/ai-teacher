import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_QUESTION_LIMIT, parseDemoCompletions } from '../lib/demo-access';

test('demo progress accepts only completed questions within the limit', () => {
  assert.equal(parseDemoCompletions(null), 0);
  assert.equal(parseDemoCompletions('invalid'), 0);
  assert.equal(parseDemoCompletions('-1'), 0);
  assert.equal(parseDemoCompletions('1.5'), 0);
  assert.equal(parseDemoCompletions('2'), 2);
  assert.equal(parseDemoCompletions('99'), DEMO_QUESTION_LIMIT);
});
