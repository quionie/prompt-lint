'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const vaguePrompt = require('../src/rules/vaguePrompt');
const missingOutputFormat = require('../src/rules/missingOutputFormat');
const conflictingInstructions = require('../src/rules/conflictingInstructions');
const tokenExplosion = require('../src/rules/tokenExplosion');
const { lintPrompt } = require('../src/linter');

test('vaguePrompt triggers on short prompts', () => {
  const result = vaguePrompt.check('help me now');
  assert.equal(result.rule, 'vaguePrompt');
});

test('missingOutputFormat passes when JSON is mentioned', () => {
  const result = missingOutputFormat.check('Summarize these notes and return JSON.');
  assert.equal(result, null);
});

test('conflictingInstructions detects contradiction', () => {
  const result = conflictingInstructions.check('Be concise but extremely detailed in your explanation.');
  assert.equal(result.rule, 'conflictingInstructions');
});

test('tokenExplosion triggers for long prompts', () => {
  const prompt = 'a'.repeat(1001);
  const result = tokenExplosion.check(prompt);
  assert.equal(result.rule, 'tokenExplosion');
});

test('linter returns empty list for non-string inputs', () => {
  assert.deepEqual(lintPrompt(null), []);
  assert.deepEqual(lintPrompt('   '), []);
});
