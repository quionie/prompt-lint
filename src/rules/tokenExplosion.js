'use strict';

const DEFAULT_MAX_PROMPT_CHARS = 1000;

module.exports = {
  name: 'tokenExplosion',
  check(promptText, config = {}) {
    const maxPromptLength =
      Number.isInteger(config.maxPromptLength) && config.maxPromptLength > 0
        ? config.maxPromptLength
        : DEFAULT_MAX_PROMPT_CHARS;

    if (promptText.length > maxPromptLength) {
      return {
        rule: 'tokenExplosion',
        message: `Prompt length exceeds ${maxPromptLength} characters.`,
        suggestion: 'Shorten prompt content or split instructions into smaller, focused prompts.'
      };
    }

    return null;
  }
};
