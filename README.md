# Apex Code Coverage Transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer) [![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)

The `apex-code-coverage-transformer` is a simple plugin to transform the JSON file for Apex Code Coverage into Generic Test Coverage Format (XML). This format is accepted by static code analysis tools like SonarQube.

Here is how you can create the JSON file with the Salesforce CLI:

```
sf project deploy validate -x manifest/package.xml -l RunSpecifiedTests -t {testclasses} --verbose --coverage-formatters json --results-dir coverage
```

This will create a coverage JSON in this relative path - `coverage/coverage/coverage.json`

This JSON isn't accepted by SonarQube automatically and needs to be converted using this plugin.

## Install

```bash
sf plugins install apex-code-coverage-transformer@x.y.z
```

## Commands

The `apex-code-coverage-transformer` has 1 command:

- `sf apex-code-coverage transformer transform`

## `sf apex-code-coverage transformer transform`

```
USAGE
  $ sf apex-code-coverage transformer transform -j <value> -x <value> -d <value> [--json]

FLAGS
  -j, --coverage-json=<value> The path to the JSON file created by the Salesforce CLI for code coverage.
  -x, --xml=<value> [default: coverage.xml] Output path for the XML file created by this plugin
  -d, --dx-directory=<value> [default: force-app/main/default] The root directory containing your Salesforce metadata.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  This plugin will convert the JSON file created by the Salesforce CLI during Apex deployments into the Generic Test Coverage Format.

EXAMPLES
    $ apex-code-coverage transformer transform -j "test.json" -x "coverage.xml" -d "force-app/main/default"
```
