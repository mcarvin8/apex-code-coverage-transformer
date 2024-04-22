# Apex Code Coverage Transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer) [![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)

The `apex-code-coverage-transformer` is a Salesforce CLI plugin to transform the Apex Code Coverage JSON files created during deployments into the Generic Test Coverage Format (XML). This format is accepted by static code analysis tools like SonarQube.

This plugin supports code coverage metrics created for Apex Classes and Apex Triggers. This also supports multiple package directories as listed in your project's `sfdx-project.json` configuration, assuming unique file-names are used in your package directories.

This plugin is intended for users who deploy their Apex codebase from a git-based repository and use SonarQube for code quality. This plugin will work if you run local tests or run all tests in an org, including tests that originate from installed managed and unlocked packages. SonarQube relies on file-paths to map code coverage to the files in their file explorer interface. Since files from managed and unlocked packages aren't retrieved into git-based Salesforce repositories, these files cannot be included in your SonarQube scans. If your Apex code coverage JSON output includes managed/unlocked package files, they will not be added to the coverage XML created by this plugin. A warning will be printed for each file not found in a package directory in your git repository. See [Errors and Warnings](https://github.com/mcarvin8/apex-code-coverage-transformer?tab=readme-ov-file#errors-and-warnings) for more information.

To create the code coverage JSON during a Salesforce CLI deployment/validation, append `--coverage-formatters json --results-dir coverage` to the `sf project deploy` command:

```
sf project deploy [start/validate] -x manifest/package.xml -l RunSpecifiedTests -t {testclasses} --verbose --coverage-formatters json --results-dir coverage
```

This will create a coverage JSON in this relative path - `coverage/coverage/coverage.json`

This JSON isn't accepted by SonarQube automatically for git-based Salesforce repositories and needs to be converted using this plugin.

**Disclaimer**: Due to existing bugs with how the Salesforce CLI reports covered lines (see [5511](https://github.com/forcedotcom/salesforcedx-vscode/issues/5511) and [1568](https://github.com/forcedotcom/cli/issues/1568)), to add support for covered lines in this plugin, I had to add a function to re-number out-of-range covered lines the CLI may report (ex: line 100 in a 98-line Apex Class is reported back as covered by the Salesforce CLI deploy command). Salesforce's coverage result may also include extra lines as covered (ex: 120 lines are included in the coverage report for a 100 line file), so the coverage percentage may vary based on how many lines the API returns in the coverage report. Once Salesforce fixes the API to correctly return covered lines in the deploy command, this function will be removed.

## Install

```bash
sf plugins install apex-code-coverage-transformer@x.y.z
```

## Command

The `apex-code-coverage-transformer` has 1 command:

- `sf apex-code-coverage transformer transform`

I recommend running this command in the repository's root folder where your `sfdx-project.json` file is located, but the command will work if you supply a different path for the `--sfdx-configuration`/`-c` flag. This command will use the parent directory of the `sfdx-project.json` file found via the `-c` flag to locate the package directories listed.

## `sf apex-code-coverage transformer transform`

```
USAGE
  $ sf apex-code-coverage transformer transform -j <value> -x <value> -c <value> [--json]

FLAGS
  -j, --coverage-json=<value> Path to the code coverage JSON file created by the Salesforce CLI deployment command.
  -x, --xml=<value> [default: coverage.xml] Path to code coverage XML file that will be created by this plugin.
  -c, --sfdx-configuration=<value> [default: 'sfdx-project.json'] Path to your project's Salesforce DX configuration file.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  This plugin will convert the code coverage JSON file created by the Salesforce CLI during Apex deployments into an XML accepted by tools like SonarQube.

EXAMPLES
    $ sf apex-code-coverage transformer transform -j "coverage.json" -x "coverage.xml" -c "sfdx-project.json"
```

## Errors and Warnings

Any file in the coverage JSON that isn't found in any package directory will result in this warning:

```
Warning: The file name AccountTrigger was not found in any package directory.
```

Files not found in any package directory will not be added to the coverage XML. This includes Apex classes that originate from installed managed and unlocked packages when running all tests in your org.

If none of the files listed in the coverage JSON were found in a package directory, the plugin will fail with this error in addition to the above warnings:

```
Warning: The file name AccountTrigger was not found in any package directory.
Warning: The file name AccountProfile was not found in any package directory.
Error (1): None of the files listed in the coverage JSON were processed.
```

If the `sfdx-project.json` file was not found, the plugin will fail with:

```
Error (1): Salesforce DX Config File does not exist in this path: {filePath}
```

Any ENOENT failures indicate that the plugin had issues finding one of the package directories in the `sfdx-project.json` file:

```
Error (1): ENOENT: no such file or directory: {packageDirPath}
```

## Example

This [code coverage JSON file](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/coverage_no_file_exts.json) created during a Salesforce CLI deployment will be transformed into:

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
