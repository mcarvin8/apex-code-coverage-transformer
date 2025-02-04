# Contributing

Contributions are welcome! If you would like to contribute, please fork the repository, make your changes, and submit a pull request.

## Requirements

- Node >= 18.0.0
- yarn

## Installation

### 1) Fork the repository

### 2) Install Dependencies

This will install all the tools needed to contribute

```bash
yarn
```

### 3) Build application

```bash
yarn build
```

Rebuild every time you made a change in the source and you need to test locally

## Testing

When developing, run the provided tests for new additions.

```bash
# run unit tests
yarn test
```

To run the non-unit test, ensure you re-build the application and then run:

```bash
# run non-unit tests
yarn test:nuts
```

## Adding Coverage Formats

To add new coverage formats to the transformer:

1. Add the format flag value to `formatOptions` in `src/helpers/constants.ts`.
2. Add new coverage types to `src/helpers/types.ts` including a `{format}CoverageObject` type. Add the new `{format}CoverageObject` type to the `CoverageHandler` type under `finalize`.
``` typescript
export type CoverageHandler = {
  processFile(
    filePath: string,
    fileName: string,
    lines: Record<string, number>,
  ): void;
  finalize(): SonarCoverageObject | CoberturaCoverageObject | CloverCoverageObject | LcovCoverageObject;
};
```
3. Create a new coverage handler class in `src/handlers` with a `constructor`, `processFile` and `finalize` class.
    1. The `finalize` class should sort items in the coverage object before returning.
4. Add new coverage handler class to `src/handlers/getCoverageHandler.ts`.
5. Add new coverage handler object type to `src/helpers/generateReport.ts` and add anything needed to create the final report for that format.
6. Add new unit and non-unit tests for new format to `test/commands/acc-transformer`.
