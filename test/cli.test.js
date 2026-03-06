'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseArgs } = require('../src/cli');

test('parseArgs handles --ci with optional path', () => {
  assert.deepEqual(parseArgs(['--ci']), { ci: true, scanRag: false, targetPath: null });
  assert.deepEqual(parseArgs(['--ci', './src']), { ci: true, scanRag: false, targetPath: './src' });
  assert.deepEqual(parseArgs(['./src', '--ci']), { ci: true, scanRag: false, targetPath: './src' });
});

test('parseArgs defaults ci=false and accepts one path', () => {
  assert.deepEqual(parseArgs([]), { ci: false, scanRag: false, targetPath: null });
  assert.deepEqual(parseArgs(['./example']), { ci: false, scanRag: false, targetPath: './example' });
});

test('parseArgs handles --scan-rag with optional path', () => {
  assert.deepEqual(parseArgs(['--scan-rag']), { ci: false, scanRag: true, targetPath: null });
  assert.deepEqual(parseArgs(['--scan-rag', './docs']), {
    ci: false,
    scanRag: true,
    targetPath: './docs'
  });
  assert.deepEqual(parseArgs(['--ci', '--scan-rag', './docs']), {
    ci: true,
    scanRag: true,
    targetPath: './docs'
  });
});

test('parseArgs throws on unknown flags and multiple paths', () => {
  assert.throws(() => parseArgs(['--unknown']), /Unknown flag/);
  assert.throws(() => parseArgs(['./a', './b']), /Only one path argument is supported/);
});
