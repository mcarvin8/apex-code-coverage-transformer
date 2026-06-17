# summary

Transform Salesforce Apex code coverage JSONs created during deployments and test runs into other formats accepted by SonarQube, GitHub, GitLab, Azure, Bitbucket, etc.

# description

Transform Salesforce Apex code coverage JSONs created during deployments and test runs into other formats accepted by SonarQube, GitHub, GitLab, Azure, Bitbucket, etc.

# examples

- `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "sonar"`
- `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "cobertura"`
- `sf acc-transformer transform -j "coverage.json" -r "coverage.xml" -f "clover"`
- `sf acc-transformer transform -j "coverage.json" -r "coverage.info" -f "lcovonly"`
- `sf acc-transformer transform -j "coverage.json" -r "coverage.md" -f "markdown"`
- `sf acc-transformer transform -j "coverage.json" -r "coverage.txt" -f "github-actions"`
- `sf acc-transformer transform -j "coverage.json" -i "force-app"`
- `sf acc-transformer transform -j "coverage1.json" -j "coverage2.json" -r "coverage.xml" -f "sonar"`

# flags.coverage-json.summary

Path to a code coverage JSON file created by the Salesforce CLI deploy or test command. Repeat the flag to merge multiple files. When the same Apex file appears in multiple inputs, covered lines are unioned across all inputs — if a line is covered in any input it is counted as covered in the final report, even if it is uncovered in others.

# flags.output-report.summary

Path to the code coverage file that will be created by this plugin.

# flags.format.summary

Output format for the coverage report.

# flags.ignore-package-directory.summary

Ignore a package directory when looking for matching files in the coverage report.

# flags.min-coverage.summary

Minimum required line coverage percentage (0–100). The command exits with an error if overall coverage is below this threshold. Reports are still written before the check.

# flags.max-annotations.summary

Maximum number of GitHub Actions ::warning annotations to emit when using --format github-actions. Defaults to 50. Annotations beyond this limit are summarised in a ::notice line.

# flags.exclude-pattern.summary

Glob pattern for file paths to exclude from the coverage report. Matched against the relative path from the repo root (e.g. force-app/main/default/classes/MyClass.cls). Repeat the flag for multiple patterns.
