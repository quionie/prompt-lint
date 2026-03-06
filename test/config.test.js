'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { DEFAULT_CONFIG, loadConfig, normalizeConfig, loadIgnoreFile } = require('../src/config');

test('loadConfig returns defaults when .promptlintrc is missing', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-lint-config-'));

  const result = loadConfig(tempDir);

  assert.equal(result.path, null);
  assert.deepEqual(result.config, DEFAULT_CONFIG);
});

test('loadConfig reads and normalizes .promptlintrc JSON values', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-lint-config-'));
  const configPath = path.join(tempDir, '.promptlintrc');

  fs.writeFileSync(
    configPath,
    JSON.stringify({
      maxPromptLength: 800,
      requireOutputFormat: false,
      enablePromptInjectionRule: true
    }),
    'utf8'
  );

  const result = loadConfig(tempDir);

  assert.equal(result.path, configPath);
  assert.deepEqual(result.config, {
    maxPromptLength: 800,
    requireOutputFormat: false,
    enablePromptInjectionRule: true,
    include: [],
    exclude: [],
    plugins: []
  });
});

test('normalizeConfig falls back on defaults for invalid values', () => {
  const normalized = normalizeConfig({
    maxPromptLength: -1,
    requireOutputFormat: 'yes',
    enablePromptInjectionRule: 1
  });

  assert.deepEqual(normalized, DEFAULT_CONFIG);
});

test('normalizeConfig keeps valid include/exclude glob arrays', () => {
  const normalized = normalizeConfig({
    include: ['packages/**/src/**/*.ts', 'apps/**'],
    exclude: ['**/*.test.ts', 'dist/**'],
    plugins: ['enterprise', 'prompt-lint-plugin-style']
  });

  assert.deepEqual(normalized.include, ['packages/**/src/**/*.ts', 'apps/**']);
  assert.deepEqual(normalized.exclude, ['**/*.test.ts', 'dist/**']);
  assert.deepEqual(normalized.plugins, ['enterprise', 'prompt-lint-plugin-style']);
});

test('loadIgnoreFile returns parsed .promptlintignore patterns', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-lint-ignore-'));
  const ignorePath = path.join(tempDir, '.promptlintignore');

  fs.writeFileSync(ignorePath, ['# comment', '', 'dist/**', 'packages/**/generated/**'].join('\n'), 'utf8');

  const result = loadIgnoreFile(tempDir);
  assert.equal(result.path, ignorePath);
  assert.deepEqual(result.patterns, ['dist/**', 'packages/**/generated/**']);
});

test('loadConfig throws for invalid JSON', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-lint-config-'));
  const configPath = path.join(tempDir, '.promptlintrc');

  fs.writeFileSync(configPath, '{ invalid json', 'utf8');

  assert.throws(() => loadConfig(tempDir), /Invalid \.promptlintrc JSON/);
});
