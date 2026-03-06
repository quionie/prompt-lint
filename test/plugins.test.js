'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { loadPluginRules, buildPluginCandidates } = require('../src/plugins');

test('buildPluginCandidates uses prompt-lint-plugin-* naming convention', () => {
  assert.deepEqual(buildPluginCandidates('acme'), ['prompt-lint-plugin-acme', 'acme']);
  assert.deepEqual(buildPluginCandidates('prompt-lint-plugin-foo'), ['prompt-lint-plugin-foo']);
});

test('loadPluginRules resolves prompt-lint-plugin-* packages and loads rules', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-lint-plugin-'));
  const pluginDir = path.join(root, 'node_modules', 'prompt-lint-plugin-enterprise');
  fs.mkdirSync(pluginDir, { recursive: true });

  fs.writeFileSync(
    path.join(pluginDir, 'index.js'),
    [
      "module.exports = {",
      "  rules: [",
      "    {",
      "      name: 'internalVocab',",
      "      check(promptText) {",
      "        if (/ticket id/i.test(promptText)) {",
      "          return { rule: 'internalVocab', message: 'Avoid internal ticket identifiers in prompts.' };",
      "        }",
      "        return null;",
      "      }",
      "    }",
      "  ]",
      "};"
    ].join('\n'),
    'utf8'
  );

  const rules = loadPluginRules(['enterprise'], root);

  assert.equal(rules.length, 1);
  assert.equal(rules[0].name, 'internalVocab');
});

test('loadPluginRules throws for unresolved plugin package', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-lint-plugin-'));

  assert.throws(() => loadPluginRules(['missing-plugin'], root), /Unable to resolve plugin/);
});
