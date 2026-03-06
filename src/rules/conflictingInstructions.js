'use strict';

const CONFLICT_PATTERNS = [
  /\bbe concise\b[\s\S]{0,60}\bextremely detailed\b/i,
  /\bextremely detailed\b[\s\S]{0,60}\bbe concise\b/i,
  /\bshort\b[\s\S]{0,60}\bcomprehensive\b/i,
  /\bcomprehensive\b[\s\S]{0,60}\bshort\b/i
];

module.exports = {
  name: 'conflictingInstructions',
  check(promptText) {
    const hasConflict = CONFLICT_PATTERNS.some((pattern) => pattern.test(promptText));

    if (hasConflict) {
      return {
        rule: 'conflictingInstructions',
        message: 'Prompt contains potentially conflicting instructions.',
        suggestion: 'Remove contradictory constraints and prioritize one clear instruction style.'
      };
    }

    return null;
  }
};
