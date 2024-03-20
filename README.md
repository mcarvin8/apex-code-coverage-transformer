# Apex Code Coverage Transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer) [![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)

The `apex-code-coverage-transformer` is a simple Salesforce CLI plugin to transform the Apex Code Coverage JSON file into Generic Test Coverage Format (XML). This format is accepted by static code analysis tools like SonarQube.

This plugin supports code coverage metrics created for Apex Classes, Apex Triggers, and Flows (if flows are deployed as active in your org). This also supports multiple package directories as listed in your project's `sfdx-project.json` configuration, assuming unique file-names are used in your package directories.

To create the code coverage JSON during a Salesforce CLI deployment/validation, append `--coverage-formatters json --results-dir coverage` to the `sf project deploy` command:

```
sf project deploy validate -x manifest/package.xml -l RunSpecifiedTests -t {testclasses} --verbose --coverage-formatters json --results-dir coverage
```

This will create a coverage JSON in this relative path - `coverage/coverage/coverage.json`

This JSON isn't accepted by SonarQube automatically and needs to be converted using this plugin.

**Note**: This has been tested and confirmed on code which meets 100% coverage.

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

## Example

This [code coverage JSON file](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/coverage_no_file_exts.json) created by the Salesforce CLI will be transformed into:

```xml
<?xml version="1.0"?>
<coverage version="1">
	<file path="force-app\main\default\triggers\AccountTrigger.trigger">
		<lineToCover lineNumber="52" covered="false"/>
		<lineToCover lineNumber="53" covered="false"/>
		<lineToCover lineNumber="59" covered="false"/>
		<lineToCover lineNumber="60" covered="false"/>
	</file>
	<file path="force-app\main\default\classes\AccountProfile.cls">
		<lineToCover lineNumber="52" covered="false"/>
		<lineToCover lineNumber="53" covered="false"/>
		<lineToCover lineNumber="59" covered="false"/>
		<lineToCover lineNumber="60" covered="false"/>
	</file>
	<file path="force-app\main\default\flows\Get_Info.flow-meta.xml">
		<lineToCover lineNumber="52" covered="false"/>
		<lineToCover lineNumber="53" covered="false"/>
		<lineToCover lineNumber="59" covered="false"/>
		<lineToCover lineNumber="60" covered="false"/>
	</file>
</coverage>
```
