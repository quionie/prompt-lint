'use strict';

const fs = require('fs');
const path = require('path');

function warningFingerprint(warning) {
  return `${warning.file}:${warning.line}:${warning.rule}:${warning.message}`;
}

function normalizeWarningLike(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const file = typeof value.file === 'string' ? value.file : null;
  const line = Number.isInteger(value.line) ? value.line : null;
  const rule = typeof value.rule === 'string' ? value.rule : null;
  const message = typeof value.message === 'string' ? value.message : null;

  if (!file || !line || !rule || !message) {
    return null;
  }

  return { file, line, rule, message };
}

function extractBaselineWarnings(raw) {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw.map(normalizeWarningLike).filter(Boolean);
  }

  if (Array.isArray(raw.warnings)) {
    return raw.warnings.map(normalizeWarningLike).filter(Boolean);
  }

  if (Array.isArray(raw.issues)) {
    return raw.issues
      .map((item) => {
        if (typeof item === 'string') {
          return null;
        }
        return normalizeWarningLike(item);
      })
      .filter(Boolean);
  }

  return [];
}

function loadJsonFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw new Error(`Failed to read ${filePath}: ${err.message}`);
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
}

function loadBaselineFile(filePath) {
  const raw = loadJsonFile(filePath);
  const warnings = extractBaselineWarnings(raw);
  return {
    filePath,
    warnings
  };
}

function diffAgainstBaseline(currentWarnings, baselineWarnings) {
  const baselineSet = new Set((baselineWarnings || []).map(warningFingerprint));
  const currentFingerprints = currentWarnings.map(warningFingerprint);
  const currentSet = new Set(currentFingerprints);

  let unchanged = 0;
  const newWarnings = [];

  for (let i = 0; i < currentWarnings.length; i++) {
    if (baselineSet.has(currentFingerprints[i])) {
      unchanged += 1;
    } else {
      newWarnings.push(currentWarnings[i]);
    }
  }

  let fixed = 0;
  for (const fingerprint of baselineSet) {
    if (!currentSet.has(fingerprint)) {
      fixed += 1;
    }
  }

  return {
    baselineCount: baselineSet.size,
    currentCount: currentWarnings.length,
    newCount: newWarnings.length,
    fixedCount: fixed,
    unchangedCount: unchanged,
    newWarnings
  };
}

function loadTrendFile(filePath) {
  const raw = loadJsonFile(filePath);
  if (!raw || !Array.isArray(raw.history)) {
    return {
      version: 1,
      history: []
    };
  }

  return {
    version: Number.isInteger(raw.version) ? raw.version : 1,
    history: raw.history.filter((entry) => entry && typeof entry === 'object')
  };
}

function appendTrendAndSave(filePath, entry) {
  const trend = loadTrendFile(filePath);
  const previous = trend.history.length > 0 ? trend.history[trend.history.length - 1] : null;

  trend.history.push(entry);

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(trend, null, 2), 'utf8');

  const previousIssueCount = previous && Number.isInteger(previous.issueCount) ? previous.issueCount : null;
  const delta = previousIssueCount === null ? null : entry.issueCount - previousIssueCount;

  return {
    filePath,
    previousIssueCount,
    currentIssueCount: entry.issueCount,
    delta,
    totalRuns: trend.history.length
  };
}

function escapeGitHubPropertyValue(value) {
  return String(value)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/:/g, '%3A')
    .replace(/,/g, '%2C');
}

function escapeGitHubMessage(value) {
  return String(value)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}

function buildGitHubAnnotationLine(warning) {
  const title = escapeGitHubPropertyValue(warning.rule);
  const message = escapeGitHubMessage(warning.message);
  const file = escapeGitHubPropertyValue(warning.file);
  const line = Number.isInteger(warning.line) ? warning.line : 1;

  return `::warning file=${file},line=${line},title=${title}::${message}`;
}

module.exports = {
  warningFingerprint,
  extractBaselineWarnings,
  loadBaselineFile,
  diffAgainstBaseline,
  loadTrendFile,
  appendTrendAndSave,
  buildGitHubAnnotationLine
};
