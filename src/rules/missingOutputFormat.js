'use strict';

const OUTPUT_FORMAT_HINTS = [
  'json',
  'bullet points',
  'bullets',
  'table',
  'numbered list'
];

module.exports = {
  name: 'missingOutputFormat',
  check(promptText) {
    const normalized = promptText.toLowerCase();
    const mentionsFormat = OUTPUT_FORMAT_HINTS.some((hint) => normalized.includes(hint));

    if (!mentionsFormat) {
      return {
        rule: 'missingOutputFormat',
        message: 'Prompt does not specify an output format.',
        suggestion: 'Specify output format (JSON, bullets, table, numbered list, etc.)'
      };
    }

    return null;
  }
};
