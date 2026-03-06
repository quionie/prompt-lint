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
    return 0;
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

  return warnings.length;
}

function buildJsonReport(warnings, metadata = {}) {
  const summary = {
    scannedPrompts: metadata.scannedPrompts || 0,
    issueCount: warnings.length,
    scanRag: Boolean(metadata.scanRag)
  };

  if (metadata.baseline) {
    summary.baseline = {
      baselineCount: metadata.baseline.baselineCount,
      currentCount: metadata.baseline.currentCount,
      newCount: metadata.baseline.newCount,
      fixedCount: metadata.baseline.fixedCount,
      unchangedCount: metadata.baseline.unchangedCount
    };
  }

  if (metadata.trend) {
    summary.trend = {
      previousIssueCount: metadata.trend.previousIssueCount,
      currentIssueCount: metadata.trend.currentIssueCount,
      delta: metadata.trend.delta,
      totalRuns: metadata.trend.totalRuns
    };
  }

  return {
    tool: 'prompt-lint',
    version: metadata.version || 'unknown',
    summary,
    warnings
  };
}

function buildSarifReport(warnings, metadata = {}) {
  const ruleIds = Array.from(new Set(warnings.map((warning) => warning.rule))).sort();

  const sarifRules = ruleIds.map((ruleId) => ({
    id: ruleId,
    shortDescription: {
      text: ruleId
    },
    name: ruleId
  }));

  const results = warnings.map((warning) => ({
    ruleId: warning.rule,
    level: 'warning',
    message: {
      text: warning.message
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: warning.file
          },
          region: {
            startLine: warning.line
          }
        }
      }
    ]
  }));

  const properties = {
    scannedPrompts: metadata.scannedPrompts || 0,
    scanRag: Boolean(metadata.scanRag)
  };

  if (metadata.baseline) {
    properties.baseline = {
      baselineCount: metadata.baseline.baselineCount,
      currentCount: metadata.baseline.currentCount,
      newCount: metadata.baseline.newCount,
      fixedCount: metadata.baseline.fixedCount,
      unchangedCount: metadata.baseline.unchangedCount
    };
  }

  if (metadata.trend) {
    properties.trend = {
      previousIssueCount: metadata.trend.previousIssueCount,
      currentIssueCount: metadata.trend.currentIssueCount,
      delta: metadata.trend.delta,
      totalRuns: metadata.trend.totalRuns
    };
  }

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'prompt-lint',
            version: metadata.version || 'unknown',
            rules: sarifRules
          }
        },
        results,
        properties
      }
    ]
  };
}

module.exports = {
  printWarnings,
  buildJsonReport,
  buildSarifReport
};
