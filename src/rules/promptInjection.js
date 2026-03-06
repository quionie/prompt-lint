'use strict';

const INJECTION_PATTERNS = [
  /\bignore\b[\s\S]{0,40}\b(previous|prior|above|all)\b[\s\S]{0,20}\binstructions\b/i,
  /\bdisregard\b[\s\S]{0,40}\binstructions\b/i,
  /\breveal\b[\s\S]{0,40}\b(system|developer)\s+prompt\b/i,
  /\bbypass\b[\s\S]{0,40}\b(safety|guardrails|policy)\b/i,
  /\bprompt injection\b/i
];

module.exports = {
  name: 'promptInjection',
  check(promptText) {
    const hasInjectionSignal = INJECTION_PATTERNS.some((pattern) => pattern.test(promptText));

    if (!hasInjectionSignal) {
      return null;
    }

    return {
      rule: 'promptInjection',
      message: 'Prompt may contain prompt-injection style instructions.',
      suggestion: 'Remove jailbreak-style directives and avoid instructions that override safety or system behavior.'
    };
  }
};
