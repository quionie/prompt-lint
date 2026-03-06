'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractPromptsFromSource } = require('../src/scanner');

test('extractPromptsFromSource finds prompt and message content across target SDK calls', () => {
  const source = [
    "openai.chat.completions.create({ messages: [{ role: 'user', content: 'Summarize this in JSON.' }] });",
    "client.chat.completions.create({ prompt: 'Explain risk factors in bullet points.' });",
    "anthropic.messages.create({ messages: [{ role: 'user', content: 'Analyze sentiment and return a table.' }] });",
    "model.generateContent({ prompt: 'Classify priority and return a numbered list.' });",
    "ai.generateText({ content: 'Extract product names and output JSON.' });"
  ].join('\n');

  const prompts = extractPromptsFromSource(source);

  assert.equal(prompts.length, 5);
  assert.deepEqual(
    prompts.map((p) => p.promptText),
    [
      'Summarize this in JSON.',
      'Explain risk factors in bullet points.',
      'Analyze sentiment and return a table.',
      'Classify priority and return a numbered list.',
      'Extract product names and output JSON.'
    ]
  );
  assert.deepEqual(
    prompts.map((p) => p.line),
    [1, 2, 3, 4, 5]
  );
});

test('extractPromptsFromSource handles nested braces without truncating object parsing', () => {
  const source = [
    'openai.chat.completions.create({',
    "  metadata: { depth: { level: 2 } },",
    "  prompt: 'Explain architecture in a numbered list.'",
    '});'
  ].join('\n');

  const prompts = extractPromptsFromSource(source);

  assert.equal(prompts.length, 1);
  assert.equal(prompts[0].promptText, 'Explain architecture in a numbered list.');
  assert.equal(prompts[0].line, 3);
});
