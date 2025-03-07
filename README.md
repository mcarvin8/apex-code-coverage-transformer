# Apex Code Coverage Transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer) [![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)

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

If there's a coverage format not yet supported by this plugin, feel free to provide a pull request or issue for the coverage format.

## Install

```bash
sf plugins install apex-code-coverage-transformer@x.y.z
```

## Usage

This plugin is designed for users deploying Apex or running Apex tests within Salesforce DX projects (`sfdx-project.json`). It transforms Salesforce CLI JSON coverage reports into formats recognized by external tools.

The plugin ensures that coverage data is only reported for files found in your package directories, preventing mismatches in tools like SonarQube. If Apex files are missing from your project (i.e. Apex from managed or unlocked packages), they will be excluded from the final report with a [warning](#troubleshooting).

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

- Maps Apex file names in the original coverage report (e.g., `no-map/AccountTriggerHandler`) to their corresponding relative file paths in the Salesforce DX project (e.g., `force-app/main/default/classes/AccountTriggerHandler.cls`).
- Normalizes coverage reports across deploy and test commands for better compatibility with external tools.
- Provides additional coverage formats beyond those available with the default deploy and test commands in the Salesforce CLI.
- "Fixes" inaccuracies in Salesforce CLI deploy coverage reports (out-of-range covered lines, incorrect total line counts, etc.).
  - i.e. line 100 in a 98-line apex class is reported as "covered" or 120 lines are included in the deploy coverage report for a 100-line apex class.
  - To work around these inaccuracies, this plugin has a re-numbering function which only runs against deploy coverage reports. This function will re-number out-of-range covered lines to un-used lines. The **uncovered** lines are always **correctly** returned by the Salesforce CLI deploy command.
  - Once the Salesforce server team fixes the API to correctly return coverage in deploy command coverage reports, this re-numbering function will be removed via a new breaking release.
      - See issues [5511](https://github.com/forcedotcom/salesforcedx-vscode/issues/5511) and [1568](https://github.com/forcedotcom/cli/issues/1568).
  - **NOTE**: This does **not** affect coverage reports created by the Salesforce CLI test commands.

## Command

The `apex-code-coverage-transformer` has 1 command:

- `sf acc-transformer transform`

## `sf acc-transformer transform`

```
USAGE
  $ sf acc-transformer transform -j <value> -r <value> -f <value> -i <value> [--json]

FLAGS
  -j, --coverage-json=<value>             Path to the code coverage JSON file created by the Salesforce CLI deploy or test command.
  -r, --output-report=<value>             Path to the code coverage file that will be created by this plugin.
                                          [default: "coverage.[xml/info]"]
  -f, --format=<value>                    Output format for the code coverage format.
                                          [default: "sonar"]
  -i, --ignore-package-directory=<value>  Package directory to ignore when looking for matching files in the coverage report.
                                          Should be as they appear in the "sfdx-project.json".
                                          Can be declared multiple times.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Transform the Apex code coverage JSON file created by the Salesforce CLI deploy and test command into other formats accepted by SonarQube, GitHub, GitLab, Azure, Bitbucket, etc.

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

| Flag Option | Description                                                                         | Example                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `sonar`     | Generates a SonarQube-compatible coverage report. This is the default option.       | [example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/sonar_baseline.xml)         |
| `clover`    | Produces a Clover XML report format, commonly used with Atlassian tools.            | [example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/clover_baseline.xml)       |
| `lcovonly`  | Outputs coverage data in LCOV format, useful for integrating with LCOV-based tools. | [example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/lcov_baseline.info)      |
| `cobertura` | Creates a Cobertura XML report, a widely used format for coverage reporting.        | [example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/cobertura_baseline.xml) |
| `jacoco`    | Creates a JaCoCo XML report, the standard for Java projects.                        | [example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/jacoco_baseline.xml)       |

## Hook

To enable automatic transformation after the below `sf` commands complete, create `.apexcodecovtransformer.config.json` in your project’s root directory.

- `sf project deploy [start/validate/report/resume]`
- `sf apex run test`
- `sf apex get test`
- `sf hardis project deploy smart` 
  - only if `sfdx-hardis` is installed
  - `COVERAGE_FORMATTER_JSON=true` must be set in the environment variables
- `sf hardis org test apex`
  - only if `sfdx-hardis` is installed

You can copy the sample [Salesforce CLI .apexcodecovtransformer.config.json](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/salesforce-cli/.apexcodecovtransformer.config.json), which assumes you are running the Salesforce CLI commands and specifying the `--results-dir`/`--output-dir` directory as "coverage". Update this sample with your desired output report path and format.

You can copy the sample [SFDX Hardis .apexcodecovtransformer.config.json](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/sfdx-hardis/.apexcodecovtransformer.config.json), which assumes you are running the SFDX Hardis commands. Update this sample with your desired output report path and format.

The `.apexcodecovtransformer.config.json` follows this structure:

- `deployCoverageJsonPath` is required to use the hook after deploy commands and should be the path to the code coverage JSON created by the Salesforce CLI/SFDX Hardis deploy command. Recommend using a relative path.
- `testCoverageJsonPath` is required to use the hook after test commands and should be the path to the code coverage JSON created by the Salesforce CLI/SFDX Hardis test command. Recommend using a relative path.
- `outputReportPath` is optional and should be the path to the code coverage file created by this plugin. Recommend using a relative path. If this isn't provided, it will default to `coverage.[xml/info]` in the working directory.
- `format` is optional and should be the intended coverage report [format](#coverage-report-formats) created by this plugin. If this isn't provided, it will default to "sonar".

If `.apexcodecovtransformer.config.json` is missing, the hook will not run.

## Troubleshooting

Any file in the coverage JSON that isn't found in any package directory will result in this warning and will not be added to the transformed report:

```
Warning: The file name AccountTrigger was not found in any package directory.
```

If none of the files listed in the coverage JSON were found in a package directory, the plugin will print an additional warning stating no files were processed. In this case, the transformed report generated will be an empty file.

```
Warning: The file name AccountTrigger was not found in any package directory.
Warning: The file name AccountProfile was not found in any package directory.
Warning: None of the files listed in the coverage JSON were processed. The coverage report will be empty.
```

The code coverage JSON files created by the Salesforce CLI deploy and test commands follow different formats. If the code coverage JSON file provided does not match 1 of the 2 expected coverage data types, the plugin will fail with:

```
Error (1): The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.
```

If the `sfdx-project.json` file was not found in your project's root folder, the plugin will fail with:

```
Error (1): sfdx-project.json not found in any parent directory.
```

Any ENOENT failures indicate that the plugin had issues finding one of the package directories in the `sfdx-project.json` file:

```
Error (1): ENOENT: no such file or directory: {packageDirPath}
```

## Issues

If you encounter any issues or would like to suggest features, please create an [issue](https://github.com/mcarvin8/apex-code-coverage-transformer/issues).

## Contributing

Contributions are welcome! See [Contributing](https://github.com/mcarvin8/apex-code-coverage-transformer/blob/main/CONTRIBUTING.md).

## License

This project is licensed under the MIT license. Please see the [LICENSE](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md) file for details.
