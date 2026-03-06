'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { printWarnings, buildJsonReport, buildSarifReport } = require('../src/reporter');

test('printWarnings returns 0 for no warnings', () => {
  const originalLog = console.log;
  const lines = [];
  console.log = (...args) => lines.push(args.join(' '));

  try {
    const issueCount = printWarnings([]);
    assert.equal(issueCount, 0);
    assert.equal(lines.includes('No prompt-lint warnings found.'), true);
  } finally {
    console.log = originalLog;
  }
});

test('printWarnings returns warning count', () => {
  const originalLog = console.log;
  console.log = () => {};

  try {
    const issueCount = printWarnings([
      { file: 'a.js', line: 1, rule: 'vaguePrompt', message: 'x' },
      { file: 'a.js', line: 2, rule: 'tokenExplosion', message: 'y' }
    ]);

    assert.equal(issueCount, 2);
  } finally {
    console.log = originalLog;
  }
});

test('buildJsonReport returns machine-readable summary and warnings', () => {
  const warnings = [{ file: 'docs/a.md', line: 3, rule: 'ragPromptInjection', message: 'x' }];
  const report = buildJsonReport(warnings, {
    version: '0.1.0',
    scannedPrompts: 4,
    scanRag: true,
    baseline: { baselineCount: 2, currentCount: 1, newCount: 1, fixedCount: 1, unchangedCount: 0 },
    trend: { previousIssueCount: 2, currentIssueCount: 1, delta: -1, totalRuns: 3 }
  });

  assert.equal(report.tool, 'prompt-lint');
  assert.equal(report.version, '0.1.0');
  assert.equal(report.summary.scannedPrompts, 4);
  assert.equal(report.summary.issueCount, 1);
  assert.equal(report.summary.scanRag, true);
  assert.equal(report.summary.baseline.newCount, 1);
  assert.equal(report.summary.trend.delta, -1);
  assert.equal(report.warnings.length, 1);
});

test('buildSarifReport returns SARIF 2.1.0 output', () => {
  const warnings = [{ file: 'src/a.ts', line: 10, rule: 'vaguePrompt', message: 'Prompt may be ambiguous.' }];
  const report = buildSarifReport(warnings, { version: '0.1.0', scannedPrompts: 2, scanRag: false });

  assert.equal(report.version, '2.1.0');
  assert.equal(Array.isArray(report.runs), true);
  assert.equal(report.runs[0].tool.driver.name, 'prompt-lint');
  assert.equal(report.runs[0].tool.driver.version, '0.1.0');
  assert.equal(report.runs[0].results[0].ruleId, 'vaguePrompt');
  assert.equal(report.runs[0].results[0].locations[0].physicalLocation.region.startLine, 10);
  assert.equal(report.runs[0].properties.scannedPrompts, 2);
});
