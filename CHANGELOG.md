# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project follows Semantic Versioning.

## [Unreleased]

### Added

- Core prompt scanning for `.js`, `.ts`, `.jsx`, `.tsx`
- Rule engine with built-in rules:
  - `vaguePrompt`
  - `missingOutputFormat`
  - `conflictingInstructions`
  - `tokenExplosion`
  - `tokenUsage`
  - `promptInjection`
- `.promptlintrc` JSON configuration support
- `--ci` mode for CI failure-on-warning behavior
- Rule and scanner test coverage using `node:test`
- Community docs (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`)
