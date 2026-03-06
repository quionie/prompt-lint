'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseArgs } = require('../src/cli');

test('parseArgs handles --ci with optional path', () => {
  assert.deepEqual(parseArgs(['--ci']), {
    ci: true,
    strict: false,
    scanRag: false,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'text',
    targetPath: null
  });
  assert.deepEqual(parseArgs(['--ci', './src']), {
    ci: true,
    strict: false,
    scanRag: false,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'text',
    targetPath: './src'
  });
  assert.deepEqual(parseArgs(['./src', '--ci']), {
    ci: true,
    strict: false,
    scanRag: false,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'text',
    targetPath: './src'
  });
});

test('parseArgs defaults ci=false and accepts one path', () => {
  assert.deepEqual(parseArgs([]), {
    ci: false,
    strict: false,
    scanRag: false,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'text',
    targetPath: null
  });
  assert.deepEqual(parseArgs(['./example']), {
    ci: false,
    strict: false,
    scanRag: false,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'text',
    targetPath: './example'
  });
});

test('parseArgs handles --scan-rag with optional path', () => {
  assert.deepEqual(parseArgs(['--scan-rag']), {
    ci: false,
    strict: false,
    scanRag: true,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'text',
    targetPath: null
  });
  assert.deepEqual(parseArgs(['--scan-rag', './docs']), {
    ci: false,
    strict: false,
    scanRag: true,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'text',
    targetPath: './docs'
  });
  assert.deepEqual(parseArgs(['--ci', '--scan-rag', './docs']), {
    ci: true,
    strict: false,
    scanRag: true,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'text',
    targetPath: './docs'
  });
  assert.deepEqual(parseArgs(['--strict', '--scan-rag', './docs']), {
    ci: false,
    strict: true,
    scanRag: true,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'text',
    targetPath: './docs'
  });
});

test('parseArgs handles --format values', () => {
  assert.deepEqual(parseArgs(['--format', 'json']), {
    ci: false,
    strict: false,
    scanRag: false,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'json',
    targetPath: null
  });
  assert.deepEqual(parseArgs(['--format=sarif', './src']), {
    ci: false,
    strict: false,
    scanRag: false,
    githubAnnotations: false,
    baselineFile: null,
    trendFile: null,
    format: 'sarif',
    targetPath: './src'
  });
});

test('parseArgs handles baseline, trend, and github annotation flags', () => {
  assert.deepEqual(
    parseArgs(['--baseline', '.promptlint-baseline.json', '--trend-file=.promptlint-trend.json', '--github-annotations']),
    {
      ci: false,
      strict: false,
      scanRag: false,
      githubAnnotations: true,
      baselineFile: '.promptlint-baseline.json',
      trendFile: '.promptlint-trend.json',
      format: 'text',
      targetPath: null
    }
  );
});

test('parseArgs throws on unknown flags and multiple paths', () => {
  assert.throws(() => parseArgs(['--unknown']), /Unknown flag/);
  assert.throws(() => parseArgs(['./a', './b']), /Only one path argument is supported/);
  assert.throws(() => parseArgs(['--format']), /Missing value for --format/);
  assert.throws(() => parseArgs(['--format', 'xml']), /Unsupported format/);
  assert.throws(() => parseArgs(['--baseline']), /Missing value for --baseline/);
  assert.throws(() => parseArgs(['--trend-file']), /Missing value for --trend-file/);
});
