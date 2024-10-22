# Apex Code Coverage Transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer) [![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)

The `apex-code-coverage-transformer` is a Salesforce CLI plugin to transform the Apex Code Coverage JSON files created during deployments and test runs into the Generic Test Coverage Format (XML). This format is accepted by static code analysis tools like SonarQube.

This plugin supports code coverage metrics created for Apex Classes and Apex Triggers. This also supports multiple package directories as listed in your project's `sfdx-project.json` configuration, assuming unique file-names are used in your package directories.

This plugin is intended for users who deploy their Apex codebase from a git-based repository and use SonarQube for code quality. This plugin will work if you run local tests or run all tests in an org, including tests that originate from installed managed and unlocked packages. SonarQube relies on file-paths to map code coverage to the files in their file explorer interface. Since files from managed and unlocked packages aren't retrieved into git-based Salesforce repositories, these files cannot be included in your SonarQube scans. If your Apex code coverage JSON output includes managed/unlocked package files, they will not be added to the coverage XML created by this plugin. A warning will be printed for each file not found in a package directory in your git repository. See [Errors and Warnings](https://github.com/mcarvin8/apex-code-coverage-transformer?tab=readme-ov-file#errors-and-warnings) for more information.

To create the code coverage JSON during a Salesforce CLI deployment/validation, append `--coverage-formatters json --results-dir "coverage"` to the `sf project deploy` command. This will create a coverage JSON in this relative path - `coverage/coverage/coverage.json`.

```
sf project deploy [start/validate] --coverage-formatters json --results-dir "coverage"
```

To create the code coverage JSON when running tests directly in the org, append `--code-coverage --result-format json --output-dir "coverage"` to the `sf apex run test` or `sf apex get test` command. This will create the code coverage JSON in the a folder named "coverage".

```
sf apex run test --code-coverage --result-format json --output-dir "coverage"
sf apex get test --test-run-id <test run id> --code-coverage --result-format json --output-dir "coverage"
```

The code coverage JSONs created by the Salesforce CLI aren't accepted by SonarQube automatically for git-based Salesforce repositories and needs to be converted using this plugin.

