# summary

Transform Salesforce Apex code coverage JSONs created during deployments and test runs into other formats accepted by SonarQube, GitHub, GitLab, etc.

# description

Transform Salesforce Apex code coverage JSONs created during deployments and test runs into other formats accepted by SonarQube, GitHub, GitLab, etc.

# examples

- `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "sonar"`
- `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "cobertura"`
- `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "clover"`
- `sf acc-transformer transform -j "coverage.json" -r "coverage.info" -f "lcovonly"`

# flags.coverage-json.summary

Path to the code coverage JSON file created by the Salesforce CLI deploy or test command.

# flags.output-report.summary

Path to the code coverage file that will be created by this plugin.

# flags.format.summary

Output format for the coverage report.
