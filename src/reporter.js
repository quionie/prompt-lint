'use strict';

function groupByFile(warnings) {
  const groups = new Map();

  for (const warning of warnings) {
    if (!groups.has(warning.file)) {
      groups.set(warning.file, []);
    }
    groups.get(warning.file).push(warning);
  }

  return groups;
}

function printWarnings(warnings) {
  if (!warnings.length) {
    console.log('No prompt-lint warnings found.');
    return;
  }

  const grouped = groupByFile(warnings);

  for (const [file, fileWarnings] of grouped.entries()) {
    console.log(`\u26a0 ${file}`);

    for (const warning of fileWarnings) {
      console.log(`Line ${warning.line}`);
      console.log(`Rule: ${warning.rule}`);
      console.log(`Message: ${warning.message}`);
      if (warning.suggestion) {
        console.log(`Suggestion: ${warning.suggestion}`);
      }
      console.log('');
    }
  }
}

module.exports = {
  printWarnings
};