**Disclaimer**: Due to existing bugs with how the Salesforce CLI reports covered lines during deployments (see [5511](https://github.com/forcedotcom/salesforcedx-vscode/issues/5511) and [1568](https://github.com/forcedotcom/cli/issues/1568)), to add support for covered lines in this plugin for deployment coverage files, I had to add a function to re-number out-of-range covered lines the CLI may report (ex: line 100 in a 98-line Apex Class is reported back as covered by the Salesforce CLI deploy command). Salesforce's coverage result may also include extra lines as covered (ex: 120 lines are included in the coverage report for a 100 line file), so the coverage percentage may vary based on how many lines the API returns in the coverage report. Once Salesforce fixes the API to correctly return covered lines in the deploy command, this function will be removed.

## Install

```bash
sf plugins install apex-code-coverage-transformer@x.y.z
```

## Command

The `apex-code-coverage-transformer` has 1 command:

- `sf acc-transformer transform`

This command needs to be ran somewhere inside your Salesforce DX git repository, whether in the root folder (recommended) or in a subfolder. This plugin will determine the root folder of this repository and read the `sfdx-project.json` file in the root folder. All package directories listed in the `sfdx-project.json` file will be processed when running this plugin.

## `sf acc-transformer transform`

```
USAGE
  $ sf acc-transformer transform -j <value> -x <value> [--json]

FLAGS
  -j, --coverage-json=<value> Path to the code coverage JSON file created by the Salesforce CLI deployment or test command.
  -x, --xml=<value> [default: "coverage.xml"] Path to code coverage XML file that will be created by this plugin.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  This plugin will convert the code coverage JSON file created by the Salesforce CLI during Apex deployments and test runs into an XML accepted by tools like SonarQube.

EXAMPLES
    $ sf acc-transformer transform -j "coverage.json" -x "coverage.xml"
```

## Hook

A post-run hook has been configured if you elect to use it.

The post-run hook will automatically transform the code coverage JSON file into a generic test coverage report XML after every Salesforce CLI deployment (`sf project deploy start`, `sf project deploy validate`, `sf project deploy report`, `sf project deploy resume` commands) and test run (`sf apex run test` and `sf apex get test` commands) if the JSON is found.

The hook requires you to create this file in the root of your repo: `.apexcodecovtransformer.config.json`

The `.apexcodecovtransformer.config.json` should look like this:

```json
{
  "deployCoverageJsonPath": "coverage/coverage/coverage.json",
  "testCoverageJsonPath": "coverage/test-coverage.json",
  "coverageXmlPath": "coverage.xml"
}
```

- `deployCoverageJsonPath` is required to use the hook after deployments and should be the path to the code coverage JSON created by the Salesforce CLI deployment command. Recommend using a relative path.
- `testCoverageJsonPath` is required to use the hook after test runs and should be the path to the code coverage JSON created by the Salesforce CLI test command. Recommend using a relative path.
- `coverageXmlPath` is optional and should be the path to the code coverage XML created by this plugin. Recommend using a relative path. If this isn't provided, it will default to `coverage.xml` in the working directory.

If the `.apexcodecovtransformer.config.json` file isn't found, the hook will be skipped.

## Errors and Warnings

Any file in the coverage JSON that isn't found in any package directory will result in this warning:

```
Warning: The file name AccountTrigger was not found in any package directory.
```

Files not found in any package directory will not be added to the coverage XML. This includes Apex classes that originate from installed managed and unlocked packages when running all tests in your org.

If none of the files listed in the coverage JSON were found in a package directory, the plugin will print an additional warning stating no files were processed. In this case, the coverage XML generated will be an empty file.

```
Warning: The file name AccountTrigger was not found in any package directory.
Warning: The file name AccountProfile was not found in any package directory.
Warning: None of the files listed in the coverage JSON were processed. The coverage XML will be empty.
```

The code coverage JSON files created by the Salesforce CLI deployment commands follow a different format than the format created by the test commands. If the code coverage JSON file does not match one of the 2 expected coverage data types, the plugin will fail with:

```
Error (1): The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.
```

If the `sfdx-project.json` file was not found in your repository's root folder, the plugin will fail with:

```
Error (1): Salesforce DX Config File does not exist in this path: {filePath}
```

Any ENOENT failures indicate that the plugin had issues finding one of the package directories in the `sfdx-project.json` file:

```
Error (1): ENOENT: no such file or directory: {packageDirPath}
```

## Example

This [code coverage JSON file](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/deploy_coverage_no_file_exts.json) created during a Salesforce CLI deployment will be transformed into:

```xml
<?xml version="1.0"?>
<coverage version="1">
  <file path="packaged/triggers/AccountTrigger.trigger">
    <lineToCover lineNumber="52" covered="false"/>
    <lineToCover lineNumber="53" covered="false"/>
    <lineToCover lineNumber="59" covered="false"/>
    <lineToCover lineNumber="60" covered="false"/>
    <lineToCover lineNumber="1" covered="true"/>
    <lineToCover lineNumber="2" covered="true"/>
    <lineToCover lineNumber="3" covered="true"/>
    <lineToCover lineNumber="4" covered="true"/>
    <lineToCover lineNumber="5" covered="true"/>
    <lineToCover lineNumber="6" covered="true"/>
    <lineToCover lineNumber="7" covered="true"/>
    <lineToCover lineNumber="8" covered="true"/>
    <lineToCover lineNumber="9" covered="true"/>
    <lineToCover lineNumber="10" covered="true"/>
    <lineToCover lineNumber="11" covered="true"/>
    <lineToCover lineNumber="12" covered="true"/>
    <lineToCover lineNumber="13" covered="true"/>
    <lineToCover lineNumber="14" covered="true"/>
    <lineToCover lineNumber="15" covered="true"/>
    <lineToCover lineNumber="16" covered="true"/>
    <lineToCover lineNumber="17" covered="true"/>
    <lineToCover lineNumber="18" covered="true"/>
    <lineToCover lineNumber="19" covered="true"/>
    <lineToCover lineNumber="20" covered="true"/>
    <lineToCover lineNumber="21" covered="true"/>
    <lineToCover lineNumber="22" covered="true"/>
    <lineToCover lineNumber="23" covered="true"/>
    <lineToCover lineNumber="24" covered="true"/>
    <lineToCover lineNumber="25" covered="true"/>
    <lineToCover lineNumber="26" covered="true"/>
    <lineToCover lineNumber="27" covered="true"/>
  </file>
  <file path="force-app/main/default/classes/AccountProfile.cls">
    <lineToCover lineNumber="52" covered="false"/>
    <lineToCover lineNumber="53" covered="false"/>
    <lineToCover lineNumber="59" covered="false"/>
    <lineToCover lineNumber="60" covered="false"/>
    <lineToCover lineNumber="54" covered="true"/>
    <lineToCover lineNumber="55" covered="true"/>
    <lineToCover lineNumber="56" covered="true"/>
    <lineToCover lineNumber="57" covered="true"/>
    <lineToCover lineNumber="58" covered="true"/>
    <lineToCover lineNumber="61" covered="true"/>
    <lineToCover lineNumber="62" covered="true"/>
    <lineToCover lineNumber="63" covered="true"/>
    <lineToCover lineNumber="64" covered="true"/>
    <lineToCover lineNumber="65" covered="true"/>
    <lineToCover lineNumber="66" covered="true"/>
    <lineToCover lineNumber="67" covered="true"/>
    <lineToCover lineNumber="68" covered="true"/>
    <lineToCover lineNumber="69" covered="true"/>
    <lineToCover lineNumber="70" covered="true"/>
    <lineToCover lineNumber="71" covered="true"/>
    <lineToCover lineNumber="72" covered="true"/>
    <lineToCover lineNumber="1" covered="true"/>
    <lineToCover lineNumber="2" covered="true"/>
    <lineToCover lineNumber="3" covered="true"/>
    <lineToCover lineNumber="4" covered="true"/>
    <lineToCover lineNumber="5" covered="true"/>
    <lineToCover lineNumber="6" covered="true"/>
    <lineToCover lineNumber="7" covered="true"/>
    <lineToCover lineNumber="8" covered="true"/>
    <lineToCover lineNumber="9" covered="true"/>
    <lineToCover lineNumber="10" covered="true"/>
  </file>
</coverage>
```
