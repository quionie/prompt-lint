'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  maxPromptLength: 1000,
  requireOutputFormat: true,
  enablePromptInjectionRule: false
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

function normalizeConfig(rawConfig) {
  const source = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};

  return {
    maxPromptLength: toPositiveInteger(source.maxPromptLength, DEFAULT_CONFIG.maxPromptLength),
    requireOutputFormat: toBoolean(source.requireOutputFormat, DEFAULT_CONFIG.requireOutputFormat),
    enablePromptInjectionRule: toBoolean(
      source.enablePromptInjectionRule,
      DEFAULT_CONFIG.enablePromptInjectionRule
    )
  };
}

function loadConfig(projectRoot = process.cwd()) {
  const configPath = path.join(projectRoot, '.promptlintrc');

  if (!fs.existsSync(configPath)) {
    return {
      config: { ...DEFAULT_CONFIG },
      path: null
    };
  }

  let parsed;
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid .promptlintrc JSON: ${error.message}`);
  }

  return {
    config: normalizeConfig(parsed),
    path: configPath
  };
}

module.exports = {
  DEFAULT_CONFIG,
  normalizeConfig,
  loadConfig
};
