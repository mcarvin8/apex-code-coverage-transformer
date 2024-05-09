# summary

Transforms the Code Coverage JSON into the Generic Test Coverage Format (XML).

# description

This plugin will convert the code coverage JSON file created by the Salesforce CLI during Apex deployments into an XML accepted by tools like SonarQube.

# examples

- `sf apex-code-coverage transformer transform -j "coverage.json" -x "coverage.xml" -c "deploy"`

# flags.coverage-json.summary

Path to the code coverage JSON file created by the Salesforce CLI deployment command.

# flags.xml.summary

Path to code coverage XML file that will be created by this plugin.

# flags.xml.summary

Path to code coverage XML file that will be created by this plugin.

# flags.command.summary

The type of Salesforce CLI command you are running.
