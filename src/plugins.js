'use strict';

const path = require('path');

function ensureValidRule(rule, sourceLabel) {
  if (!rule || typeof rule !== 'object') {
    throw new Error(`Invalid rule from plugin ${sourceLabel}: expected object rule definition`);
  }
  if (typeof rule.name !== 'string' || rule.name.trim() === '') {
    throw new Error(`Invalid rule from plugin ${sourceLabel}: missing rule.name`);
  }
  if (typeof rule.check !== 'function') {
    throw new Error(`Invalid rule from plugin ${sourceLabel}: rule.check must be a function`);
  }
  return rule;
}

function unwrapModule(mod) {
  if (mod && typeof mod === 'object' && mod.default) {
    return mod.default;
  }
  return mod;
}

function extractRules(pluginExport, sourceLabel, _depth = 0) {
  if (_depth > 5) {
    throw new Error(
      `Plugin ${sourceLabel} exceeded maximum nesting depth. Ensure the plugin exports rules directly or via a single factory function.`
    );
  }

  const plugin = unwrapModule(pluginExport);

  if (typeof plugin === 'function') {
    return extractRules(plugin(), sourceLabel, _depth + 1);
  }

  if (Array.isArray(plugin)) {
    return plugin.map((rule) => ensureValidRule(rule, sourceLabel));
  }

  if (plugin && typeof plugin === 'object') {
    if (Array.isArray(plugin.rules)) {
      return plugin.rules.map((rule) => ensureValidRule(rule, sourceLabel));
    }

    if (plugin.rules && typeof plugin.rules === 'object') {
      return Object.values(plugin.rules).map((rule) => ensureValidRule(rule, sourceLabel));
    }
  }

  throw new Error(
    `Invalid plugin ${sourceLabel}: expected array of rules or object with a rules field`
  );
}

function buildPluginCandidates(name) {
  if (name.startsWith('prompt-lint-plugin-')) {
    return [name];
  }

  return [`prompt-lint-plugin-${name}`, name];
}

function resolvePluginPath(pluginName, projectRoot) {
  const candidates = buildPluginCandidates(pluginName);

  for (const candidate of candidates) {
    try {
      return {
        requested: pluginName,
        resolvedName: candidate,
        resolvedPath: require.resolve(candidate, { paths: [projectRoot, path.join(projectRoot, 'node_modules')] })
      };
    } catch {
      continue;
    }
  }

  throw new Error(
    `Unable to resolve plugin '${pluginName}'. Install it as 'prompt-lint-plugin-${pluginName}' or provide a resolvable package name.`
  );
}

function loadPluginRules(pluginNames = [], projectRoot = process.cwd()) {
  const allRules = [];

  for (const pluginName of pluginNames) {
    const { resolvedName, resolvedPath } = resolvePluginPath(pluginName, projectRoot);
    const loaded = require(resolvedPath);
    const rules = extractRules(loaded, resolvedName);
    allRules.push(...rules);
  }

  return allRules;
}

module.exports = {
  loadPluginRules,
  extractRules,
  resolvePluginPath,
  buildPluginCandidates
};
