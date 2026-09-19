import test from 'node:test';
import assert from 'node:assert/strict';

import { syncNumericInputs } from './syncNumericInputs.js';

test('preserves newline before the numeric input field', () => {
  const result = syncNumericInputs('Priset på potatis är proportionellt mot vikten.\nPriset är 16 kr/kg.\nVad kostar 1,5 kg?\n{{input}} kr', 1);

  assert.equal(
    result,
    'Priset på potatis är proportionellt mot vikten.\nPriset är 16 kr/kg.\nVad kostar 1,5 kg?\nSvar: {{input}}'
  );
});

test('keeps existing line breaks in the question text', () => {
  const result = syncNumericInputs('Första raden\nAndra raden\n{{input}}', 1);

  assert.equal(result, 'Första raden\nAndra raden\nSvar: {{input}}');
});

test('adds a final answer line for a single numeric input', () => {
  const result = syncNumericInputs('Vad är 2 + 2?', 1);

  assert.equal(result, 'Vad är 2 + 2?\nSvar: {{input}}');
});
