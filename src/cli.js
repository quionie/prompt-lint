#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { scanDirectory, scanRagDocuments } = require('./scanner');
const { lintPrompt } = require('./linter');
const { printWarnings } = require('./reporter');
const { loadConfig } = require('./config');
const ragPromptInjection = require('./rules/ragPromptInjection');

function resolveScanPath(targetPath) {
  if (!targetPath) {
    return process.cwd();
  }

  return path.resolve(process.cwd(), targetPath);
}

function parseArgs(argv) {
  let ci = false;
  let scanRag = false;
  let targetPath = null;

  for (const arg of argv) {
    if (arg === '--ci') {
      ci = true;
      continue;
    }
    if (arg === '--scan-rag') {
      scanRag = true;
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    if (targetPath) {
      throw new Error('Only one path argument is supported.');
    }
    targetPath = arg;
  }

  return { ci, scanRag, targetPath };
}

function run(argv = process.argv.slice(2)) {
  const { ci, scanRag, targetPath } = parseArgs(argv);
  const scanPath = resolveScanPath(targetPath);
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
  if (scanRag) {
    warnings.push(...scanRagDocuments(scanPath, ragPromptInjection));
  }

  warnings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  const issueCount = printWarnings(warnings);
  console.log(`Scanned prompts: ${promptFindings.length}`);
  console.log(`Warnings: ${issueCount}`);

  if (ci) {
    console.log(`${issueCount} prompt issues detected.`);
    if (issueCount > 0) {
      process.exit(1);
    }
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
  run,
  parseArgs
};
