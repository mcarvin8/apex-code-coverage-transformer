# summary

Transforms the Code Coverage JSON into the Generic Test Data Format (XML).

# description

This plugin will convert the JSON file created by the Salesforce CLI during Apex deployments

# examples

- `sf apex-code-coverage transformer transform --coverage-json "path-to-cli-coverage.json"`

# flags.sfdx-configuration.summary

Path to your project's Salesforce DX configuration file (`sfdx-project.json`). By default, it will look for `sfdx-project.json` in the same directory you're running this plugin in.

# flags.coverage-json.summary

Path to the JSON file created by the Salesforce CLI deployment command.

# flags.xml.summary

XML file created by this plugin (default: `coverage.xml`).
