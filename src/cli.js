#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { scanDirectory, scanRagDocuments } = require('./scanner');
const { lintPrompt } = require('./linter');
const { printWarnings, buildJsonReport, buildSarifReport } = require('./reporter');
const { loadConfig, loadIgnoreFile } = require('./config');
const { loadPluginRules } = require('./plugins');
const {
  loadBaselineFile,
  diffAgainstBaseline,
  appendTrendAndSave,
  buildGitHubAnnotationLine
} = require('./insights');
const ragPromptInjection = require('./rules/ragPromptInjection');
const { version } = require('../package.json');

function resolveScanPath(targetPath) {
  if (!targetPath) {
    return process.cwd();
  }

  return path.resolve(process.cwd(), targetPath);
}

function parseArgs(argv) {
  let ci = false;
  let strict = false;
  let scanRag = false;
  let githubAnnotations = false;
  let baselineFile = null;
  let trendFile = null;
  let format = 'text';
  let targetPath = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--ci') {
      ci = true;
      continue;
    }
    if (arg === '--strict') {
      strict = true;
      continue;
    }
    if (arg === '--scan-rag') {
      scanRag = true;
      continue;
    }
    if (arg === '--github-annotations') {
      githubAnnotations = true;
      continue;
    }

    if (arg === '--format') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --format. Use one of: text, json, sarif');
      }
      i += 1;
      format = value;
      continue;
    }
    if (arg.startsWith('--format=')) {
      const value = arg.slice('--format='.length);
      if (!value) {
        throw new Error('Missing value for --format. Use one of: text, json, sarif');
      }
      format = value;
      continue;
    }

    if (arg === '--baseline') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --baseline. Example: --baseline .promptlint-baseline.json');
      }
      i += 1;
      baselineFile = value;
      continue;
    }
    if (arg.startsWith('--baseline=')) {
      const value = arg.slice('--baseline='.length);
      if (!value) {
        throw new Error('Missing value for --baseline. Example: --baseline .promptlint-baseline.json');
      }
      baselineFile = value;
      continue;
    }

    if (arg === '--trend-file') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --trend-file. Example: --trend-file .promptlint-trend.json');
      }
      i += 1;
      trendFile = value;
      continue;
    }
    if (arg.startsWith('--trend-file=')) {
      const value = arg.slice('--trend-file='.length);
      if (!value) {
        throw new Error('Missing value for --trend-file. Example: --trend-file .promptlint-trend.json');
      }
      trendFile = value;
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

  if (!['text', 'json', 'sarif'].includes(format)) {
    throw new Error(`Unsupported format: ${format}. Use text, json, or sarif`);
  }

  return {
    ci,
    strict,
    scanRag,
    githubAnnotations,
    baselineFile,
    trendFile,
    format,
    targetPath
  };
}

function run(argv = process.argv.slice(2)) {
  const { ci, strict, scanRag, githubAnnotations, baselineFile, trendFile, format, targetPath } = parseArgs(argv);
  const scanPath = resolveScanPath(targetPath);
  if (!fs.existsSync(scanPath)) {
    throw new Error(`Path not found: ${scanPath}`);
  }

  const projectRoot = process.cwd();
  const { config } = loadConfig(projectRoot);
  const { patterns: ignoreGlobs } = loadIgnoreFile(projectRoot);
  const pluginRules = loadPluginRules(config.plugins, projectRoot);
  const scanOptions = {
    projectRoot,
    includeGlobs: config.include,
    excludeGlobs: config.exclude,
    ignoreGlobs
  };
  const stat = fs.statSync(scanPath);
  const promptFindings = stat.isDirectory()
    ? scanDirectory(scanPath, scanOptions)
    : scanDirectory(path.dirname(scanPath), scanOptions).filter((entry) => entry.file === path.basename(scanPath));
  const warnings = [];

  for (const finding of promptFindings) {
    const ruleWarnings = lintPrompt(finding.promptText, config, pluginRules);

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
    warnings.push(...scanRagDocuments(scanPath, ragPromptInjection, scanOptions));
  }

  warnings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  const issueCount = warnings.length;

  let baseline = null;
  if (baselineFile) {
    const baselinePath = path.resolve(projectRoot, baselineFile);
    const loaded = loadBaselineFile(baselinePath);
    baseline = diffAgainstBaseline(warnings, loaded.warnings);
    baseline.file = baselinePath;
  }

  let trend = null;
  if (trendFile) {
    const trendPath = path.resolve(projectRoot, trendFile);
    trend = appendTrendAndSave(trendPath, {
      timestamp: new Date().toISOString(),
      issueCount,
      scannedPrompts: promptFindings.length,
      scanRag: Boolean(scanRag),
      format
    });
  }

  if (format === 'text') {
    printWarnings(warnings);
    console.log(`Scanned prompts: ${promptFindings.length}`);
    console.log(`Warnings: ${issueCount}`);

    if (baseline) {
      console.log(
        `Baseline (${path.relative(projectRoot, baseline.file) || baseline.file}): ${baseline.newCount} new, ${baseline.fixedCount} fixed, ${baseline.unchangedCount} unchanged`
      );
    }

    if (trend) {
      if (trend.delta === null) {
        console.log(`Trend (${path.relative(projectRoot, trend.filePath) || trend.filePath}): first run (${trend.currentIssueCount} issues)`);
      } else {
        const deltaLabel = trend.delta > 0 ? `+${trend.delta}` : `${trend.delta}`;
        console.log(
          `Trend (${path.relative(projectRoot, trend.filePath) || trend.filePath}): ${trend.previousIssueCount} -> ${trend.currentIssueCount} (${deltaLabel})`
        );
      }
    }
  } else if (format === 'json') {
    const report = buildJsonReport(warnings, {
      version,
      scannedPrompts: promptFindings.length,
      scanRag,
      baseline,
      trend
    });
    console.log(JSON.stringify(report, null, 2));
  } else if (format === 'sarif') {
    const report = buildSarifReport(warnings, {
      version,
      scannedPrompts: promptFindings.length,
      scanRag,
      baseline,
      trend
    });
    console.log(JSON.stringify(report, null, 2));
  }

  if (githubAnnotations) {
    for (const warning of warnings) {
      console.error(buildGitHubAnnotationLine(warning));
    }
  }

  if (ci || strict) {
    if (format === 'text') {
      console.log(`${issueCount} prompt issues detected.`);
    }
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
