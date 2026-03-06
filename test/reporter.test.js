'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { printWarnings } = require('../src/reporter');

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
