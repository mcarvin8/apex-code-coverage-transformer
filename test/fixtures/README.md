# Test fixtures

Test-only data lives under `test/fixtures/` so it’s clear what’s used by tests and keeps the repo root focused on source and config.

## Layout

| Folder         | Purpose                                                                                                                                                              |
|----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **inputs/**    | Coverage JSON files produced by Salesforce CLI (deploy/test) and invalid samples. Used as transformer input in unit and NUT tests.                                   |
| **baselines/** | Expected output for each coverage format. Tests compare transformer output to these files.                                                                           |
| **samples/**   | Sample Apex classes and triggers used to satisfy `sfdx-project.json` package directories during tests. `testSetup` copies from here into `force-app` and `packaged`. |

## Keeping inputs and samples in sync

Every line number in `inputs/` is an executable line in the matching `samples/` file, the way Salesforce reports coverage. If you edit a sample, update the line numbers in the inputs to match, then regenerate the baselines. Deploy and test inputs report the same coverage for `AccountProfile` and `AccountTrigger`, because the NUT compares both against one set of baselines. The `_2` inputs cover lines left uncovered in the main inputs, to exercise merging.

## What stays at repo root

- **defaults/** — Sample hook configs (e.g. `.apexcodecovtransformer.config.json` for Salesforce CLI and SFDX Hardis). Linked from the main README for users to copy; not used by tests.

## Paths in code

- `test/utils/testConstants.ts` — Defines paths to inputs, baselines, and sample Apex (all under `test/fixtures/`).
- The fake `sfdx-project.json` used in tests lists `test/fixtures/samples` as a package directory so the transformer can resolve Apex names to file paths.
