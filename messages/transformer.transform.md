# summary

Transforms the Code Coverage JSON into SonarQube, Clover, or Cobertura format.

# description

Transform the Apex code coverage JSON file created by the Salesforce CLI deploy and test command into SonarQube, Clover, LCovOnly or Cobertura format.

# examples

- `sf acc-transformer transform -j "coverage.json" -o "coverage.xml" -f "sonar"`
- `sf acc-transformer transform -j "coverage.json" -o "coverage.xml" -f "cobertura"`
- `sf acc-transformer transform -j "coverage.json" -o "coverage.xml" -f "clover"`
- `sf acc-transformer transform -j "coverage.json" -o "coverage.info" -f "lcovonly"`

# flags.coverage-json.summary

Path to the code coverage JSON file created by the Salesforce CLI deploy or test command.

# flags.output-report.summary

Path to the code coverage file that will be created by this plugin.

# flags.format.summary

Output format for the coverage report.
