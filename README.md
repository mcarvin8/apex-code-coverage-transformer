# apex-code-coverage-transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer)
[![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer)
[![GitHub Marketplace](https://img.shields.io/badge/marketplace-apex--code--coverage--transformer-blue?logo=github)](https://github.com/marketplace/actions/apex-code-coverage-transformer)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)
[![codecov](https://codecov.io/gh/mcarvin8/apex-code-coverage-transformer/graph/badge.svg?token=4IQ4NWTPQZ)](https://codecov.io/gh/mcarvin8/apex-code-coverage-transformer)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fmcarvin8%2Fapex-code-coverage-transformer%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/mcarvin8/apex-code-coverage-transformer/main)

Transforms (and optionally merges) Apex code coverage JSON from Salesforce deployments or test runs into formats used by SonarQube, Codecov, GitHub, GitLab, Azure DevOps, Bitbucket, and other tools, keeping coverage visible across pull requests, CI/CD pipelines, and code quality platforms. Available as a **Salesforce CLI plugin** for any provider, and as a **native GitHub Action** for GitHub Actions users who want to skip installing the CLI.

> [!WARNING]
> **v4 breaking change:** v3 and earlier automatically re-numbered deploy command coverage lines that Salesforce reported beyond the end of a file. Salesforce fixed this bug server-side in Winter '27 (API v68.0), regardless of the `--api-version` used on the deploy, so v4 removes the re-numbering and passes deploy coverage lines through exactly as reported. Test-command coverage is unaffected. See [Troubleshooting](#troubleshooting) for details.

> [!WARNING]
> **v5 breaking change:** Only affects users using this plugin's automated hooks with sfdx-hardis. The `finally` hook no longer runs after `sf hardis project deploy smart` or `sf hardis org test apex`, or after the `sf` commands sfdx-hardis runs under the hood, so coverage is no longer transformed twice. sfdx-hardis coverage now goes through [sfdx-hardis events](#sfdx-hardis-events), which require sfdx-hardis 8.24.1 or later with plugin events enabled. With an older sfdx-hardis, upgrade it or run `sf acc-transformer transform` after the sfdx-hardis command. The `deployCoverageJsonPath` and `testCoverageJsonPath` config keys are no longer needed for sfdx-hardis.

<details>
  <summary>Table of Contents</summary>

- [Prerequisites](#prerequisites)
- [Install](#install)
- [GitHub Action](#github-action)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Command Reference](#command-reference)
- [Coverage Report Formats](#coverage-report-formats)
- [CI/CD Integration](#cicd-integration)
- [Automatic Transformation (Hook)](#automatic-transformation-hook)
- [Programmatic Usage](#programmatic-usage)
- [Troubleshooting](#troubleshooting)
- [Questions or Issues?](#questions-or-issues)
- [License](#license)

</details>

## Prerequisites

- [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) (`sf`) installed
- Node.js 22.22.2 or later (`apex-code-coverage-transformer-core` alone needs 22.19 or later)
- A Salesforce DX project with `sfdx-project.json` and package directories
- Use only the **json** coverage formatter from the Salesforce CLI; other formatters are not supported

## Install

```bash
sf plugins install apex-code-coverage-transformer@latest
```

## GitHub Action

For GitHub Actions, this is also available as a [native Action](https://github.com/marketplace/actions/apex-code-coverage-transformer) - no `sf` CLI or plugin install required:

```yaml
- name: Transform Coverage
  uses: mcarvin8/apex-code-coverage-transformer@v4
  with:
    coverage-json: coverage/test-result-codecoverage.json
    output-report: coverage.xml
    format: sonar
```

It still needs the checkout to contain `sfdx-project.json` (same as the CLI's [Prerequisites](#prerequisites) above) - use `actions/checkout` first. See [GitHub Actions](#github-actions) under CI/CD Integration for the full input/output reference and more examples.

## Quick Start

1. **Generate Apex code coverage (JSON)**

   From tests:

   ```bash
   sf apex run test --code-coverage --output-dir "coverage"
   # Creates code coverage file here: coverage/test-result-codecoverage.json
   ```

   From deploy/validate:

   ```bash
   sf project deploy start --coverage-formatters json --results-dir "coverage"
   # Creates code coverage file here: coverage/coverage/coverage.json
   ```

2. **Transform to your target format**

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

Works with [sfdx-hardis](https://github.com/hardisgroupcom/sfdx-hardis) 8.24.1 or later: the plugin picks up the coverage automatically through [sfdx-hardis events](#sfdx-hardis-events) and posts a coverage summary on the Pull Request.

- `sf hardis project deploy smart|start|validate|quick`
- `sf hardis org test apex`

## Command Reference

<!-- biome-ignore format: oclif readme writes this list with `*` bullets -->
<!-- commands -->
* [`sf acc-transformer transform`](#sf-acc-transformer-transform)

## `sf acc-transformer transform`

Transform Salesforce Apex code coverage JSONs created during deployments and test runs into other formats accepted by SonarQube, GitHub, GitLab, Azure, Bitbucket, etc.

```
USAGE
  $ sf acc-transformer transform -j <value>... -r <value> [--json] [--flags-dir <value>] [-f
    clover|cobertura|github-actions|html|jacoco|json|json-summary|lcovonly|markdown|opencover|simplecov|sonar...] [-i
    <value>...] [--min-coverage <value>] [--max-annotations <value>] [-e <value>...]

FLAGS
  -e, --exclude-pattern=<value>...           Glob pattern for file paths to exclude from the coverage report. Matched
                                             against the relative path from the repo root (e.g.
                                             force-app/main/default/classes/MyClass.cls). Repeat the flag for multiple
                                             patterns.
  -f, --format=<option>...                   Output format for the coverage report.
                                             <options: clover|cobertura|github-actions|html|jacoco|json|json-summary|lco
                                             vonly|markdown|opencover|simplecov|sonar>
  -i, --ignore-package-directory=<value>...  Ignore a package directory when looking for matching files in the coverage
                                             report.
  -j, --coverage-json=<value>...             (required) Path to a code coverage JSON file created by the Salesforce CLI
                                             deploy or test command. Repeat the flag to merge multiple files. When the
                                             same Apex file appears in multiple inputs, covered lines are unioned across
                                             all inputs — if a line is covered in any input it is counted as covered in
                                             the final report, even if it is uncovered in others.
  -r, --output-report=<value>                (required) [default: coverage.xml] Path to the code coverage file that will
                                             be created by this plugin.
      --max-annotations=<value>              [default: 50] Maximum number of GitHub Actions ::warning annotations to
                                             emit when using --format github-actions. Defaults to 50. Annotations beyond
                                             this limit are summarised in a ::notice line.
      --min-coverage=<value>                 Minimum required line coverage percentage (0–100). The command exits with
                                             an error if overall coverage is below this threshold. Reports are still
                                             written before the check.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Transform Salesforce Apex code coverage JSONs created during deployments and test runs into other formats accepted by
  SonarQube, GitHub, GitLab, Azure, Bitbucket, etc.

  Transform Salesforce Apex code coverage JSONs created during deployments and test runs into other formats accepted by
  SonarQube, GitHub, GitLab, Azure, Bitbucket, etc.

EXAMPLES
  `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "sonar"`

  `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "cobertura"`

  `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "clover"`

  `sf acc-transformer transform -j "coverage.json" -r "coverage.info" -f "lcovonly"`

  `sf acc-transformer transform -j "coverage.json" -r "coverage.md" -f "markdown"`

  `sf acc-transformer transform -j "coverage.json" -r "coverage.txt" -f "github-actions"`

  `sf acc-transformer transform -j "coverage.json" -i "force-app"`

  `sf acc-transformer transform -j "coverage1.json" -j "coverage2.json" -r "coverage.xml" -f "sonar"`
```

_See code: [src/commands/acc-transformer/transform.ts](https://github.com/mcarvin8/apex-code-coverage-transformer/blob/v4.3.0/src/commands/acc-transformer/transform.ts)_
<!-- commandsstop -->

## Coverage Report Formats

Use `-f` / `--format` to choose the output format. Multiple `-f` values produce multiple files with the format in the name (e.g. `coverage-sonar.xml`, `coverage-cobertura.xml`).

| Format         | Description                | Typical use                             | Example                                                                                 |
| -------------- | -------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| sonar          | SonarQube generic coverage | SonarQube, SonarCloud                   | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "sonar"`          |
| cobertura      | Cobertura XML              | Codecov, Azure, Jenkins, GitLab, GitHub | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "cobertura"`      |
| jacoco         | JaCoCo XML                 | Codecov, Jenkins, Maven, Gradle         | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "jacoco"`         |
| lcovonly       | LCOV                       | Codecov, Coveralls, GitHub              | `sf acc-transformer transform -j "coverage.json" -r "coverage.info" -f "lcovonly"`      |
| clover         | Clover XML                 | Bamboo, Bitbucket, Jenkins              | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "clover"`         |
| json           | Istanbul JSON              | Istanbul/NYC, Codecov                   | `sf acc-transformer transform -j "coverage.json" -r "coverage.json" -f "json"`          |
| json-summary   | JSON summary               | Badges, PR comments                     | `sf acc-transformer transform -j "coverage.json" -r "coverage.json" -f "json-summary"`  |
| simplecov      | SimpleCov JSON             | Codecov, Ruby tools                     | `sf acc-transformer transform -j "coverage.json" -r "coverage.json" -f "simplecov"`     |
| opencover      | OpenCover XML              | Azure DevOps, VS, Codecov               | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "opencover"`      |
| html           | Full-source HTML report    | Browsers, CI artifacts                  | `sf acc-transformer transform -j "coverage.json" -r "coverage.html" -f "html"`          |
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
          node-version: "20"

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

#### Native Action (skip the sf CLI install)

For GitHub Actions specifically, the transform step can run as a native Action instead of `sf acc-transformer transform` - no need to install `@salesforce/cli` or this plugin just to convert a coverage file:

```yaml
- name: Transform Coverage
  uses: mcarvin8/apex-code-coverage-transformer@v4
  with:
    coverage-json: coverage/test-result-codecoverage.json
    output-report: coverage.xml
    format: sonar
```

Repeatable inputs (`coverage-json`, `format`, `ignore-package-directory`, `exclude-pattern`) accept one value per line. The action exposes `report-paths`, `coverage-percentage`, and `warnings` as step outputs:

```yaml
- name: Transform Coverage
  id: transform
  uses: mcarvin8/apex-code-coverage-transformer@v4
  with:
    coverage-json: coverage/test-result-codecoverage.json
    format: |
      sonar
      markdown
    min-coverage: 80

- name: Use the coverage percentage
  run: echo "Coverage was ${{ steps.transform.outputs.coverage-percentage }}%"
```

`sf acc-transformer transform` remains available for every other CI provider (GitLab, Azure DevOps, Bitbucket) and for local/hook use - see [Automatic Transformation (Hook)](#automatic-transformation-hook) below.

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
          node-version: "20"
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
      versionSpec: "20.x"
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
- `sf hardis project deploy [smart|start|validate|quick]` and `sf hardis org test apex` (see [sfdx-hardis events](#sfdx-hardis-events))

> **Note:** The hook fires once per command and always processes a single coverage JSON. It cannot merge multiple inputs. If you need to merge coverage from multiple runs (e.g. split test batches), run the `sf acc-transformer transform` command manually with multiple `-j` flags after all runs complete.

Sample configs: [Salesforce CLI](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/salesforce-cli/.apexcodecovtransformer.config.json), [SFDX Hardis](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/sfdx-hardis/.apexcodecovtransformer.config.json).

| Key                        | Required   | Description                                                                                                                                  |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `deployCoverageJsonPath`   | For deploy | Path to deploy coverage JSON.                                                                                                                |
| `testCoverageJsonPath`     | For test   | Path to test coverage JSON.                                                                                                                  |
| `outputReportPath`         | No         | Output path (default: `coverage.[xml/info/json]` by format).                                                                                 |
| `format`                   | No         | Format(s), comma-separated (default: `sonar`).                                                                                               |
| `ignorePackageDirectories` | No         | Comma-separated package directories to ignore.                                                                                               |
| `minCoverage`              | No         | Minimum required line coverage percentage (0–100). Exits with an error if overall coverage is below this threshold.                          |
| `maxAnnotations`           | No         | Maximum `::warning` annotations emitted when `format` includes `github-actions` (default: `50`).                                             |
| `excludePatterns`          | No         | Comma-separated glob patterns for file paths to exclude (e.g. `**/*Test*,**/mock/**`). Matched against the relative path from the repo root. |
| `pullRequestComment`       | No         | sfdx-hardis events only: post the coverage summary as a Pull Request comment (default: `true`).                                              |

### sfdx-hardis events

sfdx-hardis 8.24.1 and later send an event as soon as Salesforce returns the result of a validation, a deployment or an Apex test run. The plugin listens to these events, so with sfdx-hardis you don't need `deployCoverageJsonPath` or `testCoverageJsonPath`: the event gives the path of `hardis-report/apex-coverage-results.json`.

The coverage of sfdx-hardis commands only goes through these events. The `sf project deploy` and `sf apex run test` commands that sfdx-hardis starts under the hood are skipped by the hook, so the coverage is transformed once per run.

| Event                         | Sent by                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `sfdx-hardis:validation-done` | `sf hardis project deploy smart` in check mode, `sf hardis project deploy validate`, `deploy start --dry-run` |
| `sfdx-hardis:deployment-done` | `sf hardis project deploy smart`, `sf hardis project deploy start`, `sf hardis project deploy quick`          |
| `sfdx-hardis:apex-tests-done` | `sf hardis org test apex`                                                                                     |

On each event, when `.apexcodecovtransformer.config.json` exists, the plugin:

1. Writes the reports set by `format` and `outputReportPath`.
2. Posts a markdown coverage summary (files sorted with the lowest coverage first) as a Pull Request comment, through the git provider sfdx-hardis is set up with (GitHub, GitLab, Azure DevOps, Bitbucket). There is one comment for validations, one for deployments and one for Apex test runs, and each later run updates its comment. The sfdx-hardis comments are left as they are. Set `pullRequestComment` to `false` to only write the reports.

Notes:

- The summary only counts Apex in the project's package directories, so it can differ from the org-wide coverage sfdx-hardis checks.
- `minCoverage` marks the comment as failing but does not fail the sfdx-hardis command. Use the sfdx-hardis coverage threshold (`apexTestsMinCoverageOrgWide`) to fail the job.
- A `deploy smart` run with several packages sends one event per package; each one overwrites the reports and the comment, so the last package wins.
- Turning the sfdx-hardis events off (`disablePluginEvents: true` in `.sfdx-hardis.yml` or `SFDX_HARDIS_DISABLE_PLUGIN_EVENTS=true`) also turns off this plugin in sfdx-hardis commands.

## Programmatic Usage

Other Node.js tools (CLI plugins, scripts, CI wrappers) can call the transformer directly instead of shelling out to `sf acc-transformer transform`. The API is ESM-only and ships in two npm packages, built from the same source and released with the same version:

- **`apex-code-coverage-transformer-core`** (recommended for libraries): the API only, with **no runtime dependencies**.
- **`apex-code-coverage-transformer`**: the Salesforce CLI plugin package, which also exports the API but installs the plugin's dependencies (`@salesforce/core`, `@oclif/core` and others).

```bash
npm install apex-code-coverage-transformer-core
```

The examples below import from `apex-code-coverage-transformer`; with the core package, import from `apex-code-coverage-transformer-core` instead. Everything else is identical.

```ts
import { transformCoverage, CoverageError } from 'apex-code-coverage-transformer';

const { summary, reports, warnings, passed } = await transformCoverage({
  inputs: ['coverage/coverage/coverage.json'], // file paths and/or already-parsed coverage JSON
  formats: ['cobertura', 'markdown'],
  write: false, // return report contents without writing files
  cwd: '/path/to/sfdx/project', // where to look for sfdx-project.json (default: process.cwd())
});

console.log(`${(summary.lineRate * 100).toFixed(2)}% across ${summary.fileCount} files`);
for (const file of summary.files) {
  console.log(file.path, file.coveredLines, '/', file.totalLines, 'uncovered:', file.uncoveredLines);
}
const markdown = reports.find((r) => r.format === 'markdown')?.content;
```

| Option                     | Default         | Description                                                                                 |
| -------------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `inputs`                   | (required)      | Coverage JSON file paths and/or parsed objects. All must be the same type (deploy or test). |
| `formats`                  | `['sonar']`     | Output formats. `COVERAGE_FORMATS` lists every supported value.                             |
| `outputReport`             | `coverage.xml`  | Base path for written reports. Multiple formats add a suffix (e.g. `coverage-sonar.xml`).   |
| `write`                    | `true`          | When `false`, nothing is written and each report's `path` is `undefined`.                   |
| `cwd`                      | `process.cwd()` | Directory to search upward from for `sfdx-project.json`.                                    |
| `ignorePackageDirectories` | `[]`            | Package directories to skip.                                                                |
| `excludePatterns`          | `[]`            | Glob patterns for repo-relative file paths to exclude.                                      |
| `minCoverage`              | none            | Sets `passed: false` when overall coverage is below this percentage. Nothing is thrown.     |
| `maxAnnotations`           | `50`            | Annotation limit for the `github-actions` format.                                           |

Known failures throw a `CoverageError` with a `code`: `UNKNOWN_INPUT_FORMAT`, `MIXED_INPUT_TYPES`, `UNSUPPORTED_FORMAT`, or `NO_SFDX_PROJECT`. Unreadable input files are skipped with a warning.

Everything exported from the package root follows semver. Deep imports are not supported.

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

**Deploy coverage line numbers** — Older Salesforce deploy command coverage reports could contain covered lines numbered past the end of a file ([forcedotcom/salesforcedx-vscode#5511](https://github.com/forcedotcom/salesforcedx-vscode/issues/5511), [forcedotcom/cli#1568](https://github.com/forcedotcom/cli/issues/1568)). Salesforce fixed this server-side in Winter '27 (API v68.0), and the fix applies regardless of the `--api-version` requested on the deploy. Versions 3.x and earlier of this plugin re-numbered those lines; starting with v4, deploy coverage lines are passed through as reported by Salesforce. If you still see out-of-range lines in deploy coverage, please [open an issue](https://github.com/mcarvin8/apex-code-coverage-transformer/issues).

## Questions or Issues?

Questions, issues? Missing an output format via `--format`? Open an [issue](https://github.com/mcarvin8/apex-code-coverage-transformer/issues).

## License

[MIT](LICENSE.md)
