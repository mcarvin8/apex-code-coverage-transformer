# summary

Transforms the Code Coverage JSON into the Generic Test Coverage Format (XML).

# description

This plugin will convert the code coverage JSON file created by the Salesforce CLI during Apex deployments and test runs into an XML accepted by tools like SonarQube.

# examples

- `sf acc-transformer transform -j "coverage.json" -x "coverage.xml"`

# flags.coverage-json.summary

Path to the code coverage JSON file created by the Salesforce CLI deployment or test command.

# flags.xml.summary

Path to code coverage XML file that will be created by this plugin.

# flags.format.summary

Output format for the coverage report.
