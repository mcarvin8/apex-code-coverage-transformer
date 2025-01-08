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
  $ sf acc-transformer transform -j <value> -o <value> -f <value> [--json]

FLAGS
  -j, --coverage-json=<value> Path to the code coverage JSON file created by the Salesforce CLI deploy or test command.
  -o, --output-report=<value> Path to the code coverage file that will be created by this plugin.
                              [default: "coverage.[xml/info]"]
  -f, --format=<value>        Output format for the code coverage format.
                              Valid options are "sonar", "clover", "lcovonly", or "cobertura".
                              [default: "sonar"]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Transform the Apex code coverage JSON file created by the Salesforce CLI deploy and test command into SonarQube, Clover, LCovOnly, or Cobertura format.

EXAMPLES
    $ sf acc-transformer transform -j "coverage.json" -o "coverage.xml" -f "sonar"

    $ sf acc-transformer transform -j "coverage.json" -o "coverage.xml" -f "cobertura"

    $ sf acc-transformer transform -j "coverage.json" -o "coverage.xml" -f "clover"

    $ sf acc-transformer transform -j "coverage.json" -o "coverage.info" -f "lcovonly"
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
- `format` is optional and should be the intended output format for the code coverage file created by this plugin. Options are "sonar", "clover", or "cobertura". If this isn't provided, it will default to "sonar".

If the `.apexcodecovtransformer.config.json` file isn't found, the hook will be skipped.

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

This [code coverage JSON file](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/deploy_coverage_no_file_exts.json) created during a Salesforce CLI deployment will be transformed into this format for SonarQube:

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

and this format for Cobertura:

```xml
<?xml version="1.0" ?>
<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">
<coverage lines-valid="62" lines-covered="54" line-rate="0.871" branches-valid="0" branches-covered="0" branch-rate="1" timestamp="1736198880235" complexity="0" version="0.1">
  <sources>
    <source>.</source>
  </sources>
  <packages>
    <package name="main" line-rate="0.871" branch-rate="1">
      <classes>
        <class name="AccountTrigger" filename="packaged/triggers/AccountTrigger.trigger" line-rate="0.8710" branch-rate="1">
          <methods/>
          <lines>
            <line number="52" hits="0" branch="false"/>
            <line number="53" hits="0" branch="false"/>
            <line number="59" hits="0" branch="false"/>
            <line number="60" hits="0" branch="false"/>
            <line number="1" hits="1" branch="false"/>
            <line number="2" hits="1" branch="false"/>
            <line number="3" hits="1" branch="false"/>
            <line number="4" hits="1" branch="false"/>
            <line number="5" hits="1" branch="false"/>
            <line number="6" hits="1" branch="false"/>
            <line number="7" hits="1" branch="false"/>
            <line number="8" hits="1" branch="false"/>
            <line number="9" hits="1" branch="false"/>
            <line number="10" hits="1" branch="false"/>
            <line number="11" hits="1" branch="false"/>
            <line number="12" hits="1" branch="false"/>
            <line number="13" hits="1" branch="false"/>
            <line number="14" hits="1" branch="false"/>
            <line number="15" hits="1" branch="false"/>
            <line number="16" hits="1" branch="false"/>
            <line number="17" hits="1" branch="false"/>
            <line number="18" hits="1" branch="false"/>
            <line number="19" hits="1" branch="false"/>
            <line number="20" hits="1" branch="false"/>
            <line number="21" hits="1" branch="false"/>
            <line number="22" hits="1" branch="false"/>
            <line number="23" hits="1" branch="false"/>
            <line number="24" hits="1" branch="false"/>
            <line number="25" hits="1" branch="false"/>
            <line number="26" hits="1" branch="false"/>
            <line number="27" hits="1" branch="false"/>
          </lines>
        </class>
        <class name="AccountProfile" filename="force-app/main/default/classes/AccountProfile.cls" line-rate="0.8710" branch-rate="1">
          <methods/>
          <lines>
            <line number="52" hits="0" branch="false"/>
            <line number="53" hits="0" branch="false"/>
            <line number="59" hits="0" branch="false"/>
            <line number="60" hits="0" branch="false"/>
            <line number="54" hits="1" branch="false"/>
            <line number="55" hits="1" branch="false"/>
            <line number="56" hits="1" branch="false"/>
            <line number="57" hits="1" branch="false"/>
            <line number="58" hits="1" branch="false"/>
            <line number="61" hits="1" branch="false"/>
            <line number="62" hits="1" branch="false"/>
            <line number="63" hits="1" branch="false"/>
            <line number="64" hits="1" branch="false"/>
            <line number="65" hits="1" branch="false"/>
            <line number="66" hits="1" branch="false"/>
            <line number="67" hits="1" branch="false"/>
            <line number="68" hits="1" branch="false"/>
            <line number="69" hits="1" branch="false"/>
            <line number="70" hits="1" branch="false"/>
            <line number="71" hits="1" branch="false"/>
            <line number="72" hits="1" branch="false"/>
            <line number="1" hits="1" branch="false"/>
            <line number="2" hits="1" branch="false"/>
            <line number="3" hits="1" branch="false"/>
            <line number="4" hits="1" branch="false"/>
            <line number="5" hits="1" branch="false"/>
            <line number="6" hits="1" branch="false"/>
            <line number="7" hits="1" branch="false"/>
            <line number="8" hits="1" branch="false"/>
            <line number="9" hits="1" branch="false"/>
            <line number="10" hits="1" branch="false"/>
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
```

