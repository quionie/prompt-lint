'use strict';

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /ignore\s+(?:all\s+)?(?:prior|above|earlier)\s+instructions/i,
  /forget\s+(?:all\s+)?(?:your|the|any)\s+instructions/i,
  /disregard\s+(?:all\s+)?(?:your|the|any|previous)?\s*instructions/i,
  /reveal\s+(?:the\s+)?system\s+prompt/i,
  /(?:show|display|print|output|reveal)\s+(?:the\s+)?hidden\s+(?:prompt|instructions)/i,
  /act\s+as\s+(?:a\s+)?system/i,
  /system\s+override/i,
  /developer\s+mode\s+enabled/i,
  /you\s+are\s+now\s+(?:in\s+)?(?:developer|debug|admin)\s+mode/i,
  /pretend\s+(?:you\s+are|to\s+be|that\s+you)/i,
  /override\s+(?:your\s+)?(?:system|safety|security)\s+(?:prompt|instructions|rules)/i,
  /new\s+instructions?\s*:/i,
  /\[system\]/i,
  /\[INST\]/i,
  /BEGIN\s+INSTRUCTION/i,
  /END\s+INSTRUCTION/i
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
