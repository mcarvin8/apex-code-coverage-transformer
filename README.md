# apex-code-coverage-transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer)
[![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)
[![Maintainability](https://qlty.sh/badges/11057a07-84da-41af-91fb-b3476e404242/maintainability.svg)](https://qlty.sh/gh/mcarvin8/projects/apex-code-coverage-transformer)
[![Code Coverage](https://qlty.sh/badges/11057a07-84da-41af-91fb-b3476e404242/test_coverage.svg)](https://qlty.sh/gh/mcarvin8/projects/apex-code-coverage-transformer)
[![Known Vulnerabilities](https://snyk.io//test/github/mcarvin8/apex-code-coverage-transformer/badge.svg?targetFile=package.json)](https://snyk.io//test/github/mcarvin8/apex-code-coverage-transformer?targetFile=package.json)

A Salesforce CLI plugin that converts Apex code coverage JSON (from deploy or test runs) into formats used by SonarQube, Codecov, GitHub, GitLab, Azure DevOps, Bitbucket, and other tools. Use it to keep coverage in sync with your CI/CD and code quality pipelines.

> Missing an output format via `--format`? Open an [issue](https://github.com/mcarvin8/apex-code-coverage-transformer/issues) or submit a [pull request](https://github.com/mcarvin8/apex-code-coverage-transformer/blob/main/CONTRIBUTING.md).

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Salesforce CLI](#salesforce-cli)
  - [SFDX Hardis](#sfdx-hardis)
- [What This Plugin Fixes and Adds](#what-this-plugin-fixes-and-adds)
- [Command Reference](#command-reference)
  - [sf acc-transformer transform](#sf-acc-transformer-transform)
- [Coverage Report Formats](#coverage-report-formats)
- [CI/CD Integration](#cicd-integration)
  - [Codecov](#codecov)
  - [SonarQube](#sonarqube)
  - [GitHub Actions](#github-actions)
  - [GitLab CI](#gitlab-ci)
- [Automatic Transformation (Hook)](#automatic-transformation-hook)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
</details>

## Prerequisites

- [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) (`sf`) installed
- Node.js 20.x or later
- A Salesforce DX project with `sfdx-project.json` and package directories
- Use only the **json** coverage formatter from the Salesforce CLI; other formatters are not supported

## Install

```bash
sf plugins install apex-code-coverage-transformer@x.y.z
```

## Quick Start

1. **Generate Apex code coverage (JSON)**  
   From tests:

   ```bash
   sf apex run test --code-coverage --output-dir "coverage"
   ```

   Or from deploy/validate:

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

   # Multiple formats
   sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -f "sonar" -f "cobertura" -f "jacoco"
   ```

3. **Upload to your tool**  
   See [CI/CD Integration](#cicd-integration) for Codecov, SonarQube, GitHub Actions, and GitLab.

## Usage

This plugin is for Salesforce DX projects (`sfdx-project.json`). It maps Apex names in the CLI coverage JSON to file paths in your package directories and only includes files that exist in those directories. Apex from managed or unlocked packages (not in your repo) is excluded and reported with a [warning](#troubleshooting).

To run transformation automatically after deploy or test commands, use the [Hook](#automatic-transformation-hook).

### Salesforce CLI

**Deploy/validate** — coverage path: `coverage/coverage/coverage.json`

```bash
sf project deploy [start|validate|report|resume] --coverage-formatters json --results-dir "coverage"
```

**Run tests** — coverage path: `coverage/test-result-codecoverage.json`

```bash
sf apex run test --code-coverage --output-dir "coverage"
sf apex get test --test-run-id <id> --code-coverage --output-dir "coverage"
```

### SFDX Hardis

Works with [sfdx-hardis](https://github.com/hardisgroupcom/sfdx-hardis):

- `sf hardis project deploy smart` (when `COVERAGE_FORMATTER_JSON=true`)
- `sf hardis org test apex`

Coverage file: `hardis-report/apex-coverage-results.json`.

## What This Plugin Fixes and Adds

- **File mapping** — Maps names like `no-map/AccountTriggerHandler` to paths like `force-app/main/default/classes/AccountTriggerHandler.cls`.
- **Normalization** — Aligns deploy and test coverage structures so external tools can consume them.
- **Extra formats** — Outputs Sonar, Cobertura, JaCoCo, LCOV, Clover, and more (see [Coverage Report Formats](#coverage-report-formats)).
- **Deploy-coverage fixes** — Corrects known CLI issues (e.g. out-of-range covered lines, wrong line counts) by re-numbering covered lines in deploy reports. Uncovered lines are already correct. This workaround will be removed in a future **breaking** release once Salesforce fixes the API; see [forcedotcom/salesforcedx-vscode#5511](https://github.com/forcedotcom/salesforcedx-vscode/issues/5511) and [forcedotcom/cli#1568](https://github.com/forcedotcom/cli/issues/1568). Test-command coverage is unaffected.

## Command Reference

Single command: `sf acc-transformer transform`.

### sf acc-transformer transform

```
USAGE
  $ sf acc-transformer transform -j <value> [-r <value>] [-f <value>] [-i <value>] [--json]

FLAGS
  -j, --coverage-json=<value>             Path to the code coverage JSON from deploy or test.
  -r, --output-report=<value>             Output path (e.g. coverage.xml). Default: coverage.[xml|info] by format.
  -f, --format=<value>                    Output format (repeat for multiple). Default: sonar.
                                          Multiple formats append to filename, e.g. coverage-sonar.xml.
  -i, --ignore-package-directory=<value>  Package directory to ignore (as in sfdx-project.json). Repeatable.

GLOBAL FLAGS
  --json  Output as JSON.
```

## Coverage Report Formats

Use `-f` / `--format` to choose the output format. Multiple `-f` values produce multiple files with the format in the name (e.g. `coverage-sonar.xml`, `coverage-cobertura.xml`).

| Format       | Description                | Typical use                             | Example                                                                                |
| ------------ | -------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| sonar        | SonarQube generic coverage | SonarQube, SonarCloud                   | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "sonar"`         |
| cobertura    | Cobertura XML              | Codecov, Azure, Jenkins, GitLab, GitHub | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "cobertura"`     |
| jacoco       | JaCoCo XML                 | Codecov, Jenkins, Maven, Gradle         | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "jacoco"`        |
| lcovonly     | LCOV                       | Codecov, Coveralls, GitHub              | `sf acc-transformer transform -j "coverage.json" -r "coverage.info" -f "lcovonly"`     |
| clover       | Clover XML                 | Bamboo, Bitbucket, Jenkins              | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "clover"`        |
| json         | Istanbul JSON              | Istanbul/NYC, Codecov                   | `sf acc-transformer transform -j "coverage.json" -r "coverage.json" -f "json"`         |
| json-summary | JSON summary               | Badges, PR comments                     | `sf acc-transformer transform -j "coverage.json" -r "coverage.json" -f "json-summary"` |
| simplecov    | SimpleCov JSON             | Codecov, Ruby tools                     | `sf acc-transformer transform -j "coverage.json" -r "coverage.json" -f "simplecov"`    |
| opencover    | OpenCover XML              | Azure DevOps, VS, Codecov               | `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "opencover"`     |
| html         | HTML report                | Browsers, CI artifacts                  | `sf acc-transformer transform -j "coverage.json" -r "coverage.html" -f "html"`         |

## CI/CD Integration

### Codecov

Cobertura is a good default. **CLI upload:**

```bash
sf apex run test --code-coverage --output-dir "coverage"
sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "cobertura"
codecovcli upload-process --file coverage.xml
```

**GitHub Action:**

```yaml
name: Salesforce CI with Codecov
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Salesforce CLI
        run: npm install -g @salesforce/cli
      - name: Install Coverage Transformer Plugin
        run: sf plugins install apex-code-coverage-transformer
      - name: Authenticate to Salesforce
        run: sf org login sfdx-url --sfdx-url-file ${{ secrets.SFDX_AUTH_URL }} --alias ci-org
      - name: Run Apex Tests
        run: sf apex run test --code-coverage --output-dir coverage --target-org ci-org
      - name: Transform Coverage to Cobertura
        run: sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "cobertura"
      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.xml
          flags: apex
          token: ${{ secrets.CODECOV_TOKEN }}
```

### SonarQube

Use the **sonar** format. **Scanner:**

```bash
sf apex run test --code-coverage --output-dir "coverage"
sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "sonar"
sonar-scanner \
  -Dsonar.projectKey=your-project-key \
  -Dsonar.sources=force-app \
  -Dsonar.tests=force-app \
  -Dsonar.test.inclusions=**/*Test.cls \
  -Dsonar.apex.coverage.reportPath=coverage.xml \
  -Dsonar.host.url=https://sonarqube.example.com \
  -Dsonar.login=$SONAR_TOKEN
```

**SonarCloud GitHub Action:**

```yaml
name: SonarCloud Analysis
on: [push, pull_request]
jobs:
  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Install Salesforce CLI
        run: npm install -g @salesforce/cli
      - name: Install Coverage Transformer Plugin
        run: sf plugins install apex-code-coverage-transformer
      - name: Authenticate to Salesforce
        run: sf org login sfdx-url --sfdx-url-file ${{ secrets.SFDX_AUTH_URL }} --alias ci-org
      - name: Run Apex Tests
        run: sf apex run test --code-coverage --output-dir coverage --target-org ci-org
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
            -Dsonar.apex.coverage.reportPath=coverage.xml
```

### GitHub Actions

Use Cobertura (or LCOV) with a coverage summary action:

```yaml
name: Salesforce CI with Coverage Report
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Salesforce CLI
        run: npm install -g @salesforce/cli
      - name: Install Coverage Transformer Plugin
        run: sf plugins install apex-code-coverage-transformer
      - name: Authenticate to Salesforce
        run: sf org login sfdx-url --sfdx-url-file ${{ secrets.SFDX_AUTH_URL }} --alias ci-org
      - name: Run Apex Tests
        run: sf apex run test --code-coverage --output-dir coverage --target-org ci-org
      - name: Transform Coverage to Cobertura
        run: sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "cobertura"
      - name: Code Coverage Report
        uses: irongut/CodeCoverageSummary@v1.3.0
        with:
          filename: coverage.xml
          badge: true
          format: markdown
          output: both
      - name: Add Coverage PR Comment
        uses: marocchino/sticky-pull-request-comment@v2
        if: github.event_name == 'pull_request'
        with:
          recreate: true
          path: code-coverage-results.md
```

### GitLab CI

Cobertura for coverage in the UI:

```yaml
stages:
  - test

apex-tests:
  stage: test
  image: node:20
  before_script:
    - npm install -g @salesforce/cli
    - sf plugins install apex-code-coverage-transformer
    - echo $SFDX_AUTH_URL | sf org login sfdx-url --sfdx-url-stdin --alias ci-org
  script:
    - sf apex run test --code-coverage --output-dir coverage --target-org ci-org
    - sf acc-transformer transform -j "coverage/test-result-codecoverage.json" -r "coverage.xml" -f "cobertura"
  coverage: '/TOTAL.*\s+(\d+%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    paths:
      - coverage/
    expire_in: 30 days
```

## Automatic Transformation (Hook)

Create `.apexcodecovtransformer.config.json` in the project root to transform coverage automatically after:

- `sf project deploy [start|validate|report|resume]`
- `sf apex run test`
- `sf apex get test`
- `sf hardis project deploy smart` (if sfdx-hardis installed and `COVERAGE_FORMATTER_JSON=true`)
- `sf hardis org test apex` (if sfdx-hardis installed)

Sample configs: [Salesforce CLI](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/salesforce-cli/.apexcodecovtransformer.config.json), [SFDX Hardis](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/sfdx-hardis/.apexcodecovtransformer.config.json).

| Key                        | Required   | Description                                              |
| -------------------------- | ---------- | -------------------------------------------------------- |
| `deployCoverageJsonPath`   | For deploy | Path to deploy coverage JSON.                            |
| `testCoverageJsonPath`     | For test   | Path to test coverage JSON.                              |
| `outputReportPath`         | No         | Output path (default: `coverage.[xml\|info]` by format). |
| `format`                   | No         | Format(s), comma-separated (default: `sonar`).           |
| `ignorePackageDirectories` | No         | Comma-separated package directories to ignore.           |

## Troubleshooting

**File not in package directory** — File is omitted from the report and a warning is shown:

```
Warning: The file name AccountTrigger was not found in any package directory.
```

**No files matched** — Report will be empty:

```
Warning: None of the files listed in the coverage JSON were processed. The coverage report will be empty.
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

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](https://github.com/mcarvin8/apex-code-coverage-transformer/blob/main/CONTRIBUTING.md) for setup, testing, and how to add new coverage formats.

## License

MIT. See [LICENSE](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md).
