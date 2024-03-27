# Apex Code Coverage Transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer) [![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)

The `apex-code-coverage-transformer` is a simple Salesforce CLI plugin to transform the Apex Code Coverage JSON file into Generic Test Coverage Format (XML). This format is accepted by static code analysis tools like SonarQube.

This plugin supports code coverage metrics created for Apex Classes and Apex Triggers. This also supports multiple package directories as listed in your project's `sfdx-project.json` configuration, assuming unique file-names are used in your package directories.

To create the code coverage JSON during a Salesforce CLI deployment/validation, append `--coverage-formatters json --results-dir coverage` to the `sf project deploy` command:

```
sf project deploy validate -x manifest/package.xml -l RunSpecifiedTests -t {testclasses} --verbose --coverage-formatters json --results-dir coverage
```

This will create a coverage JSON in this relative path - `coverage/coverage/coverage.json`

This JSON isn't accepted by SonarQube automatically and needs to be converted using this plugin.

**Disclaimer**: Due to existing bugs with how the Salesforce CLI reports `covered` lines (see [5511](https://github.com/forcedotcom/salesforcedx-vscode/issues/5511) and [1568](https://github.com/forcedotcom/cli/issues/1568)), to add support for `covered` lines in this plugin, I had to add a function to re-number out-of-range `covered` lines the CLI may report (ex: line 100 in a 98-line Apex Class is reported back as `covered` by the Salesforce CLI deploy command). Once Salesforce updates the API to correctly return `covered` lines in the deploy command, this function will be removed.

## Install

```bash
sf plugins install apex-code-coverage-transformer@x.y.z
```

## Commands

The `apex-code-coverage-transformer` has 1 command:

- `sf apex-code-coverage transformer transform`

Recommend running this command in the same directory that your `sfdx-project.json` file is located in. This command will use the `packageDirectories` in the JSON file to set the file-paths in the coverage file.

## `sf apex-code-coverage transformer transform`

```
USAGE
  $ sf apex-code-coverage transformer transform -j <value> -x <value> -c <value> [--json]

FLAGS
  -j, --coverage-json=<value> The path to the JSON file created by the Salesforce CLI for code coverage.
  -x, --xml=<value> [default: coverage.xml] Output path for the XML file created by this plugin
  -c, --sfdx-configuration=<value> [default: 'sfdx-project.json' in the current working directory] The path to your Salesforce DX configuration file, 'sfdx-project.json'.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  This plugin will convert the JSON file created by the Salesforce CLI during Apex deployments into the Generic Test Coverage Format.

EXAMPLES
    $ apex-code-coverage transformer transform -j "test.json" -x "coverage.xml" -c "sfdx-project.json"
```

## Errors and Warnings

Any file in the coverage JSON that isn't found in any package directory will result in this warning:

```
Warning: The file name AccountTrigger was not found in any package directory.
```

Files not found in any package directory will not be added to the coverage XML.

If none of the files listed in the coverage JSON were found in a package directory, the plugin will fail with this error in addition to the above warnings:

```
Warning: The file name AccountTrigger was not found in any package directory.
Warning: The file name AccountProfile was not found in any package directory.
Warning: The file name Get_Info was not found in any package directory.
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

This [code coverage JSON file](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/test/coverage_no_file_exts.json) created by the Salesforce CLI will be transformed into:

```xml
<?xml version="1.0"?>
<coverage version="1">
	<file path="packaged\triggers\AccountTrigger.trigger">
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
	<file path="force-app\main\default\classes\AccountProfile.cls">
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
