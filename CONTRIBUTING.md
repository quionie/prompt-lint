# Contributing to prompt-lint

Thanks for contributing to `prompt-lint`.

## Development setup

1. Install Node.js 18+.
2. Clone the repository.
3. Install dependencies (none required for runtime, but npm is used for scripts):

```bash
npm install
```

## Local workflow

Run tests:

```bash
npm test
```

Run the linter on the example prompts:

```bash
npm run lint:example
```

Run the CLI directly:

```bash
node ./src/cli.js
```

## Coding guidelines

- Keep changes dependency-light.
- Favor small, composable rule modules in `src/rules/`.
- Add or update tests in `test/` for behavioral changes.
- Keep CLI behavior deterministic and CI-friendly.

## Submitting changes

1. Create a branch from `main`.
2. Make focused commits with clear messages.
3. Ensure `npm test` passes.
4. Open a pull request with:
   - What changed
   - Why it changed
   - Any compatibility or migration notes

## Reporting issues

Please include:

- Node.js version
- OS/platform
- Reproduction steps
- Expected behavior
- Actual behavior
