# prompt-lint

ESLint-style linter for LLM prompts. Detect vague instructions, token waste, and unreliable prompt patterns.

`prompt-lint` is a lightweight, dependency-light CLI linter for LLM prompts.
It scans your codebase, extracts prompt strings used in common AI SDK calls, and reports risky prompt patterns before runtime.

## Features

- Fast static analysis (no LLM API calls)
- Rule-based warnings, easy to extend
- Works on `.js`, `.ts`, `.jsx`, `.tsx`
- Targets common prompt fields: `prompt`, `content`, `messages[].content`

## Installation

```bash
npm install prompt-lint
```

For local development in this repo:

```bash
npm link
```

## Usage

Run in any project directory:

```bash
npx prompt-lint
```

Run against a specific directory or file:

```bash
npx prompt-lint ./src
npx prompt-lint ./example/prompts.js
```

`prompt-lint` reads configuration from `.promptlintrc` in the current project root (`process.cwd()`).

Example output:

```text
⚠ src/prompts/supportPrompt.ts
Line 14
Rule: vaguePrompt
Message: Prompt may be ambiguous.
```

Exit codes:

- `0`: no warnings
- `1`: warnings found
- `2`: runtime/configuration error

## Prompt sources detected

- `openai.chat.completions.create`
- `client.chat.completions.create`
- `anthropic.messages.create`
- `model.generateContent`
- `ai.generateText`

Extracted fields:

- `prompt`
- `content`
- `messages[].content`

## Built-in rules

- `vaguePrompt`
- `missingOutputFormat`
- `conflictingInstructions`
- `tokenExplosion`
- `promptInjection` (optional, config-gated)

## Configuration

Create a `.promptlintrc` file in your project root:

```json
{
  "maxPromptLength": 800,
  "requireOutputFormat": true,
  "enablePromptInjectionRule": true
}
```

Supported options:

- `maxPromptLength` (number): maximum prompt length before `tokenExplosion` warns. Default: `1000`.
- `requireOutputFormat` (boolean): when `false`, disables `missingOutputFormat`. Default: `true`.
- `enablePromptInjectionRule` (boolean): when `true`, enables `promptInjection`. Default: `false`.

## Design goals

- Fast
- Minimal dependencies
- Clean, readable code
- Production-ready static checks
