'use strict';

const APPROX_TOKEN_RISK_CHAR_THRESHOLD = 1500;

module.exports = {
  name: 'tokenUsage',
  check(promptText) {
    if (promptText.length > APPROX_TOKEN_RISK_CHAR_THRESHOLD) {
      return {
        rule: 'tokenUsage',
        message: 'Prompt may exceed safe token limits and increase API costs'
      };
    }

    return null;
  }
};
