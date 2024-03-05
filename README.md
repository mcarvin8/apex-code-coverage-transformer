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
  "no-map/PrepareMySandbox": {
    "fnMap": {},
    "branchMap": {},
    "path": "no-map/PrepareMySandbox",
    "f": {},
    "b": {},
    "s": {
      "7": 0,
      "8": 1,
      "9": 1,
      "10": 1,
      "11": 1,
      "12": 0,
      "13": 1,
      "14": 1,
      "15": 1,
      "16": 1,
      "17": 1,
      "18": 1,
      "19": 1,
      "20": 1,
      "21": 1,
      "22": 1,
      "23": 1,
      "24": 1,
      "25": 1,
      "26": 1,
      "27": 1,
      "28": 1,
      "29": 1,
      "30": 1,
      "31": 1,
      "32": 1,
      "33": 1,
      "34": 1,
      "35": 1,
      "36": 1,
      "37": 1
    },
    "statementMap": {
      "7": {
        "start": {
          "line": 7,
          "column": 0
        },
        "end": {
          "line": 7,
          "column": 0
        }
      },
      "8": {
        "start": {
          "line": 8,
          "column": 0
        },
        "end": {
          "line": 8,
          "column": 0
        }
      },
      "9": {
        "start": {
          "line": 9,
          "column": 0
        },
        "end": {
          "line": 9,
          "column": 0
        }
      },
      "10": {
        "start": {
          "line": 10,
          "column": 0
        },
        "end": {
          "line": 10,
          "column": 0
        }
      },
      "11": {
        "start": {
          "line": 11,
          "column": 0
        },
        "end": {
          "line": 11,
          "column": 0
        }
      },
      "12": {
        "start": {
          "line": 12,
          "column": 0
        },
        "end": {
          "line": 12,
          "column": 0
        }
      },
      "13": {
        "start": {
          "line": 13,
          "column": 0
        },
        "end": {
          "line": 13,
          "column": 0
        }
      },
      "14": {
        "start": {
          "line": 14,
          "column": 0
        },
        "end": {
          "line": 14,
          "column": 0
        }
      },
      "15": {
        "start": {
          "line": 15,
          "column": 0
        },
        "end": {
          "line": 15,
          "column": 0
        }
      },
      "16": {
        "start": {
          "line": 16,
          "column": 0
        },
        "end": {
          "line": 16,
          "column": 0
        }
      },
      "17": {
        "start": {
          "line": 17,
          "column": 0
        },
        "end": {
          "line": 17,
          "column": 0
        }
      },
      "18": {
        "start": {
          "line": 18,
          "column": 0
        },
        "end": {
          "line": 18,
          "column": 0
        }
      },
      "19": {
        "start": {
          "line": 19,
          "column": 0
        },
        "end": {
          "line": 19,
          "column": 0
        }
      },
      "20": {
        "start": {
          "line": 20,
          "column": 0
        },
        "end": {
          "line": 20,
          "column": 0
        }
      },
      "21": {
        "start": {
          "line": 21,
          "column": 0
        },
        "end": {
          "line": 21,
          "column": 0
        }
      },
      "22": {
        "start": {
          "line": 22,
          "column": 0
        },
        "end": {
          "line": 22,
          "column": 0
        }
      },
      "23": {
        "start": {
          "line": 23,
          "column": 0
        },
        "end": {
          "line": 23,
          "column": 0
        }
      },
      "24": {
        "start": {
          "line": 24,
          "column": 0
        },
        "end": {
          "line": 24,
          "column": 0
        }
      },
      "25": {
        "start": {
          "line": 25,
          "column": 0
        },
        "end": {
          "line": 25,
          "column": 0
        }
      },
      "26": {
        "start": {
          "line": 26,
          "column": 0
        },
        "end": {
          "line": 26,
          "column": 0
        }
      },
      "27": {
        "start": {
          "line": 27,
          "column": 0
        },
        "end": {
          "line": 27,
          "column": 0
        }
      },
      "28": {
        "start": {
          "line": 28,
          "column": 0
        },
        "end": {
          "line": 28,
          "column": 0
        }
      },
      "29": {
        "start": {
          "line": 29,
          "column": 0
        },
        "end": {
          "line": 29,
          "column": 0
        }
      },
      "30": {
        "start": {
          "line": 30,
          "column": 0
        },
        "end": {
          "line": 30,
          "column": 0
        }
      },
      "31": {
        "start": {
          "line": 31,
          "column": 0
        },
        "end": {
          "line": 31,
          "column": 0
        }
      },
      "32": {
        "start": {
          "line": 32,
          "column": 0
        },
        "end": {
          "line": 32,
          "column": 0
        }
      },
      "33": {
        "start": {
          "line": 33,
          "column": 0
        },
        "end": {
          "line": 33,
          "column": 0
        }
      },
      "34": {
        "start": {
          "line": 34,
          "column": 0
        },
        "end": {
          "line": 34,
          "column": 0
        }
      },
      "35": {
        "start": {
          "line": 35,
          "column": 0
        },
        "end": {
          "line": 35,
          "column": 0
        }
      },
      "36": {
        "start": {
          "line": 36,
          "column": 0
        },
        "end": {
          "line": 36,
          "column": 0
        }
      },
      "37": {
        "start": {
          "line": 37,
          "column": 0
        },
        "end": {
          "line": 37,
          "column": 0
        }
      }
    }
  }
}
```

will be converted to:

```xml
<?xml version="1.0"?>
<coverage version="1">
	<file path="force-app/main/default/classes/PrepareMySandbox.cls">
		<lineToCover lineNumber="1" covered="true"/>
		<lineToCover lineNumber="2" covered="true"/>
		<lineToCover lineNumber="3" covered="true"/>
		<lineToCover lineNumber="4" covered="true"/>
		<lineToCover lineNumber="5" covered="true"/>
		<lineToCover lineNumber="6" covered="true"/>
		<lineToCover lineNumber="7" covered="false"/>
		<lineToCover lineNumber="8" covered="true"/>
		<lineToCover lineNumber="9" covered="true"/>
		<lineToCover lineNumber="10" covered="true"/>
		<lineToCover lineNumber="11" covered="true"/>
		<lineToCover lineNumber="12" covered="false"/>
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
		<lineToCover lineNumber="28" covered="true"/>
		<lineToCover lineNumber="29" covered="true"/>
		<lineToCover lineNumber="30" covered="true"/>
		<lineToCover lineNumber="31" covered="true"/>
		<lineToCover lineNumber="32" covered="true"/>
		<lineToCover lineNumber="33" covered="true"/>
		<lineToCover lineNumber="34" covered="true"/>
		<lineToCover lineNumber="35" covered="true"/>
		<lineToCover lineNumber="36" covered="true"/>
		<lineToCover lineNumber="37" covered="true"/>
		<lineToCover lineNumber="38" covered="true"/>
		<lineToCover lineNumber="39" covered="true"/>
		<lineToCover lineNumber="40" covered="true"/>
		<lineToCover lineNumber="41" covered="true"/>
		<lineToCover lineNumber="42" covered="true"/>
		<lineToCover lineNumber="43" covered="true"/>
		<lineToCover lineNumber="44" covered="true"/>
		<lineToCover lineNumber="45" covered="true"/>
		<lineToCover lineNumber="46" covered="true"/>
		<lineToCover lineNumber="47" covered="true"/>
		<lineToCover lineNumber="48" covered="true"/>
		<lineToCover lineNumber="49" covered="true"/>
		<lineToCover lineNumber="50" covered="true"/>
		<lineToCover lineNumber="51" covered="true"/>
		<lineToCover lineNumber="52" covered="true"/>
		<lineToCover lineNumber="53" covered="true"/>
		<lineToCover lineNumber="54" covered="true"/>
		<lineToCover lineNumber="55" covered="true"/>
		<lineToCover lineNumber="56" covered="true"/>
		<lineToCover lineNumber="57" covered="true"/>
		<lineToCover lineNumber="58" covered="true"/>
		<lineToCover lineNumber="59" covered="true"/>
		<lineToCover lineNumber="60" covered="true"/>
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
	</file>
</coverage>
```
