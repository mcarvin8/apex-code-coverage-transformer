# `apex-code-coverage-transformer`

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer)
[![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)
[![Maintainability](https://qlty.sh/badges/11057a07-84da-41af-91fb-b3476e404242/maintainability.svg)](https://qlty.sh/gh/mcarvin8/projects/apex-code-coverage-transformer)
[![Code Coverage](https://qlty.sh/badges/11057a07-84da-41af-91fb-b3476e404242/test_coverage.svg)](https://qlty.sh/gh/mcarvin8/projects/apex-code-coverage-transformer)
[![Known Vulnerabilities](https://snyk.io//test/github/mcarvin8/apex-code-coverage-transformer/badge.svg?targetFile=package.json)](https://snyk.io//test/github/mcarvin8/apex-code-coverage-transformer?targetFile=package.json)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

- [Install](#install)
- [Usage](#usage)
  - [Salesforce CLI](#salesforce-cli)
  - [SFDX Hardis](#sfdx-hardis)
- [Fixes and Enhancements](#fixes-and-enhancements)
- [Command](#command)
  - [`sf acc-transformer transform`](#sf-acc-transformer-transform)
- [Coverage Report Formats](#coverage-report-formats)
- [Hook](#hook)
- [Troubleshooting](#troubleshooting)
- [Issues](#issues)
- [Contributing](#contributing)
- [License](#license)
</details>

Transform the Salesforce Apex code coverage JSON files created during deployments and test runs into other [formats](#coverage-report-formats) accepted by SonarQube, GitHub, GitLab, Azure, Bitbucket, etc.

> If there's a coverage format not yet supported by this plugin, feel free to provide a pull request or issue for the coverage format.

## Install

```bash
sf plugins install apex-code-coverage-transformer@x.y.z
```

## Usage

This plugin is designed for users deploying Apex or running Apex tests within Salesforce DX projects (`sfdx-project.json`). It transforms Salesforce CLI JSON coverage reports into formats recognized by external tools.

The plugin ensures that coverage data is only reported for files found in your package directories, preventing mismatches in tools like SonarQube. If Apex files are missing from your project (i.e. Apex from managed or unlocked packages), they will be excluded from the transformed report with a [warning](#troubleshooting).

To automate coverage transformation after deployments or test executions, see [Hook](#hook).

### Salesforce CLI

> This plugin will only support the "json" coverage format from the Salesforce CLI. Do not use other coverage formats from the Salesforce CLI.

To create the code coverage JSON when deploying or validating, append `--coverage-formatters json --results-dir "coverage"` to the `sf project deploy` command. This will create a coverage JSON in this relative path - `coverage/coverage/coverage.json`.

```
sf project deploy [start/validate/report/resume] --coverage-formatters json --results-dir "coverage"
```

To create the code coverage JSON when running tests directly in the org, append `--code-coverage --output-dir "coverage"` to the `sf apex run test` or `sf apex get test` command. This will create the code coverage JSON in this relative path - `coverage/test-result-codecoverage.json`

```
sf apex run test --code-coverage --output-dir "coverage"
sf apex get test --test-run-id <test run id> --code-coverage --output-dir "coverage"
```

### SFDX Hardis

This plugin can be used after running the below [sfdx-hardis](https://github.com/hardisgroupcom/sfdx-hardis) commands:

- `sf hardis project deploy smart` (only if `COVERAGE_FORMATTER_JSON=true` environment variable is defined)
- `sf hardis org test apex`

Both hardis commands will create the code coverage JSON to transform here: `hardis-report/apex-coverage-results.json`.

## Fixes and Enhancements

- **Maps Apex file names** in the original coverage report (e.g., `no-map/AccountTriggerHandler`) to their corresponding relative file paths in the Salesforce DX project (e.g., `force-app/main/default/classes/AccountTriggerHandler.cls`).
- **Normalizes coverage reports** across both deploy and test commands, improving compatibility with external tools.
- **Adds additional coverage formats** not available in the default Salesforce CLI deploy and test commands.
- **"Fixes" inaccuracies** in Salesforce CLI deploy command coverage reports, such as out-of-range covered lines (e.g., line 100 reported as "covered" in a 98-line Apex class) and incorrect total line counts (e.g., 120 lines reported for a 100-line Apex class).
  - To address these inaccuracies, the plugin includes a **re-numbering function** that only applies to deploy coverage reports. This function reassigns out-of-range `covered` lines to unused lines, ensuring reports are accepted by external tools.
  - The `uncovered` lines are always correctly reported by the deploy command.
  - Once Salesforce resolves the issue with the API that affects deploy command coverage reports, the re-numbering function will be removed in a future **breaking** release.
  - See issues [5511](https://github.com/forcedotcom/salesforcedx-vscode/issues/5511) and [1568](https://github.com/forcedotcom/cli/issues/1568) for more details.
  - **Note**: This does not affect coverage reports generated by the Salesforce CLI test commands.

## Command

The `apex-code-coverage-transformer` has 1 command:

- `sf acc-transformer transform`

## `sf acc-transformer transform`

```
USAGE
  $ sf acc-transformer transform -j <value> [-r <value>] [-f <value>] [-i <value>] [--json]

FLAGS
  -j, --coverage-json=<value>             Path to the code coverage JSON file created by the Salesforce CLI deploy or test command.
  -r, --output-report=<value>             Path to the code coverage file that will be created by this plugin.
                                          [default: "coverage.[xml/info]"]
  -f, --format=<value>                    Output format for the code coverage format.
                                          Can be declared multiple times.
                                          If declared multiple times, the output report will have the format appended to the file-name, i.e. `coverage-sonar.xml`
                                          [default: "sonar"]
  -i, --ignore-package-directory=<value>  Package directory to ignore when looking for matching files in the coverage report.
                                          Should be as they appear in the "sfdx-project.json".
                                          Can be declared multiple times.

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  Transform the JSON into Sonar format:

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "sonar"

  Transform the JSON into Cobertura format:

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "cobertura"

  Transform the JSON into Clover format:

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "clover"

  Transform the JSON into LCovOnly format:

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.info" -f "lcovonly"

  Transform the JSON into Sonar format, ignoring Apex in the "force-app" directory:

    $ sf acc-transformer transform -j "coverage.json" -i "force-app"
```

## Coverage Report Formats

The `-f`/`--format` flag allows you to specify the format of the transformed coverage report.

You can provide multiple `--format` flags in a single command to create multiple reports. If multiple `--format` flags are provided, each output report will have the format appended to the name. For example, if `--output-report` is set `coverage.xml` and you supply `--format sonar --format cobertura` to the command, the output reports will be `coverage-sonar.xml` and `coverage-cobertura.xml`.

| Flag Option                                                                                                                  | Description                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [sonar](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/baselines/sonar_baseline.xml)         | Generates a SonarQube-compatible coverage report. This is the default option.              |
| [clover](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/baselines/clover_baseline.xml)       | Produces a Clover XML report format, commonly used with Atlassian tools.                   |
| [lcovonly](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/baselines/lcov_baseline.info)      | Outputs coverage data in LCOV format, useful for integrating with LCOV-based tools.        |
| [cobertura](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/baselines/cobertura_baseline.xml) | Creates a Cobertura XML report, a widely used format for coverage reporting.               |
| [jacoco](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/baselines/jacoco_baseline.xml)       | Creates a JaCoCo XML report, the standard for Java projects.                               |
| [json](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/baselines/json_baseline.json)          | Generates a Istanbul JSON report compatible with Node.js tooling and coverage visualizers. |

## Hook

To enable automatic transformation after the below `sf` commands complete, create a `.apexcodecovtransformer.config.json` in your project’s root directory.

- `sf project deploy [start/validate/report/resume]`
- `sf apex run test`
- `sf apex get test`
- `sf hardis project deploy smart`
  - only if `sfdx-hardis` is installed
  - `COVERAGE_FORMATTER_JSON=true` must be set in the environment variables
- `sf hardis org test apex`
  - only if `sfdx-hardis` is installed

You can copy & update the sample [Salesforce CLI .apexcodecovtransformer.config.json](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/salesforce-cli/.apexcodecovtransformer.config.json), which assumes you are running the Salesforce CLI commands and specifying the `--results-dir`/`--output-dir` directory as "coverage".

You can copy & update the sample [SFDX Hardis .apexcodecovtransformer.config.json](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/sfdx-hardis/.apexcodecovtransformer.config.json), which assumes you are running the SFDX Hardis commands.

**`.apexcodecovtransformer.config.json` structure**

| JSON Key                   | Required                               | Description                                                                                                                                                                 |
| -------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deployCoverageJsonPath`   | Yes (for deploy command)               | Code coverage JSON created by the Salesforce CLI deploy commands.                                                                                                           |
| `testCoverageJsonPath`     | Yes (for test command)                 | Code coverage JSON created by the Salesforce CLI test commands.                                                                                                             |
| `outputReportPath`         | No (defaults to `coverage.[xml/info]`) | Transformed code coverage report path.                                                                                                                                      |
| `format`                   | No (defaults to `sonar`)               | Transformed code coverage report [format(s)](#coverage-report-formats). If you're providing multiple formats, provide a comma-separated list, i.e. `sonar,cobertura,jacoco` |
| `ignorePackageDirectories` | No                                     | Comma-separated string of package directories to ignore when looking for matching Apex files.                                                                               |

## Troubleshooting

If a file listed in the coverage JSON cannot be found in any package directory, a warning is displayed, and the file will not be included in the transformed report:

```
Warning: The file name AccountTrigger was not found in any package directory.
```

If **none** of the files in the coverage JSON are found in a package directory, the plugin will print an additional warning, and the generated report will be empty:

```
Warning: The file name AccountTrigger was not found in any package directory.
Warning: The file name AccountProfile was not found in any package directory.
Warning: None of the files listed in the coverage JSON were processed. The coverage report will be empty.
```

Salesforce CLI generates code coverage JSONs in two different structures (deploy and test command formats). If the provided coverage JSON does not match one of these expected structures, the plugin will fail with:

```
Error (1): The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.
```

If `sfdx-project.json` file is missing from the project root, the plugin will fail with:

```
Error (1): sfdx-project.json not found in any parent directory.
```

If a package directory listed in `sfdx-project.json` cannot be found, the plugin will encounter a **ENOENT** error:

```
Error (1): ENOENT: no such file or directory: {packageDir}
```

## Issues

If you encounter any issues or would like to suggest features, please create an [issue](https://github.com/mcarvin8/apex-code-coverage-transformer/issues).

## Contributing

Contributions are welcome! See [Contributing](https://github.com/mcarvin8/apex-code-coverage-transformer/blob/main/CONTRIBUTING.md).

## License

This project is licensed under the MIT license. Please see the [LICENSE](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md) file for details.
