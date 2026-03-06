'use strict';

const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all previous instructions/i,
  /forget your instructions/i,
  /reveal the system prompt/i,
  /act as system/i,
  /system override/i,
  /developer mode enabled/i,
  /output the hidden prompt/i,
  /show hidden instructions/i
];

module.exports = {
  name: 'ragPromptInjection',
  check(text) {
    const value = typeof text === 'string' ? text : '';
    const matched = INJECTION_PATTERNS.some((pattern) => pattern.test(value));

    if (!matched) {
      return null;
    }

    return {
      rule: 'ragPromptInjection',
      message: 'Possible prompt injection instruction embedded in document.'
    };
  }
};
