# Contributing

Contributions welcome: bug reports, feature requests, doc improvements, and code changes.

**Code changes require a fork.** Do not push branches directly to the main repository.

## Requirements

- Node.js ≥ 20.0.0
- npm

## Development setup

```bash
# 1. Fork on GitHub, then clone your fork
git clone https://github.com/<your-username>/apex-code-coverage-transformer.git

# 2. Install dependencies
npm install

# 3. Build (re-run after source changes)
npm run build
```

## Code quality

- **Lint + Format:** `npm run lint` / `npm run format` — [Biome](https://biomejs.dev/); enforced in pre-commit via Husky
- **Commit messages:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`); enforced by commitlint on commit

## Git hooks (Husky)

| Hook         | Runs            | What it does                                                                        |
|--------------|-----------------|-------------------------------------------------------------------------------------|
| `pre-commit` | on `git commit` | Runs `lint-staged` — applies Biome check + auto-fix to staged `.ts`/`.js` files     |
| `commit-msg` | on `git commit` | Validates the commit message against Conventional Commits via commitlint            |
| `pre-push`   | on `git push`   | Runs `npm run build` — ensures the project compiles before code leaves your machine |

## Testing

Uses [Vitest](https://vitest.dev/). Test files live in `test/` and run in ESM mode.

- **Unit tests (with coverage):**

  ```bash
  npm run test:only
  ```

  New code must satisfy the existing coverage thresholds in `vitest.config.ts`.

- **NUTs:**

  ```bash
  npm run test:nuts
  ```

  Runs serially against `**/*.nut.ts` using `vitest.nut.config.ts`.

- **Full pipeline:** `npm test` — compile + unit tests + lint.

## Pull request process

1. Branch from `main` in your fork (e.g. `fix/issue-description`, `feat/new-format`).
2. Make changes. Confirm `npm run lint`, `npm run test:only`, and `npm run test:nuts` pass.
3. Add or update tests for any behavior change.
4. Open a PR from your fork to `main`. Describe what changed and why; reference any issues.
5. Address review feedback. Maintainers merge on approval.

## Adding a new coverage format

1. **Register the format** — add the identifier to `formatOptions` in `src/utils/constants.ts`.

2. **Types** — in `src/utils/types.ts`, add a `{Format}CoverageObject` type and add it to the `AnyCoverageObject` union. `CoverageHandler.finalize()` returns `AnyCoverageObject`, so no further type edits are required.

3. **Handler** — create a class in `src/handlers/` extending `BaseHandler`, with `processFile` and `finalize` methods. Sort items in `finalize` before returning. Self-register at the bottom of the handler file:

   ```typescript
   HandlerRegistry.register({
     name: 'myformat',
     description: 'My format description',
     fileExtension: '.xml', // or '.json', '.info', '.html', etc.
     handler: () => new MyFormatHandler(),
     compatibleWith: ['ToolA', 'ToolB'], // optional
   });
   ```

   Add a side-effect import in `src/handlers/getHandler.ts` (e.g. `import './myformat.js';`) so registration runs when handlers are loaded.

4. **Report generation** — standard XML formats flow through `src/transformers/reportGenerator.ts` with no changes needed. For plain-text/JSON/custom formats, add a branch to `generateReportContent` (see `generateLcov` for a minimal example). For large self-contained renderers, add a module to `src/transformers/generators/` and dispatch from `reportGenerator.ts` (see `generators/generateHtml.ts`).

5. **Baselines and tests**
   - Run `npm run test:only` — it generates a report for the new format.
   - Add the generated file to `test/fixtures/baselines/` as `{format}_baseline.{ext}`.
   - In `test/utils/testConstants.ts`, add a constant for the baseline path.
   - In `test/utils/baselineCompare.ts`, add the constant to `baselineMap`.
   - If the format includes timestamps (e.g. Cobertura, Clover), update `test/utils/normalizeCoverageReport.ts` to strip them for stable comparison.
   - Re-run `npm run test:only` and confirm all tests pass.
