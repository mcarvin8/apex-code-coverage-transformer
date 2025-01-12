# Apex Code Coverage Transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer) [![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

- [Install](#install)
- [Who is the Plugin For?](#who-is-the-plugin-for)
- [Creating Code Coverage Files with the Salesforce CLI](#creating-code-coverage-files-with-the-salesforce-cli)
- [What this Plugin fixes in the Salesforce CLI Coverage Reports](#what-this-plugin-fixes-in-the-salesforce-cli-coverage-reports)
- [Command](#command)
  - [`sf acc-transformer transform`](#sf-acc-transformer-transform)
- [Hook](#hook)
- [Errors and Warnings](#errors-and-warnings)
- [Example](#example)
- [Issues](#issues)
- [License](#license)
</details>

A Salesforce CLI plugin to transform the Apex code coverage JSON files created during deployments and test runs into SonarQube, Cobertura, LCovOnly, or Clover format.

## Install

```bash
sf plugins install apex-code-coverage-transformer@x.y.z
```

## Who is the Plugin For?

This plugin is intended for users who deploy their Apex codebase (Apex classes and triggers) from any Salesforce DX repository (`sfdx-project.json` file), not just git-based ones. You should be running this plugin somewhere inside your Salesforce DX repository (root folder preferred). This plugin searches for your repository's `sfdx-project.json` file to know which package directories to search into. The Apex files must be found in one of your package directories.

This plugin will work if you run local tests or run all tests in an org, including tests that originate from installed managed and unlocked packages. Since files from managed and unlocked packages aren't retrieved into Salesforce DX repositories, these files cannot be included in your code coverage reports.

When the plugin is unable to find the Apex file from the Salesforce CLI coverage report in your repository, it will print a warning and not add that file's coverage data to the coverage report created by this plugin. A warning will be printed for each file not found in a package directory in your repository. See [Errors and Warnings](https://github.com/mcarvin8/apex-code-coverage-transformer?tab=readme-ov-file#errors-and-warnings) for more information.

## Creating Code Coverage Files with the Salesforce CLI

**This tool will only support the "json" coverage format from the Salesforce CLI. Do not use the "json-summary", "clover", "lcovonly", or "cobertura" format from the Salesforce CLI.**

To create the code coverage JSON when deploying or validating, append `--coverage-formatters json --results-dir "coverage"` to the `sf project deploy` command. This will create a coverage JSON in this relative path - `coverage/coverage/coverage.json`.

```
sf project deploy [start/validate] --coverage-formatters json --results-dir "coverage"
```

To create the code coverage JSON when running tests directly in the org, append `--code-coverage --result-format json --output-dir "coverage"` to the `sf apex run test` or `sf apex get test` command. This will create the code coverage JSON in a folder named "coverage".

```
sf apex run test --code-coverage --result-format json --output-dir "coverage"
sf apex get test --test-run-id <test run id> --code-coverage --result-format json --output-dir "coverage"
```

The code coverage JSONs created by the Salesforce CLI aren't accepted automatically for Salesforce DX repositories and needs to be converted using this plugin.

## What this Plugin fixes in the Salesforce CLI Coverage Reports

1. The coverage reports created by this plugin will add correct file-paths per your Salesforce DX repository. Salesforce CLI coverage reports have the `no-map/` prefix hard-coded into their coverage reports. The coverage report created in this plugin will only contain Apex coverage results against files found in your Salesforce DX repository, allowing you to use these reports in external code quality tools like SonarQube.
2. Normalizes the coverage reports created by the Salesforce CLI deploy and test command. The coverage reports created by both CLI commands follow different formats and have different coverage format options. These differences cause issues when trying to have external tools like SonarQube parse the coverage reports. This plugin handles parsing both command coverage reports and converting them into common formats accepted by external tools like SonarQube and GitLab.
3. The coverage reports created by this plugin "fixes" an issue with Salesforce CLI deploy command coverage reports. The coverage reports created by the deploy command contains several inaccuracies in their covered lines.
   1. Salesforce's deploy covered report may report out-of-range lines as "covered", i.e. line 100 in a 98-line apex class is reported as "covered".
   2. Salesforce's deploy covered report may report extra lines than the total lines in the apex class, i.e. 120 lines are included in the deploy coverage report for a 100-line apex class.
   3. The coverage percentage may vary based on how many lines the API returns in the original deploy coverage report.
   4. I had to add a re-numbering function to this plugin to work-around these inaccuracies and ensure the transformed coverage reports are accepted by external tools like SonarQube.
   5. Once the Salesforce server team fixes the API to correctly return coverage in deploy command reports, I will remove this re-numbering function in this plugin.
   6. See issues [5511](https://github.com/forcedotcom/salesforcedx-vscode/issues/5511) and [1568](https://github.com/forcedotcom/cli/issues/1568).
   7. **NOTE**: This does not affect coverage reports created by the Salesforce CLI test commands.

## Command

The `apex-code-coverage-transformer` has 1 command:

- `sf acc-transformer transform`

## `sf acc-transformer transform`

```
USAGE
  $ sf acc-transformer transform -j <value> -r <value> -f <value> [--json]

FLAGS
  -j, --coverage-json=<value> Path to the code coverage JSON file created by the Salesforce CLI deploy or test command.
  -r, --output-report=<value> Path to the code coverage file that will be created by this plugin.
                              [default: "coverage.[xml/info]"]
  -f, --format=<value>        Output format for the code coverage format.
                              Valid options are "sonar", "clover", "lcovonly", or "cobertura".
                              [default: "sonar"]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Transform the Apex code coverage JSON file created by the Salesforce CLI deploy and test command into SonarQube, Clover, LCovOnly, or Cobertura format.

EXAMPLES
    $ sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "sonar"

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "cobertura"

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "clover"

    $ sf acc-transformer transform -j "coverage.json" -r "coverage.info" -f "lcovonly"
```

## Hook

A post-run hook has been configured if you elect to use it.

The post-run hook will automatically transform the code coverage JSON file after every Salesforce CLI deployment (`sf project deploy start`, `sf project deploy validate`, `sf project deploy report`, `sf project deploy resume` commands) and test run (`sf apex run test` and `sf apex get test` commands) if the JSON is found.

The hook requires you to create this file in the root of your repo: `.apexcodecovtransformer.config.json`

The `.apexcodecovtransformer.config.json` should look like this:

```json
{
  "deployCoverageJsonPath": "coverage/coverage/coverage.json",
  "testCoverageJsonPath": "coverage/test-coverage.json",
  "outputReportPath": "coverage.xml",
  "format": "sonar"
}
```

- `deployCoverageJsonPath` is required to use the hook after deployments and should be the path to the code coverage JSON created by the Salesforce CLI deployment command. Recommend using a relative path.
- `testCoverageJsonPath` is required to use the hook after test runs and should be the path to the code coverage JSON created by the Salesforce CLI test command. Recommend using a relative path.
- `outputReportPath` is optional and should be the path to the code coverage file created by this plugin. Recommend using a relative path. If this isn't provided, it will default to `coverage.[xml/info]` in the working directory.
- `format` is optional and should be the intended output format for the code coverage file created by this plugin. Options are "sonar", "clover", "lcovonly", or "cobertura". If this isn't provided, it will default to "sonar".

If the `.apexcodecovtransformer.config.json` file isn't found, the hook will be skipped.

The post-run hook can also run after the [sfdx-hardis](https://github.com/hardisgroupcom/sfdx-hardis) commands `hardis:project:deploy:smart` (only if `COVERAGE_FORMATTER_JSON=true` environment variable is defined) and `hardis:org:test:apex` assuming you:

- Install both plugins, apex-code-coverage-transformer and sfdx-hardis, with the Salesforce CLI
- Create the `.apexcodecovtransformer.config.json` file in the root of your repo
- Set `deployCoverageJsonPath` and `testCoverageJsonPath` in `.apexcodecovtransformer.config.json` to `hardis-report/apex-coverage-results.json`

Since sfdx-hardis invokes Salesforce CLI commands, the hooks will fire twice per hardis command, once after the Salesforce CLI command and once after the sfdx-hardis command. The hook will end early without errors after the Salesforce CLI command and will run successfully after the sfdx-hardis command assuming the hardis report is found.

## Errors and Warnings

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

The code coverage JSON files created by the Salesforce CLI deployment commands follow a different format than the code coverage files created by the test commands. If the code coverage JSON file provided does not match one of the 2 expected coverage data types, the plugin will fail with:

```
Error (1): The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.
```

If the `sfdx-project.json` file was not found in your repository's root folder, the plugin will fail with:

```
Error (1): sfdx-project.json not found in any parent directory.
```

Any ENOENT failures indicate that the plugin had issues finding one of the package directories in the `sfdx-project.json` file:

```
Error (1): ENOENT: no such file or directory: {packageDirPath}
```

## Example

This [code coverage JSON file](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/deploy_coverage_no_file_exts.json) created during a Salesforce CLI deployment can be transformed into:

- [SonarQube format](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/deploy_coverage_baseline_sonar.xml)
- [Cobertura format](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/deploy_coverage_baseline_cobertura.xml)
- [Clover format](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/deploy_coverage_baseline_clover.xml)
- [LCovOnly format](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/deploy_coverage_baseline_lcov.info)

## Issues

If you encounter any issues, please create an issue in the repository's [issue tracker](https://github.com/mcarvin8/apex-code-coverage-transformer/issues). Please also create issues to suggest any new features.

## License

This project is licensed under the MIT license. Please see the [LICENSE](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md) file for details.
