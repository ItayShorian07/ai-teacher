import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePolynomial } from '../lib/polynomial';

test('implicit multiplication and quadratic products retain their coefficients', () => {
  assert.deepEqual(parsePolynomial('2(x + 3)', 'x'), [6, 2, 0]);
  assert.deepEqual(parsePolynomial('(x - 3)(x + 3)', 'x'), [-9, 0, 1]);
  assert.deepEqual(parsePolynomial('-x² + 2x + 3', 'x'), [3, 2, -1]);
});

test('unsupported degrees, unknown variables and invalid divisors fail closed', () => {
  for (const expression of [
    'x^3',
    'y + 1',
    'x / (x - 1)',
    '1 / 0',
    '0^0',
    '2..3',
    'x'.repeat(201),
  ]) {
    assert.equal(parsePolynomial(expression, 'x'), null, expression);
  }
});
