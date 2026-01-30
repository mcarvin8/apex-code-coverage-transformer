# Contributing

Contributions are welcome. You can help by reporting bugs, suggesting features, improving docs, or submitting code changes.

**Code changes:** You must **fork** this repository first, make your changes in your fork, and open pull requests from your fork back to the main repo. Do not push branches directly to the main repository.

## Requirements

- **Node.js** ≥ 20.0.0
- **yarn** (package manager)

## Development setup

1. **Fork** the repository on GitHub (use the "Fork" button on the repo page).
2. **Clone your fork** (not the main repo) to your machine.
3. **Install dependencies:**
   ```bash
   yarn
   ```
4. **Build the plugin:**
   ```bash
   yarn build
   ```
   Re-run `yarn build` after source changes when testing locally.

## Code quality

- **Lint:** `yarn lint` (ESLint). Fix any reported issues before submitting.
- **Format:** `yarn format` (Prettier). Formatting is enforced in pre-commit.
- **Commit messages:** Use [Conventional Commits](https://www.conventionalcommits.org/). The repo uses `@commitlint/config-conventional` (e.g. `feat:`, `fix:`, `docs:`, `test:`, `chore:`). Husky runs commitlint on commit.

## Testing

- **Unit tests (with coverage):**

  ```bash
  yarn test:only
  ```

  New code must satisfy the existing Jest coverage requirements.

- **Non-unit tests (NUT):** After rebuilding:

  ```bash
  yarn test:nuts
  ```

- **Full test pipeline:** `yarn test` runs compile, unit tests, and lint.

## Pull request process

1. Work in your **fork**. Create a branch from `main` (e.g. `fix/issue-description` or `feat/new-format`).
2. Make your changes. Ensure `yarn build`, `yarn lint`, and `yarn test:only` pass.
3. If you add or change behavior, add or update tests.
4. Push your branch to your fork and **open a pull request from your fork to the main repository** (`main` branch). Describe what changed and why; reference any issues.
5. Address review feedback. Once approved, maintainers will merge.

## Adding a new coverage format

To add a new output format to the transformer:

1. **Register the format**

   - Add the format flag to `formatOptions` in `src/utils/constants.ts`.

2. **Types**

   - In `src/utils/types.ts`, add a `{format}CoverageObject` type.
   - Add it to the `CoverageHandler` type under `finalize`:
     ```typescript
     export type CoverageHandler = {
       processFile(filePath: string, fileName: string, lines: Record<string, number>): void;
       finalize(): SonarCoverageObject | CoberturaCoverageObject | ... | YourFormatCoverageObject;
     };
     ```

3. **Handler**

   - Create a new handler in `src/handlers/` with `processFile` and `finalize`.
   - In `finalize`, sort items in the coverage object before returning.
   - Register the handler in `src/handlers/getHandler.ts`.

4. **Report generation**

   - In `src/transformers/reportGenerator.ts`:
     - Add the new `{format}CoverageObject` type and any logic needed to produce the final report.
     - Update `getExtensionForFormat` with the correct file extension for the format.

5. **Baselines and tests**
   - Run the unit test suite once; it will generate a report for the new format.
   - Add the generated baseline to the `baselines/` folder as `{format}_baseline.{ext}`.
   - In `test/utils/testConstants.ts`, add a constant for the baseline path.
   - In `test/utils/baselineCompare.ts`, add the new constant to `baselineMap`.
   - If the format includes timestamps (e.g. Cobertura, Clover), update `test/commands/acc-transformer/normalizeCoverageReport.ts` to strip them for stable comparison.
   - Re-run unit tests and confirm all pass, including the baseline compare test.

## Questions or issues?

Open an [issue](https://github.com/mcarvin8/apex-code-coverage-transformer/issues) for bugs, feature ideas, or questions.
