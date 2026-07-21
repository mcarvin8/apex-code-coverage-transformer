# apex-code-coverage-transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer)
[![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)
[![Maintainability](https://qlty.sh/badges/11057a07-84da-41af-91fb-b3476e404242/maintainability.svg)](https://qlty.sh/gh/mcarvin8/projects/apex-code-coverage-transformer)
[![codecov](https://codecov.io/gh/mcarvin8/apex-code-coverage-transformer/graph/badge.svg?token=4IQ4NWTPQZ)](https://codecov.io/gh/mcarvin8/apex-code-coverage-transformer)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fmcarvin8%2Fapex-code-coverage-transformer%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/mcarvin8/apex-code-coverage-transformer/main)

A Salesforce CLI plugin that transforms (and optionally merges) Apex code coverage JSON from deployments or test runs into formats used by SonarQube, Codecov, GitHub, GitLab, Azure DevOps, Bitbucket, and other tools, keeping coverage visible across pull requests, CI/CD pipelines, and code quality platforms.

> Deploying to Salesforce at API version 67.0 or earlier? Use apex-code-coverage-transformer v2. Deploying to Salesforce at API version 68.0 or newer? Use apex-code-coverage-transformer v3.

<details>
  <summary>Table of Contents</summary>

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Command Reference](#command-reference)
- [Coverage Report Formats](#coverage-report-formats)
- [CI/CD Integration](#cicd-integration)
- [Automatic Transformation (Hook)](#automatic-transformation-hook)
- [Troubleshooting](#troubleshooting)
- [Questions or Issues?](#questions-or-issues)
- [License](#license)

</details>

## Prerequisites

- [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) (`sf`) installed
- Node.js 22.x or later
- A Salesforce DX project with `sfdx-project.json` and package directories
- Use only the **json** coverage formatter from the Salesforce CLI; other formatters are not supported

## Install

```bash
sf plugins install apex-code-coverage-transformer@latest
```

## Quick Start

1. **Generate Apex code coverage (JSON)**

   From tests:

   ```bash
   sf apex run test --code-coverage --output-dir "coverage"
   ```

   From deploy/validate:

   ```bash
   sf project deploy start --coverage-formatters json --results-dir "coverage"
   # or: sf project deploy validate --coverage-formatters json --results-dir "coverage"
   ```

2. **Transform to your target format**

   Test output → `coverage/test-result-codecoverage.json`. Deploy output → `coverage/coverage/coverage.json`.

   ```bash
   # SonarQube
   sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "sonar"

   # Codecov (Cobertura)
   sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "cobertura"

   # Multiple formats at once
   sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -f "sonar" -f "cobertura" -f "jacoco"

   # Merge multiple coverage JSONs of the same type (e.g. two deploy runs)
   sf acc-transformer transform -j "coverage/coverage/coverage.json" -j "coverage2/coverage/coverage.json" -r "coverage.xml" -f "sonar"
   ```

3. **Upload to your tool** — see [CI/CD Integration](#cicd-integration).

## Usage

This plugin is for Salesforce DX projects (`sfdx-project.json`). The Salesforce CLI coverage JSON uses Apex class names (e.g. `no-map/AccountTriggerHandler`) rather than file paths — this plugin maps those names to actual paths in your package directories and only includes files that exist there. Deploy and test coverage use different JSON structures; this plugin normalizes both. Apex from managed or unlocked packages (not in your repo) is excluded and reported with a [warning](#troubleshooting).

To run transformation automatically after deploy or test commands, use the [Hook](#automatic-transformation-hook).

> **Tip — diff-scoped coverage on PRs.** The Salesforce CLI already scopes `sf project deploy validate`/`start` coverage to whatever is in the deployed manifest. If your PR pipeline builds a manifest from the git diff (for example with [sfdx-git-delta](https://github.com/scolladon/sfdx-git-delta)) and then runs `sf project deploy validate --coverage-formatters json --manifest <delta>`, the resulting coverage JSON only contains the changed Apex. Running this plugin against that JSON gives you per-PR coverage with no extra flags — the diff scoping happens upstream in the deployment, not here.

> **Important:** If the generated `package.xml` only contains Apex test classes, the Salesforce CLI deploy coverage report will be empty. The deploy manifest must include actual Apex classes or triggers under test for the CLI to return coverage data in the JSON output.

### Generating coverage

**Deploy/validate** — coverage path: `coverage/coverage/coverage.json`

```bash
sf project deploy [start|validate|report|resume] --coverage-formatters json --results-dir "coverage"
```

**Run tests** — coverage path: `coverage/test-result-codecoverage.json`

```bash
sf apex run test --code-coverage --output-dir "coverage"
sf apex get test --test-run-id <id> --code-coverage --output-dir "coverage"
```

**SFDX Hardis** — coverage path: `hardis-report/apex-coverage-results.json`

Works with [sfdx-hardis](https://github.com/hardisgroupcom/sfdx-hardis):

- `sf hardis project deploy smart` (requires `COVERAGE_FORMATTER_JSON=true`)
- `sf hardis org test apex`

## Command Reference

### sf acc-transformer transform

```
USAGE
  $ sf acc-transformer transform -j <value>... [-r <value>] [-f <value>] [-i <value>] [-e <value>]
                                               [--min-coverage <value>] [--max-annotations <value>] [--json]

FLAGS
  -j, --coverage-json=<value>...          Path to a code coverage JSON from deploy or test. Repeat to merge
                                          multiple files. When the same Apex file appears in more than one
                                          input, covered lines are unioned across all inputs — if a line is
                                          covered in any input it is counted as covered in the final report,
                                          even if it is uncovered in others. All files must be the same type
                                          (deploy or test).
  -r, --output-report=<value>             Output path (e.g. coverage.xml). Default: coverage.[xml|info] by format.
  -f, --format=<value>                    Output format (repeat for multiple). Default: sonar.
                                          Multiple formats append to filename, e.g. coverage-sonar.xml.
  -i, --ignore-package-directory=<value>  Package directory to ignore (as in sfdx-project.json). Repeatable.
  -e, --exclude-pattern=<value>           Glob pattern for file paths to exclude from the report. Matched against
                                          the relative path from the repo root. Repeatable.
      --min-coverage=<value>              Minimum required line coverage percentage (0–100). Exits with an error
                                          if overall coverage is below this value. Reports are written first.
      --max-annotations=<value>           Maximum ::warning annotations emitted by --format github-actions.
                                          Default: 50. Overflow is summarised in a ::notice line.

GLOBAL FLAGS
  --json  Output as JSON.
```

## Coverage Report Formats

Use `-f` / `--format` to choose the output format. Multiple `-f` values produce multiple files with the format in the name (e.g. `coverage-sonar.xml`, `coverage-cobertura.xml`).

| Format         | Description                | Typical use                             | Example                                                                                 |
|----------------|----------------------------|-----------------------------------------|-----------------------------------------------------------------------------------------|
| sonar          | SonarQube generic coverage | SonarQube, SonarCloud                   | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "sonar"`          |
| cobertura      | Cobertura XML              | Codecov, Azure, Jenkins, GitLab, GitHub | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "cobertura"`      |
| jacoco         | JaCoCo XML                 | Codecov, Jenkins, Maven, Gradle         | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "jacoco"`         |
| lcovonly       | LCOV                       | Codecov, Coveralls, GitHub              | `sf acc-transformer transform -j "coverage.json" -r "coverage.info" -f "lcovonly"`      |
| clover         | Clover XML                 | Bamboo, Bitbucket, Jenkins              | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "clover"`         |
| json           | Istanbul JSON              | Istanbul/NYC, Codecov                   | `sf acc-transformer transform -j "coverage.json" -r "coverage.json" -f "json"`          |
| json-summary   | JSON summary               | Badges, PR comments                     | `sf acc-transformer transform -j "coverage.json" -r "coverage.json" -f "json-summary"`  |
| simplecov      | SimpleCov JSON             | Codecov, Ruby tools                     | `sf acc-transformer transform -j "coverage.json" -r "coverage.json" -f "simplecov"`     |
| opencover      | OpenCover XML              | Azure DevOps, VS, Codecov               | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "opencover"`      |
| html           | HTML report                | Browsers, CI artifacts                  | `sf acc-transformer transform -j "coverage.json" -r "coverage.html" -f "html"`          |
| markdown       | Markdown summary           | PR/MR comments, CI job summaries        | `sf acc-transformer transform -j "coverage.json" -r "coverage.md" -f "markdown"`        |
| github-actions | GitHub Actions annotations | GitHub Actions PR diff annotations      | `sf acc-transformer transform -j "coverage.json" -r "coverage.txt" -f "github-actions"` |

## CI/CD Integration

### Shared setup (GitHub Actions)

All GitHub Actions examples below assume these steps run first for deployments (update `sf project deploy start` command to `sf apex run test` to invoke tests directly in an org):

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Salesforce CLI
        run: npm install -g @salesforce/cli@latest

      - name: Install Apex Code Coverage Transformer plugin
        run: echo y | sf plugins install apex-code-coverage-transformer

      - name: Authenticate to Salesforce
        run: sf org login sfdx-url --sfdx-url-file ${{ secrets.SFDX_AUTH_URL }} --alias ci-org

      - name: Deploy with Apex Tests
        run: sf project deploy start --test-level RunLocalTests --coverage-formatters json --results-dir "coverage"
```

### Codecov

```yaml
- name: Transform Coverage to Cobertura
  run: sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "cobertura"
- name: Upload to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage.xml
    flags: apex
    token: ${{ secrets.CODECOV_TOKEN }}
```

### SonarQube / SonarCloud

```yaml
- name: Transform Coverage to Sonar Format
  run: sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "sonar"
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  with:
    args: >
      -Dsonar.projectKey=your-project-key
      -Dsonar.organization=your-org
      -Dsonar.sources=force-app
      -Dsonar.tests=force-app
      -Dsonar.test.inclusions=**/*Test.cls
      -Dsonar.coverageReportPaths=coverage.xml
```

For a self-hosted scanner:

```bash
sonar-scanner \
  -Dsonar.projectKey=your-project-key \
  -Dsonar.sources=force-app \
  -Dsonar.tests=force-app \
  -Dsonar.test.inclusions=**/*Test.cls \
  -Dsonar.coverageReportPaths=coverage.xml \
  -Dsonar.host.url=https://sonarqube.example.com \
  -Dsonar.login=$SONAR_TOKEN
```

### GitHub Actions

#### Markdown PR comments (built-in)

Skip third-party summary actions by using the built-in `markdown` format:

```yaml
- name: Transform Coverage to Markdown
  run: sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.md" -f "markdown"
- name: Add coverage to job summary
  run: cat coverage.md >> $GITHUB_STEP_SUMMARY
- name: Add Coverage PR Comment
  uses: marocchino/sticky-pull-request-comment@v2
  if: github.event_name == 'pull_request'
  with:
    recreate: true
    path: coverage.md
```

The Markdown report includes an overall summary block, a per-package-directory table, and a file-level table sorted with lowest coverage first so reviewers see the most actionable rows at the top.

#### Inline annotations

The `github-actions` format emits one [`::warning`](https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions) per uncovered Apex line, plus a `::notice` summary. When a step prints the file to stdout, the runner renders annotations inline on the PR diff and on the workflow run page.

```yaml
- name: Transform Coverage to GitHub Actions Annotations
  run: sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.txt" -f "github-actions"
- name: Emit coverage annotations
  run: cat coverage.txt
```

Pairs with [`sf-cat`](https://www.github.com/mcarvin8/sf-cat) for code quality annotations on the same diff if you use Salesforce Code Analyzer.

#### Merging coverage from parallel test suites

If you split Apex tests across parallel jobs (e.g. by test class grouping or suite), upload each run's JSON as an artifact and merge them in a final step. Covered lines are unioned — a line covered in any suite counts as covered in the final report.

```yaml
jobs:
  test-suite-a:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      # ... shared setup steps (Node, SF CLI, auth) ...
      - name: Run Suite A
        run: sf apex run test --code-coverage --output-dir coverage-a --target-org ci-org
      - name: Upload Suite A coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-a
          path: coverage-a/test-result-codecoverage.json

  test-suite-b:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      # ... shared setup steps ...
      - name: Run Suite B
        run: sf apex run test --code-coverage --output-dir coverage-b --target-org ci-org
      - name: Upload Suite B coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-b
          path: coverage-b/test-result-codecoverage.json

  merge-coverage:
    runs-on: ubuntu-latest
    needs: [test-suite-a, test-suite-b]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @salesforce/cli@latest
      - run: echo y | sf plugins install apex-code-coverage-transformer
      - name: Download Suite A coverage
        uses: actions/download-artifact@v4
        with:
          name: coverage-a
          path: coverage-a
      - name: Download Suite B coverage
        uses: actions/download-artifact@v4
        with:
          name: coverage-b
          path: coverage-b
      - name: Merge and transform coverage
        run: |
          sf acc-transformer transform \
            -j "coverage-a/test-result-codecoverage.json" \
            -j "coverage-b/test-result-codecoverage.json" \
            -r "coverage.xml" \
            -f "sonar"
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=your-project-key
            -Dsonar.organization=your-org
            -Dsonar.sources=force-app
            -Dsonar.coverageReportPaths=coverage.xml
```

Swap the final upload step for any tool from the [Codecov](#codecov) or [GitHub Actions](#github-actions) examples above — the merge command stays the same regardless of destination.

### GitLab CI

```yaml
stages:
  - test

apex-tests:
  stage: test
  image: node:20
  before_script:
    - npm install -g @salesforce/cli
    - echo y | sf plugins install apex-code-coverage-transformer
    - echo $SFDX_AUTH_URL | sf org login sfdx-url --sfdx-url-stdin --alias ci-org
  script:
    - sf apex run test --code-coverage --output-dir coverage --target-org ci-org
    - sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "cobertura"
    - |
      COVERAGE_FILE="coverage.xml"
      if [ -s "$COVERAGE_FILE" ]; then
        LINE_RATE="$(grep -oE '<coverage[^>]*\bline-rate="[^"]+"' "$COVERAGE_FILE" | head -1 | sed -E 's/.*line-rate="([^"]+)".*/\1/')"
        if [ -n "$LINE_RATE" ]; then
          PCT="$(awk -v r="$LINE_RATE" 'BEGIN { printf("%.2f%%", r*100) }')"
          echo "TOTAL coverage: $PCT"
        fi
      fi
  coverage: '/TOTAL.+ ([0-9]{1,3}(?:\.[0-9]+)?%)/'
  artifacts:
    when: always
    paths:
      - coverage.xml
    expire_in: 2 weeks
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

### Azure DevOps

```yaml
trigger:
  - main

pool:
  vmImage: ubuntu-latest

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: Set up Node.js

  - script: npm install -g @salesforce/cli@latest
    displayName: Install Salesforce CLI

  - script: echo y | sf plugins install apex-code-coverage-transformer
    displayName: Install Apex Code Coverage Transformer

  - script: echo $(SFDX_AUTH_URL) | sf org login sfdx-url --sfdx-url-stdin --alias ci-org
    displayName: Authenticate to Salesforce

  - script: sf apex run test --code-coverage --output-dir coverage --target-org ci-org
    displayName: Run Apex Tests

  - script: sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "cobertura"
    displayName: Transform Coverage to Cobertura

  - task: PublishCodeCoverageResults@2
    inputs:
      summaryFileLocation: coverage.xml
      pathToSources: $(Build.SourcesDirectory)
    displayName: Publish Coverage to Azure DevOps
```

Set `SFDX_AUTH_URL` as a secret pipeline variable. Coverage appears in the pipeline's **Code Coverage** tab.

## Automatic Transformation (Hook)

Create `.apexcodecovtransformer.config.json` in the project root to transform coverage automatically after:

- `sf project deploy [start|validate|report|resume]`
- `sf apex run test`
- `sf apex get test`
- `sf hardis project deploy smart` (if sfdx-hardis installed and `COVERAGE_FORMATTER_JSON=true`)
- `sf hardis org test apex` (if sfdx-hardis installed)

> **Note:** The hook fires once per command and always processes a single coverage JSON. It cannot merge multiple inputs. If you need to merge coverage from multiple runs (e.g. split test batches), run the `sf acc-transformer transform` command manually with multiple `-j` flags after all runs complete.

Sample configs: [Salesforce CLI](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/salesforce-cli/.apexcodecovtransformer.config.json), [SFDX Hardis](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/sfdx-hardis/.apexcodecovtransformer.config.json).

| Key                        | Required   | Description                                                                                                                                  |
|----------------------------|------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `deployCoverageJsonPath`   | For deploy | Path to deploy coverage JSON.                                                                                                                |
| `testCoverageJsonPath`     | For test   | Path to test coverage JSON.                                                                                                                  |
| `outputReportPath`         | No         | Output path (default: `coverage.[xml/info/json]` by format).                                                                                 |
| `format`                   | No         | Format(s), comma-separated (default: `sonar`).                                                                                               |
| `ignorePackageDirectories` | No         | Comma-separated package directories to ignore.                                                                                               |
| `minCoverage`              | No         | Minimum required line coverage percentage (0–100). Exits with an error if overall coverage is below this threshold.                          |
| `maxAnnotations`           | No         | Maximum `::warning` annotations emitted when `format` includes `github-actions` (default: `50`).                                             |
| `excludePatterns`          | No         | Comma-separated glob patterns for file paths to exclude (e.g. `**/*Test*,**/mock/**`). Matched against the relative path from the repo root. |

## Troubleshooting

**File not in package directory** — File is omitted from the report:

```
Warning: The file name AccountTrigger was not found in any package directory.
```

**Duplicate Apex file across package directories** — Two packages contain a file with the same name (e.g. `AccountHelper.cls` in both `force-app` and `package2`). The first one found is used; the second is ignored:

```
Warning: Duplicate Apex file "AccountHelper.cls" found in multiple package directories. Using "force-app/main/default/classes/AccountHelper.cls"; ignoring "package2/main/default/classes/AccountHelper.cls".
```

Resolve by renaming one of the files or using `--ignore-package-directory` to exclude the package whose version should not be included.

**No files matched** — Report will be empty:

```
Warning: None of the files listed in the coverage JSON were processed. The coverage report will be empty.
```

**Mixed coverage types** — All `-j` inputs must be the same type (either all deploy or all test):

```
Error (1): All coverage JSON files must be the same type (deploy or test).
```

**Unknown JSON structure** — Input is not from deploy or test coverage:

```
Error (1): The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.
```

**Missing project config** — Run from a directory that has (or has a parent with) `sfdx-project.json`:

```
Error (1): sfdx-project.json not found in any parent directory.
```

**Missing package directory** — A path in `sfdx-project.json` does not exist:

```
Error (1): ENOENT: no such file or directory: {packageDir}
```

## Questions or Issues?

Questions, issues? Missing an output format via `--format`? Open an [issue](https://github.com/mcarvin8/apex-code-coverage-transformer/issues).

## License

[MIT](LICENSE.md)