and this format for Clover:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<coverage generated="1736198880331" clover="3.2.0">
  <project timestamp="1736198880331" name="All files">
    <metrics statements="62" coveredstatements="54" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0" elements="62" coveredelements="54" complexity="0" loc="62" ncloc="62" packages="1" files="2" classes="2"/>
    <file name="AccountTrigger" path="packaged/triggers/AccountTrigger.trigger">
      <metrics statements="31" coveredstatements="27" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
      <line num="52" count="0" type="stmt"/>
      <line num="53" count="0" type="stmt"/>
      <line num="59" count="0" type="stmt"/>
      <line num="60" count="0" type="stmt"/>
      <line num="1" count="1" type="stmt"/>
      <line num="2" count="1" type="stmt"/>
      <line num="3" count="1" type="stmt"/>
      <line num="4" count="1" type="stmt"/>
      <line num="5" count="1" type="stmt"/>
      <line num="6" count="1" type="stmt"/>
      <line num="7" count="1" type="stmt"/>
      <line num="8" count="1" type="stmt"/>
      <line num="9" count="1" type="stmt"/>
      <line num="10" count="1" type="stmt"/>
      <line num="11" count="1" type="stmt"/>
      <line num="12" count="1" type="stmt"/>
      <line num="13" count="1" type="stmt"/>
      <line num="14" count="1" type="stmt"/>
      <line num="15" count="1" type="stmt"/>
      <line num="16" count="1" type="stmt"/>
      <line num="17" count="1" type="stmt"/>
      <line num="18" count="1" type="stmt"/>
      <line num="19" count="1" type="stmt"/>
      <line num="20" count="1" type="stmt"/>
      <line num="21" count="1" type="stmt"/>
      <line num="22" count="1" type="stmt"/>
      <line num="23" count="1" type="stmt"/>
      <line num="24" count="1" type="stmt"/>
      <line num="25" count="1" type="stmt"/>
      <line num="26" count="1" type="stmt"/>
      <line num="27" count="1" type="stmt"/>
    </file>
    <file name="AccountProfile" path="force-app/main/default/classes/AccountProfile.cls">
      <metrics statements="31" coveredstatements="27" conditionals="0" coveredconditionals="0" methods="0" coveredmethods="0"/>
      <line num="52" count="0" type="stmt"/>
      <line num="53" count="0" type="stmt"/>
      <line num="59" count="0" type="stmt"/>
      <line num="60" count="0" type="stmt"/>
      <line num="54" count="1" type="stmt"/>
      <line num="55" count="1" type="stmt"/>
      <line num="56" count="1" type="stmt"/>
      <line num="57" count="1" type="stmt"/>
      <line num="58" count="1" type="stmt"/>
      <line num="61" count="1" type="stmt"/>
      <line num="62" count="1" type="stmt"/>
      <line num="63" count="1" type="stmt"/>
      <line num="64" count="1" type="stmt"/>
      <line num="65" count="1" type="stmt"/>
      <line num="66" count="1" type="stmt"/>
      <line num="67" count="1" type="stmt"/>
      <line num="68" count="1" type="stmt"/>
      <line num="69" count="1" type="stmt"/>
      <line num="70" count="1" type="stmt"/>
      <line num="71" count="1" type="stmt"/>
      <line num="72" count="1" type="stmt"/>
      <line num="1" count="1" type="stmt"/>
      <line num="2" count="1" type="stmt"/>
      <line num="3" count="1" type="stmt"/>
      <line num="4" count="1" type="stmt"/>
      <line num="5" count="1" type="stmt"/>
      <line num="6" count="1" type="stmt"/>
      <line num="7" count="1" type="stmt"/>
      <line num="8" count="1" type="stmt"/>
      <line num="9" count="1" type="stmt"/>
      <line num="10" count="1" type="stmt"/>
    </file>
  </project>
</coverage>
```

and this format for LCovOnly:

```info
TN:
SF:packaged/triggers/AccountTrigger.trigger
FNF:0
FNH:0
DA:52,0
DA:53,0
DA:59,0
DA:60,0
DA:1,1
DA:2,1
DA:3,1
DA:4,1
DA:5,1
DA:6,1
DA:7,1
DA:8,1
DA:9,1
DA:10,1
DA:11,1
DA:12,1
DA:13,1
DA:14,1
DA:15,1
DA:16,1
DA:17,1
DA:18,1
DA:19,1
DA:20,1
DA:21,1
DA:22,1
DA:23,1
DA:24,1
DA:25,1
DA:26,1
DA:27,1
LF:31
LH:27
BRF:0
BRH:0
end_of_record
TN:
SF:force-app/main/default/classes/AccountProfile.cls
FNF:0
FNH:0
DA:52,0
DA:53,0
DA:59,0
DA:60,0
DA:54,1
DA:55,1
DA:56,1
DA:57,1
DA:58,1
DA:61,1
DA:62,1
DA:63,1
DA:64,1
DA:65,1
DA:66,1
DA:67,1
DA:68,1
DA:69,1
DA:70,1
DA:71,1
DA:72,1
DA:1,1
DA:2,1
DA:3,1
DA:4,1
DA:5,1
DA:6,1
DA:7,1
DA:8,1
DA:9,1
DA:10,1
LF:31
LH:27
BRF:0
BRH:0
end_of_record
```

## Issues

If you encounter any issues, please create an issue in the repository's [issue tracker](https://github.com/mcarvin8/apex-code-coverage-transformer/issues). Please also create issues to suggest any new features.

## License

This project is licensed under the MIT license. Please see the [LICENSE](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md) file for details.
