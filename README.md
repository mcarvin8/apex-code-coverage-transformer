# Apex Code Coverage Transformer

[![NPM](https://img.shields.io/npm/v/apex-code-coverage-transformer.svg?label=apex-code-coverage-transformer)](https://www.npmjs.com/package/apex-code-coverage-transformer) [![Downloads/week](https://img.shields.io/npm/dw/apex-code-coverage-transformer.svg)](https://npmjs.org/package/apex-code-coverage-transformer) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-code-coverage-transformer/main/LICENSE.md)

The `apex-code-coverage-transformer` is a simple Salesforce CLI plugin to transform the Apex Code Coverage JSON file into Generic Test Coverage Format (XML). This format is accepted by static code analysis tools like SonarQube.

This plugin supports code coverage metrics created for Apex Classes, Apex Triggers, and Flows (if flows are deployed as active in your org).

To create the code coverage JSON during a Salesforce CLI deployment/validation, append `--coverage-formatters json --results-dir coverage` to the `sf project deploy` command:

```
sf project deploy validate -x manifest/package.xml -l RunSpecifiedTests -t {testclasses} --verbose --coverage-formatters json --results-dir coverage
```

This will create a coverage JSON in this relative path - `coverage/coverage/coverage.json`

This JSON isn't accepted by SonarQube automatically and needs to be converted using this plugin.

After this plugin creates the XML, you can pass the XML file-path to SonarQube using the `sonar.coverageReportPaths` flag.

**Note**: This has been tested and confirmed on code which meets 100% coverage.

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
  -d, --dx-directory=<value> [default: force-app/main/default] The root directory containing your Salesforce metadata (should be the relative path in your repository).

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  This plugin will convert the JSON file created by the Salesforce CLI during Apex deployments into the Generic Test Coverage Format.

EXAMPLES
    $ apex-code-coverage transformer transform -j "test.json" -x "coverage.xml" -d "force-app/main/default"
```

## Example

A JSON created by the Salesforce CLI :

```json
{
  "no-map/AccountTrigger": {
    "fnMap": {},
    "branchMap": {},
    "path": "no-map/AccountTrigger",
    "f": {},
    "b": {},
    "s": {
      "52": 0,
      "53": 0,
      "54": 1,
      "55": 1,
      "56": 1,
      "57": 1,
      "58": 1,
      "59": 0,
      "60": 0,
      "61": 1,
      "62": 1,
      "63": 1,
      "64": 1,
      "65": 1,
      "66": 1,
      "67": 1,
      "68": 1,
      "69": 1,
      "70": 1,
      "71": 1,
      "72": 1,
      "73": 1,
      "74": 1,
      "75": 1,
      "76": 1,
      "77": 1,
      "78": 1,
      "79": 1,
      "80": 1,
      "81": 1,
      "82": 1
    },
    "statementMap": {
      "52": { "start": { "line": 52, "column": 0 }, "end": { "line": 52, "column": 0 } },
      "53": { "start": { "line": 53, "column": 0 }, "end": { "line": 53, "column": 0 } },
      "54": { "start": { "line": 54, "column": 0 }, "end": { "line": 54, "column": 0 } },
      "55": { "start": { "line": 55, "column": 0 }, "end": { "line": 55, "column": 0 } },
      "56": { "start": { "line": 56, "column": 0 }, "end": { "line": 56, "column": 0 } },
      "57": { "start": { "line": 57, "column": 0 }, "end": { "line": 57, "column": 0 } },
      "58": { "start": { "line": 58, "column": 0 }, "end": { "line": 58, "column": 0 } },
      "59": { "start": { "line": 59, "column": 0 }, "end": { "line": 59, "column": 0 } },
      "60": { "start": { "line": 60, "column": 0 }, "end": { "line": 60, "column": 0 } },
      "61": { "start": { "line": 61, "column": 0 }, "end": { "line": 61, "column": 0 } },
      "62": { "start": { "line": 62, "column": 0 }, "end": { "line": 62, "column": 0 } },
      "63": { "start": { "line": 63, "column": 0 }, "end": { "line": 63, "column": 0 } },
      "64": { "start": { "line": 64, "column": 0 }, "end": { "line": 64, "column": 0 } },
      "65": { "start": { "line": 65, "column": 0 }, "end": { "line": 65, "column": 0 } },
      "66": { "start": { "line": 66, "column": 0 }, "end": { "line": 66, "column": 0 } },
      "67": { "start": { "line": 67, "column": 0 }, "end": { "line": 67, "column": 0 } },
      "68": { "start": { "line": 68, "column": 0 }, "end": { "line": 68, "column": 0 } },
      "69": { "start": { "line": 69, "column": 0 }, "end": { "line": 69, "column": 0 } },
      "70": { "start": { "line": 70, "column": 0 }, "end": { "line": 70, "column": 0 } },
      "71": { "start": { "line": 71, "column": 0 }, "end": { "line": 71, "column": 0 } },
      "72": { "start": { "line": 72, "column": 0 }, "end": { "line": 72, "column": 0 } },
      "73": { "start": { "line": 73, "column": 0 }, "end": { "line": 73, "column": 0 } },
      "74": { "start": { "line": 74, "column": 0 }, "end": { "line": 74, "column": 0 } },
      "75": { "start": { "line": 75, "column": 0 }, "end": { "line": 75, "column": 0 } },
      "76": { "start": { "line": 76, "column": 0 }, "end": { "line": 76, "column": 0 } },
      "77": { "start": { "line": 77, "column": 0 }, "end": { "line": 77, "column": 0 } },
      "78": { "start": { "line": 78, "column": 0 }, "end": { "line": 78, "column": 0 } },
      "79": { "start": { "line": 79, "column": 0 }, "end": { "line": 79, "column": 0 } },
      "80": { "start": { "line": 80, "column": 0 }, "end": { "line": 80, "column": 0 } },
      "81": { "start": { "line": 81, "column": 0 }, "end": { "line": 81, "column": 0 } },
      "82": { "start": { "line": 82, "column": 0 }, "end": { "line": 82, "column": 0 } }
    }
  },
  "no-map/AccountProfile": {
    "fnMap": {},
    "branchMap": {},
    "path": "no-map/AccountProfile",
    "f": {},
    "b": {},
    "s": {
      "52": 0,
      "53": 0,
      "54": 1,
      "55": 1,
      "56": 1,
      "57": 1,
      "58": 1,
      "59": 0,
      "60": 0,
      "61": 1,
      "62": 1,
      "63": 1,
      "64": 1,
      "65": 1,
      "66": 1,
      "67": 1,
      "68": 1,
      "69": 1,
      "70": 1,
      "71": 1,
      "72": 1,
      "73": 1,
      "74": 1,
      "75": 1,
      "76": 1,
      "77": 1,
      "78": 1,
      "79": 1,
      "80": 1,
      "81": 1,
      "82": 1
    },
    "statementMap": {
      "52": { "start": { "line": 52, "column": 0 }, "end": { "line": 52, "column": 0 } },
      "53": { "start": { "line": 53, "column": 0 }, "end": { "line": 53, "column": 0 } },
      "54": { "start": { "line": 54, "column": 0 }, "end": { "line": 54, "column": 0 } },
      "55": { "start": { "line": 55, "column": 0 }, "end": { "line": 55, "column": 0 } },
      "56": { "start": { "line": 56, "column": 0 }, "end": { "line": 56, "column": 0 } },
      "57": { "start": { "line": 57, "column": 0 }, "end": { "line": 57, "column": 0 } },
      "58": { "start": { "line": 58, "column": 0 }, "end": { "line": 58, "column": 0 } },
      "59": { "start": { "line": 59, "column": 0 }, "end": { "line": 59, "column": 0 } },
      "60": { "start": { "line": 60, "column": 0 }, "end": { "line": 60, "column": 0 } },
      "61": { "start": { "line": 61, "column": 0 }, "end": { "line": 61, "column": 0 } },
      "62": { "start": { "line": 62, "column": 0 }, "end": { "line": 62, "column": 0 } },
      "63": { "start": { "line": 63, "column": 0 }, "end": { "line": 63, "column": 0 } },
      "64": { "start": { "line": 64, "column": 0 }, "end": { "line": 64, "column": 0 } },
      "65": { "start": { "line": 65, "column": 0 }, "end": { "line": 65, "column": 0 } },
      "66": { "start": { "line": 66, "column": 0 }, "end": { "line": 66, "column": 0 } },
      "67": { "start": { "line": 67, "column": 0 }, "end": { "line": 67, "column": 0 } },
      "68": { "start": { "line": 68, "column": 0 }, "end": { "line": 68, "column": 0 } },
      "69": { "start": { "line": 69, "column": 0 }, "end": { "line": 69, "column": 0 } },
      "70": { "start": { "line": 70, "column": 0 }, "end": { "line": 70, "column": 0 } },
      "71": { "start": { "line": 71, "column": 0 }, "end": { "line": 71, "column": 0 } },
      "72": { "start": { "line": 72, "column": 0 }, "end": { "line": 72, "column": 0 } },
      "73": { "start": { "line": 73, "column": 0 }, "end": { "line": 73, "column": 0 } },
      "74": { "start": { "line": 74, "column": 0 }, "end": { "line": 74, "column": 0 } },
      "75": { "start": { "line": 75, "column": 0 }, "end": { "line": 75, "column": 0 } },
      "76": { "start": { "line": 76, "column": 0 }, "end": { "line": 76, "column": 0 } },
      "77": { "start": { "line": 77, "column": 0 }, "end": { "line": 77, "column": 0 } },
      "78": { "start": { "line": 78, "column": 0 }, "end": { "line": 78, "column": 0 } },
      "79": { "start": { "line": 79, "column": 0 }, "end": { "line": 79, "column": 0 } },
      "80": { "start": { "line": 80, "column": 0 }, "end": { "line": 80, "column": 0 } },
      "81": { "start": { "line": 81, "column": 0 }, "end": { "line": 81, "column": 0 } },
      "82": { "start": { "line": 82, "column": 0 }, "end": { "line": 82, "column": 0 } }
    }
  },
  "no-map/Get_Info": {
    "fnMap": {},
    "branchMap": {},
    "path": "no-map/Get_Info",
    "f": {},
    "b": {},
    "s": {
      "52": 0,
      "53": 0,
      "54": 1,
      "55": 1,
      "56": 1,
      "57": 1,
      "58": 1,
      "59": 0,
      "60": 0,
      "61": 1,
      "62": 1,
      "63": 1,
      "64": 1,
      "65": 1,
      "66": 1,
      "67": 1,
      "68": 1,
      "69": 1,
      "70": 1,
      "71": 1,
      "72": 1,
      "73": 1,
      "74": 1,
      "75": 1,
      "76": 1,
      "77": 1,
      "78": 1,
      "79": 1,
      "80": 1,
      "81": 1,
      "82": 1
    },
    "statementMap": {
      "52": { "start": { "line": 52, "column": 0 }, "end": { "line": 52, "column": 0 } },
      "53": { "start": { "line": 53, "column": 0 }, "end": { "line": 53, "column": 0 } },
      "54": { "start": { "line": 54, "column": 0 }, "end": { "line": 54, "column": 0 } },
      "55": { "start": { "line": 55, "column": 0 }, "end": { "line": 55, "column": 0 } },
      "56": { "start": { "line": 56, "column": 0 }, "end": { "line": 56, "column": 0 } },
      "57": { "start": { "line": 57, "column": 0 }, "end": { "line": 57, "column": 0 } },
      "58": { "start": { "line": 58, "column": 0 }, "end": { "line": 58, "column": 0 } },
      "59": { "start": { "line": 59, "column": 0 }, "end": { "line": 59, "column": 0 } },
      "60": { "start": { "line": 60, "column": 0 }, "end": { "line": 60, "column": 0 } },
      "61": { "start": { "line": 61, "column": 0 }, "end": { "line": 61, "column": 0 } },
      "62": { "start": { "line": 62, "column": 0 }, "end": { "line": 62, "column": 0 } },
      "63": { "start": { "line": 63, "column": 0 }, "end": { "line": 63, "column": 0 } },
      "64": { "start": { "line": 64, "column": 0 }, "end": { "line": 64, "column": 0 } },
      "65": { "start": { "line": 65, "column": 0 }, "end": { "line": 65, "column": 0 } },
      "66": { "start": { "line": 66, "column": 0 }, "end": { "line": 66, "column": 0 } },
      "67": { "start": { "line": 67, "column": 0 }, "end": { "line": 67, "column": 0 } },
      "68": { "start": { "line": 68, "column": 0 }, "end": { "line": 68, "column": 0 } },
      "69": { "start": { "line": 69, "column": 0 }, "end": { "line": 69, "column": 0 } },
      "70": { "start": { "line": 70, "column": 0 }, "end": { "line": 70, "column": 0 } },
      "71": { "start": { "line": 71, "column": 0 }, "end": { "line": 71, "column": 0 } },
      "72": { "start": { "line": 72, "column": 0 }, "end": { "line": 72, "column": 0 } },
      "73": { "start": { "line": 73, "column": 0 }, "end": { "line": 73, "column": 0 } },
      "74": { "start": { "line": 74, "column": 0 }, "end": { "line": 74, "column": 0 } },
      "75": { "start": { "line": 75, "column": 0 }, "end": { "line": 75, "column": 0 } },
      "76": { "start": { "line": 76, "column": 0 }, "end": { "line": 76, "column": 0 } },
      "77": { "start": { "line": 77, "column": 0 }, "end": { "line": 77, "column": 0 } },
      "78": { "start": { "line": 78, "column": 0 }, "end": { "line": 78, "column": 0 } },
      "79": { "start": { "line": 79, "column": 0 }, "end": { "line": 79, "column": 0 } },
      "80": { "start": { "line": 80, "column": 0 }, "end": { "line": 80, "column": 0 } },
      "81": { "start": { "line": 81, "column": 0 }, "end": { "line": 81, "column": 0 } },
      "82": { "start": { "line": 82, "column": 0 }, "end": { "line": 82, "column": 0 } }
    }
  }
}
```

will be converted to:

```xml
<?xml version="1.0"?>
<coverage version="1">
	<file path="force-app/main/default/triggers/AccountTrigger.trigger">
		<lineToCover lineNumber="52" covered="false"/>
		<lineToCover lineNumber="53" covered="false"/>
		<lineToCover lineNumber="59" covered="false"/>
		<lineToCover lineNumber="60" covered="false"/>
	</file>
	<file path="force-app/main/default/classes/AccountProfile.cls">
		<lineToCover lineNumber="52" covered="false"/>
		<lineToCover lineNumber="53" covered="false"/>
		<lineToCover lineNumber="59" covered="false"/>
		<lineToCover lineNumber="60" covered="false"/>
	</file>
	<file path="force-app/main/default/flows/Get_Info.flow-meta.xml">
		<lineToCover lineNumber="52" covered="false"/>
		<lineToCover lineNumber="53" covered="false"/>
		<lineToCover lineNumber="59" covered="false"/>
		<lineToCover lineNumber="60" covered="false"/>
	</file>
</coverage>
```
