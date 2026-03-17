'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  maxPromptLength: 1000,
  requireOutputFormat: true,
  enablePromptInjectionRule: false,
  include: [],
  exclude: [],
  plugins: []
};

function toBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function toPositiveInteger(value, fallback) {
  if (!Number.isInteger(value) || value <= 0) {
    return fallback;
  }
  return value;
}

function toStringArray(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strings = value.filter((entry) => typeof entry === 'string').map((entry) => entry.trim());
  return strings.filter(Boolean);
}

function normalizeConfig(rawConfig) {
  const source = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};

  return {
    maxPromptLength: toPositiveInteger(source.maxPromptLength, DEFAULT_CONFIG.maxPromptLength),
    requireOutputFormat: toBoolean(source.requireOutputFormat, DEFAULT_CONFIG.requireOutputFormat),
    enablePromptInjectionRule: toBoolean(
      source.enablePromptInjectionRule,
      DEFAULT_CONFIG.enablePromptInjectionRule
    ),
    include: toStringArray(source.include, DEFAULT_CONFIG.include),
    exclude: toStringArray(source.exclude, DEFAULT_CONFIG.exclude),
    plugins: toStringArray(source.plugins, DEFAULT_CONFIG.plugins)
  };
}

function loadConfig(projectRoot = process.cwd()) {
  const configPath = path.join(projectRoot, '.promptlintrc');

  let raw;
  try {
    raw = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        config: { ...DEFAULT_CONFIG },
        path: null
      };
    }
    throw new Error(`Failed to read .promptlintrc: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid .promptlintrc JSON: ${error.message}`);
  }

  return {
    config: normalizeConfig(parsed),
    path: configPath
  };
}

function loadIgnoreFile(projectRoot = process.cwd()) {
  const ignorePath = path.join(projectRoot, '.promptlintignore');

  let content;
  try {
    content = fs.readFileSync(ignorePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        patterns: [],
        path: null
      };
    }
    throw new Error(`Failed to read .promptlintignore: ${err.message}`);
  }

  const patterns = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  return {
    patterns,
    path: ignorePath
  };
}

module.exports = {
  DEFAULT_CONFIG,
  normalizeConfig,
  loadConfig,
  loadIgnoreFile
};
