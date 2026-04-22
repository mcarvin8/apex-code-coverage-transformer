# Contributing

Contributions are welcome. You can help by reporting bugs, suggesting features, improving docs, or submitting code changes.

**Code changes:** You must **fork** this repository first, make your changes in your fork, and open pull requests from your fork back to the main repo. Do not push branches directly to the main repository.

## Requirements

- **Node.js** ≥ 20.0.0
- **npm** (package manager)

## Development setup

1. **Fork** the repository on GitHub (use the "Fork" button on the repo page).
2. **Clone your fork** (not the main repo) to your machine.
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Build the plugin:**
   ```bash
   npm run build
   ```
   Re-run `npm run build` after source changes when testing locally.

## Code quality

- **Lint:** `npm run lint` (ESLint). Fix any reported issues before submitting.
- **Format:** `npm run format` (Prettier). Formatting is enforced in pre-commit.
- **Commit messages:** Use [Conventional Commits](https://www.conventionalcommits.org/). The repo uses `@commitlint/config-conventional` (e.g. `feat:`, `fix:`, `docs:`, `test:`, `chore:`). Husky runs commitlint on commit.

## Testing

The test suite uses [Vitest](https://vitest.dev/). Test files live in `test/` and run in true ESM mode.

- **Unit tests (with coverage):**

  ```bash
  npm run test:only
  ```

  New code must satisfy the existing Vitest coverage thresholds (see `vitest.config.ts`).

- **Non-unit tests (NUT):** After rebuilding:

  ```bash
  npm run test:nuts
  ```

  NUTs use a separate config (`vitest.nut.config.ts`) that runs serially and matches `**/*.nut.ts`.

- **Full test pipeline:** `npm test` runs compile, unit tests, and lint.

Use Vitest-native APIs: import helpers from `vitest` (e.g. `import { describe, it, expect, vi } from 'vitest'`). Do not reintroduce `@jest/globals` or `jest.*` calls — use `vi.fn`, `vi.mock`, `await vi.importActual`, and the `Mock` type from `vitest`.

## Pull request process

1. Work in your **fork**. Create a branch from `main` (e.g. `fix/issue-description` or `feat/new-format`).
2. Make your changes. Ensure `npm run build`, `npm run lint`, and `npm run test:only` pass.
3. If you add or change behavior, add or update tests.
4. Push your branch to your fork and **open a pull request from your fork to the main repository** (`main` branch). Describe what changed and why; reference any issues.
5. Address review feedback. Once approved, maintainers will merge.

## Adding a new coverage format

To add a new output format to the transformer:

1. **Register the format flag**

   - Add the format identifier to `formatOptions` in `src/utils/constants.ts`.

2. **Types**

   - In `src/utils/types.ts`, add a `{Format}CoverageObject` type.
   - Add it to the `AnyCoverageObject` union at the bottom of that file. `CoverageHandler.finalize()` returns `AnyCoverageObject`, so no further type edits are required.

3. **Handler**

   - Create a new handler class in `src/handlers/` extending `BaseHandler`, with `processFile` and `finalize` methods.
   - In `finalize`, sort items in the coverage object before returning it.
   - At the bottom of the handler file, self-register it with the registry:
     ```typescript
     HandlerRegistry.register({
       name: 'myformat',
       description: 'My format description',
       fileExtension: '.xml', // or '.json', '.info', '.html', etc.
       handler: () => new MyFormatHandler(),
       compatibleWith: ['ToolA', 'ToolB'], // optional
     });
     ```
   - Add a side-effect import for your handler in `src/handlers/getHandler.ts` (e.g. `import './myformat.js';`) so the registration runs when handlers are loaded. `getExtensionForFormat` is driven by the registry, so registering the extension here is all that's needed.

4. **Report generation**

   - Most formats flow through the XML pipeline in `src/transformers/reportGenerator.ts` automatically; no edits are needed there for standard XML output.
   - For **plain-text / JSON / custom text formats**, add a branch to the `generateReportContent` dispatcher in `reportGenerator.ts` and a small helper function (see `generateLcov` for a minimal example).
   - For **large, self-contained renderers** (e.g. HTML), put the renderer in `src/transformers/generators/` as its own module (see `generators/generateHtml.ts`) and add a type guard + dispatch branch in `reportGenerator.ts`. Keep `reportGenerator.ts` focused on routing.

5. **Baselines and tests**
   - Run the unit test suite once; it will generate a report for the new format.
   - Add the generated baseline to `test/fixtures/baselines/` as `{format}_baseline.{ext}`.
   - In `test/utils/testConstants.ts`, add a constant for the baseline path.
   - In `test/utils/baselineCompare.ts`, add the new constant to `baselineMap`.
   - If the format includes timestamps (e.g. Cobertura, Clover), update `test/utils/normalizeCoverageReport.ts` to strip them for stable comparison.
   - Re-run `npm run test:only` and confirm all pass, including the baseline compare test.

## Questions or issues?

Open an [issue](https://github.com/mcarvin8/apex-code-coverage-transformer/issues) for bugs, feature ideas, or questions.
