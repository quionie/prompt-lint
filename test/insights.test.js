'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  extractBaselineWarnings,
  diffAgainstBaseline,
  appendTrendAndSave,
  buildGitHubAnnotationLine
} = require('../src/insights');

test('extractBaselineWarnings reads warnings array shape', () => {
  const warnings = extractBaselineWarnings({
    warnings: [{ file: 'a.ts', line: 1, rule: 'vaguePrompt', message: 'x' }]
  });

  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].file, 'a.ts');
});

test('diffAgainstBaseline computes new/fixed/unchanged counts', () => {
  const current = [
    { file: 'a.ts', line: 1, rule: 'vaguePrompt', message: 'x' },
    { file: 'b.ts', line: 2, rule: 'tokenUsage', message: 'y' }
  ];
  const baseline = [
    { file: 'a.ts', line: 1, rule: 'vaguePrompt', message: 'x' },
    { file: 'c.ts', line: 3, rule: 'tokenExplosion', message: 'z' }
  ];

  const diff = diffAgainstBaseline(current, baseline);

  assert.equal(diff.newCount, 1);
  assert.equal(diff.fixedCount, 1);
  assert.equal(diff.unchangedCount, 1);
});

test('appendTrendAndSave persists and computes delta', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-lint-trend-'));
  const trendPath = path.join(tempDir, 'trend.json');

  const first = appendTrendAndSave(trendPath, {
    timestamp: '2026-03-06T00:00:00.000Z',
    issueCount: 10,
    scannedPrompts: 5,
    scanRag: false,
    format: 'text'
  });
  assert.equal(first.delta, null);

  const second = appendTrendAndSave(trendPath, {
    timestamp: '2026-03-07T00:00:00.000Z',
    issueCount: 7,
    scannedPrompts: 5,
    scanRag: false,
    format: 'text'
  });
  assert.equal(second.delta, -3);
  assert.equal(second.totalRuns, 2);
});

test('buildGitHubAnnotationLine produces workflow command', () => {
  const line = buildGitHubAnnotationLine({
    file: 'docs/a.md',
    line: 9,
    rule: 'ragPromptInjection',
    message: 'Possible prompt injection instruction embedded in document.'
  });

  assert.equal(line.startsWith('::warning file=docs/a.md,line=9,title=ragPromptInjection::'), true);
});
