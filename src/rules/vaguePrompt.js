'use strict';

const INSTRUCTION_VERBS = [
  'summarize',
  'analyze',
  'extract',
  'explain',
  'classify',
  'generate',
  'create',
  'list',
  'compare',
  'translate',
  'write',
  'describe',
  'identify',
  'recommend',
  'calculate',
  'convert',
  'format',
  'find',
  'evaluate',
  'define',
  'implement',
  'design',
  'review',
  'debug',
  'refactor',
  'optimize',
  'parse',
  'validate',
  'transform',
  'map',
  'filter',
  'sort',
  'merge',
  'build',
  'test',
  'deploy',
  'update',
  'delete',
  'edit',
  'rewrite'
];

function hasInstructionVerb(promptText) {
  const normalized = promptText.toLowerCase();
  return INSTRUCTION_VERBS.some((verb) => normalized.includes(verb));
}

module.exports = {
  name: 'vaguePrompt',
  check(promptText) {
    const words = promptText.trim().split(/\s+/).filter(Boolean);

    if (words.length < 8 && !hasInstructionVerb(promptText)) {
      return {
        rule: 'vaguePrompt',
        message: 'Prompt may be ambiguous.',
        suggestion:
          'Use a clear action verb (summarize, analyze, extract, explain, classify) and provide more context.'
      };
    }

    return null;
  }
};
