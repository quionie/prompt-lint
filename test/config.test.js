'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { DEFAULT_CONFIG, loadConfig, normalizeConfig } = require('../src/config');

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
    enablePromptInjectionRule: true
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

test('loadConfig throws for invalid JSON', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-lint-config-'));
  const configPath = path.join(tempDir, '.promptlintrc');

  fs.writeFileSync(configPath, '{ invalid json', 'utf8');

  assert.throws(() => loadConfig(tempDir), /Invalid \.promptlintrc JSON/);
});
