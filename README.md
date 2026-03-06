# prompt-lint

`prompt-lint` is an open-source Node.js CLI that statically lints LLM prompts in your codebase.
It is designed to be like ESLint for prompts: fast, dependency-light, rule-based, and CI-friendly.

## Installation

Install from npm:

```bash
npm install prompt-lint
```

Run without global install:

```bash
npx prompt-lint
```

For local development in this repository:

```bash
npm install
npm test
```

## Usage

Lint the current directory:

```bash
npx prompt-lint
```

Lint a specific directory or file:

```bash
npx prompt-lint ./src
npx prompt-lint ./example/prompts.js
```

Run in CI mode (exit code `1` when issues are found):

```bash
npx prompt-lint --ci
npx prompt-lint --ci ./src
```

Scan RAG documents for embedded injection attempts:

```bash
npx prompt-lint --scan-rag
npx prompt-lint --scan-rag ./docs
```

`prompt-lint` reads configuration from `.promptlintrc` in the current project root (`process.cwd()`).

## Example CLI output

```text
⚠ src/prompts/supportPrompt.ts
Line 14
Rule: vaguePrompt
Message: Prompt may be ambiguous.
Suggestion: Use a clear action verb and provide more context.

Scanned prompts: 12
Warnings: 3
3 prompt issues detected.
```

Exit codes:

- `0`: success (`--ci` with no issues, or standard lint mode)
- `1`: `--ci` mode found one or more prompt issues
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

## Rules

- `vaguePrompt`: warns when a prompt is too short (<8 words) or lacks a clear instruction verb.
- `missingOutputFormat`: warns when output shape is not specified (for example JSON, bullets, table).
- `conflictingInstructions`: warns on contradictory constraints (for example short but comprehensive).
- `tokenExplosion`: warns when prompt length exceeds `maxPromptLength` from config (default `1000`).
- `tokenUsage`: warns when prompt length is above ~1500 chars (approximate token-risk heuristic).
- `promptInjection`: optional rule to flag jailbreak/injection-like instructions.
- `ragPromptInjection`: detects likely injection/jailbreak directives in RAG knowledge documents when `--scan-rag` is enabled.

`tokenUsage` currently uses a character-length heuristic. Future versions can integrate `ai-token-counter` for more accurate token estimates.

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

- `maxPromptLength` (number): threshold for `tokenExplosion`. Default: `1000`.
- `requireOutputFormat` (boolean): when `false`, disables `missingOutputFormat`. Default: `true`.
- `enablePromptInjectionRule` (boolean): when `true`, enables `promptInjection`. Default: `false`.

## RAG Injection Detection

Use `--scan-rag` to scan knowledge documents in addition to prompt strings.

Supported document file types:

- `.md`
- `.txt`
- `.json`
- `.csv`

The scanner checks document content line-by-line with the `ragPromptInjection` rule and reports suspicious instructions like:

- `ignore previous instructions`
- `reveal the system prompt`
- `system override`

Example:

```bash
prompt-lint --scan-rag
```

## Project docs

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## Design goals

- Fast
- Minimal dependencies
- Clean, readable code
- Production-ready static checks
