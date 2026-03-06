'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { lintPrompt } = require('../src/linter');

test('lintPrompt executes plugin rules alongside built-in rules', () => {
  const pluginRules = [
    {
      name: 'internalStyle',
      check(promptText) {
        if (promptText.includes('foobar')) {
          return {
            rule: 'internalStyle',
            message: 'Replace foobar with approved enterprise terminology.'
          };
        }
        return null;
      }
    }
  ];

  const warnings = lintPrompt('Please summarize foobar and output JSON.', {
    requireOutputFormat: true,
    enablePromptInjectionRule: false,
    maxPromptLength: 1000
  }, pluginRules);

  assert.equal(warnings.some((warning) => warning.rule === 'internalStyle'), true);
});
