'use strict';

const vaguePrompt = require('./rules/vaguePrompt');
const missingOutputFormat = require('./rules/missingOutputFormat');
const conflictingInstructions = require('./rules/conflictingInstructions');
const tokenExplosion = require('./rules/tokenExplosion');
const promptInjection = require('./rules/promptInjection');

const RULES = [
  vaguePrompt,
  missingOutputFormat,
  conflictingInstructions,
  tokenExplosion,
  promptInjection
];

function shouldRunRule(ruleName, config) {
  if (ruleName === 'missingOutputFormat') {
    return config.requireOutputFormat === true;
  }

  if (ruleName === 'promptInjection') {
    return config.enablePromptInjectionRule === true;
  }

  return true;
}

function lintPrompt(promptText, config = {}) {
  if (typeof promptText !== 'string' || promptText.trim().length === 0) {
    return [];
  }

  return RULES.filter((rule) => shouldRunRule(rule.name, config))
    .map((rule) => rule.check(promptText, config))
    .filter(Boolean);
}

module.exports = {
  lintPrompt,
  rules: RULES
};
