#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { scanDirectory } = require('./scanner');
const { lintPrompt } = require('./linter');
const { printWarnings } = require('./reporter');
const { loadConfig } = require('./config');

function resolveScanPath(argument) {
  if (!argument) {
    return process.cwd();
  }

  return path.resolve(process.cwd(), argument);
}

function run(argv = process.argv.slice(2)) {
  const scanPath = resolveScanPath(argv[0]);
  if (!fs.existsSync(scanPath)) {
    throw new Error(`Path not found: ${scanPath}`);
  }

  const { config } = loadConfig(process.cwd());
  const stat = fs.statSync(scanPath);
  const promptFindings = stat.isDirectory()
    ? scanDirectory(scanPath)
    : scanDirectory(path.dirname(scanPath)).filter((entry) => entry.file === path.basename(scanPath));
  const warnings = [];

  for (const finding of promptFindings) {
    const ruleWarnings = lintPrompt(finding.promptText, config);

    for (const warning of ruleWarnings) {
      warnings.push({
        file: finding.file,
        line: finding.line,
        rule: warning.rule,
        message: warning.message,
        suggestion: warning.suggestion
      });
    }
  }

  warnings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  printWarnings(warnings);
  console.log(`Scanned prompts: ${promptFindings.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (warnings.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error('prompt-lint failed:', error.message);
    process.exit(2);
  }
}

module.exports = {
  run
};
