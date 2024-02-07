# summary

Transforms the Code Coverage JSON into the Generic Test Data Format (XML).

# description

This plugin will convert the JSON file created by the Salesforce CLI during Apex deployments

# examples

- `sf apex-code-coverage transformer transform --json "path-to-cli-coverage.json"`

# flags.dx-directory.summary

Directory containing Salesforce metadata (default: `force-app/main/default`).

# flags.coverage-json.summary

Path to the JSON file created by the Salesforce CLI deployment command.

# flags.xml.summary

XML file created by this plugin (default: `coverage.xml`).
