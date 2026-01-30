# Test fixtures

Test-only data lives under `test/fixtures/` so it’s clear what’s used by tests and keeps the repo root focused on source and config.

## Layout

| Folder         | Purpose                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **inputs/**    | Coverage JSON files produced by Salesforce CLI (deploy/test) and invalid samples. Used as transformer input in unit and NUT tests.                                   |
| **baselines/** | Expected output for each coverage format. Tests compare transformer output to these files.                                                                           |
| **samples/**   | Sample Apex classes and triggers used to satisfy `sfdx-project.json` package directories during tests. `testSetup` copies from here into `force-app` and `packaged`. |

## What stays at repo root

- **defaults/** — Sample hook configs (e.g. `.apexcodecovtransformer.config.json` for Salesforce CLI and SFDX Hardis). Linked from the main README for users to copy; not used by tests.

## Paths in code

- `test/utils/testConstants.ts` — Defines paths to inputs, baselines, and sample Apex (all under `test/fixtures/`).
- The fake `sfdx-project.json` used in tests lists `test/fixtures/samples` as a package directory so the transformer can resolve Apex names to file paths.
