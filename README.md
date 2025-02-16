# Apex Code Coverage Transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer) [![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

- [Install](#install)
- [Usage](#usage)
  - [Salesforce CLI](#salesforce-cli)
  - [SFDX Hardis](#sfdx-hardis)
- [What This Fixes](#what-this-fixes)
- [Command](#command)
  - [`sf acc-transformer transform`](#sf-acc-transformer-transform)
- [Coverage Report Formats](#coverage-report-formats)
- [Hook](#hook)
- [Debugging](#debugging)
- [Contributing](#contributing)
- [Issues](#issues)
- [License](#license)
</details>

A Salesforce CLI plugin to transform the Apex code coverage JSON files created during deployments and test runs into other [formats](#coverage-report-formats) accepted by SonarQube, GitHub, GitLab, Azure, Bitbucket, etc.

If there's a coverage format not yet supported by this plugin, feel free to provide a pull request or issue for the coverage format.

## Install

```bash
sf plugins install apex-code-coverage-transformer@x.y.z
```

## Usage

This plugin is intended for users who deploy their Apex or invoke Apex tests in their orgs from any Salesforce DX project (`sfdx-project.json` file). You should be running this plugin somewhere inside your Salesforce DX project. This plugin searches for your project's `sfdx-project.json` file to know which package directories to search into.

This plugin will work regardless of your testing strategy (running all tests, running specified tests, running all local tests). The files in the original coverage JSON has to be found in one of the package directories to be added to the final report. This ensures external tools like SonarQube can match files in the coverage report to a file in the project.

When the plugin is unable to find a matching Apex file in your project (i.e. Apex from managed and unlocked packages), it will print a warning and not add that file's coverage data to the final coverage report. See [Debugging](#debugging) for more information.

You should run this plugin after you deploy or invoke Apex tests in your org either using the Salesforce CLI or sfdx-hardis.

### Salesforce CLI

**This plugin will only support the "json" coverage format from the Salesforce CLI. Do not use other coverage formats from the Salesforce CLI.**

To create the code coverage JSON when deploying or validating, append `--coverage-formatters json --results-dir "coverage"` to the `sf project deploy` command. This will create a coverage JSON in this relative path - `coverage/coverage/coverage.json`.

```
sf project deploy [start/validate] --coverage-formatters json --results-dir "coverage"
```

To create the code coverage JSON when running tests directly in the org, append `--code-coverage --output-dir "coverage"` to the `sf apex run test` or `sf apex get test` command. This will create the code coverage JSON in this relative path - `coverage/test-result-codecoverage.json`

```
sf apex run test --code-coverage --output-dir "coverage"
sf apex get test --test-run-id <test run id> --code-coverage --output-dir "coverage"
```

The code coverage JSONs created by the Salesforce CLI aren't accepted automatically for Salesforce DX projects and needs to be converted using this plugin.

### SFDX Hardis

This plugin can be used after running [sfdx-hardis](https://github.com/hardisgroupcom/sfdx-hardis) commands `hardis:project:deploy:smart` (only if `COVERAGE_FORMATTER_JSON=true` environment variable is defined) and `hardis:org:test:apex` assuming you have sfdx-hardis and this plugin installed.

Both hardis commands will create the code coverage JSON to transform here: `hardis-report/apex-coverage-results.json`. Provide this relative path as the `--coverage-json`/`-j` input for this plugin.

## What this fixes

- The coverage reports created by this plugin will add correct file-paths per your Salesforce DX project. Salesforce CLI coverage reports have the `no-map/` prefix hard-coded into their coverage reports. The coverage report created in this plugin will only contain Apex coverage results against files found in your Salesforce DX project, allowing you to use these reports in external code quality tools like SonarQube.
- Normalizes the coverage reports created by the Salesforce CLI deploy and test command. The coverage reports created by both CLI commands follow different formats and have different coverage format options. These differences cause issues when trying to have external tools like SonarQube parse the coverage reports. This plugin handles parsing both command coverage reports and converting them into common formats accepted by external tools like SonarQube and GitLab.
- The coverage reports created by this plugin "fixes" an issue with Salesforce CLI deploy command coverage reports. The coverage reports created by the deploy command contains several inaccuracies in their covered lines.
  - Salesforce's deploy coverage report may report out-of-range lines as "covered", i.e. line 100 in a 98-line apex class is reported as "covered".
  - Salesforce's deploy coverage report may report extra lines than the total lines in the apex class, i.e. 120 lines are included in the deploy coverage report for a 100-line apex class.
  - The coverage percentage may vary based on how many lines the API returns in the original deploy coverage report.
  - To work around these inaccuracies, I added a re-numbering function which only runs against deploy coverage reports to ensure the transformed coverage reports are accepted by external tools.
  - Once the Salesforce server team fixes the API to correctly return coverage in deploy command coverage reports, I will remove this re-numbering function.
  - See issues [5511](https://github.com/forcedotcom/salesforcedx-vscode/issues/5511) and [1568](https://github.com/forcedotcom/cli/issues/1568).
  - **NOTE**: This does not affect coverage reports created by the Salesforce CLI test commands.

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
  -i, --ignore-package-directory=<value>  Package directories to ignore when looking for matching files in the coverage report.
                                          Should be as they appear in the "sfdx-project.json".
                                          Can be declared multiple times.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Transform the Apex code coverage JSON file created by the Salesforce CLI deploy and test command into other formats accepted by SonarQube, GitHub, GitLab, Azure, Bitbucket, etc.

EXAMPLES
    $ sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "sonar"

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "cobertura"

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "clover"

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.info" -f "lcovonly"

    $ sf acc-transformer transform -j "coverage.json" -i "force-app"
```

## Coverage Report Formats

The `-f`/`--format` flag allows you to specify the format of the coverage report.

| Flag Option | Description                                                                         | Example                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `sonar`     | Generates a SonarQube-compatible coverage report. This is the default option.       | [Sonar example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/sonar_baseline.xml)         |
| `clover`    | Produces a Clover XML report format, commonly used with Atlassian tools.            | [Clover example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/clover_baseline.xml)       |
| `lcovonly`  | Outputs coverage data in LCOV format, useful for integrating with LCOV-based tools. | [LCovOnly example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/lcov_baseline.info)      |
| `cobertura` | Creates a Cobertura XML report, a widely used format for coverage reporting.        | [Cobertura example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/cobertura_baseline.xml) |
| `jacoco`    | Creates a JaCoCo XML report, the standard for Java projects.                        | [JaCoCo example](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/jacoco_baseline.xml)       |

## Hook

A post-run hook has been configured if you opt into using it by creating a `.apexcodecovtransformer.config.json` config file in the root of your repo. If the config file is found, the post-run hook will automatically run after the following commands:

- `sf project deploy start`
- `sf project deploy validate`
- `sf project deploy report`
- `sf project deploy resume`
- `sf apex run test`
- `sf apex get test`
- `sf hardis project deploy smart` (only if sfdx-hardis is installed and `COVERAGE_FORMATTER_JSON=true` environment variable is defined)
- `sf hardis org test apex` (only if sfdx-hardis is installed)

You can copy the sample [Salesforce CLI .apexcodecovtransformer.config.json](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/salesforce-cli/.apexcodecovtransformer.config.json), which assumes you are running the Salesforce CLI commands and specifying the `--results-dir`/`--output-dir` directory as "coverage". Update this sample with your desired output report path and format.

You can copy the sample [SFDX Hardis .apexcodecovtransformer.config.json](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/defaults/sfdx-hardis/.apexcodecovtransformer.config.json), which assumes you are running the SFDX Hardis commands. Update this sample with your desired output report path and format.

The `.apexcodecovtransformer.config.json` follows this structure:

- `deployCoverageJsonPath` is required to use the hook after deploy commands and should be the path to the code coverage JSON created by the Salesforce CLI/SFDX Hardis deploy command. Recommend using a relative path.
- `testCoverageJsonPath` is required to use the hook after test commands and should be the path to the code coverage JSON created by the Salesforce CLI/SFDX Hardis test command. Recommend using a relative path.
- `outputReportPath` is optional and should be the path to the code coverage file created by this plugin. Recommend using a relative path. If this isn't provided, it will default to `coverage.[xml/info]` in the working directory.
- `format` is optional and should be the intended coverage report format created by this plugin. If this isn't provided, it will default to "sonar".

If the `.apexcodecovtransformer.config.json` file isn't found, the hook will be skipped.

## Debugging

Any file in the coverage JSON that isn't found in any package directory will result in this warning:

```
Warning: The file name AccountTrigger was not found in any package directory.
```

Files not found in any package directory will not be added to the output coverage report. This includes Apex classes that originate from installed managed and unlocked packages when running all tests in your org.

If none of the files listed in the coverage JSON were found in a package directory, the plugin will print an additional warning stating no files were processed. In this case, the output coverage report generated will be an empty file.

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

## Contributing

Contributions are welcome! See [Contributing](https://github.com/mcarvin8/apex-code-coverage-transformer/blob/main/CONTRIBUTING.md).

## Issues

If you encounter any issues, please create an issue in the [issue tracker](https://github.com/mcarvin8/apex-code-coverage-transformer/issues). Please also create issues to suggest any new features.

## License

This project is licensed under the MIT license. Please see the [LICENSE](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md) file for details.
