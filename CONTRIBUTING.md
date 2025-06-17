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

When developing, run the provided unit tests for new additions. New additions must meet the jest code coverage requirements.

```bash
# run unit tests
yarn test:only
```

To run the non-unit test, ensure you re-build the application and then run:

```bash
# run non-unit tests
yarn test:nuts
```

## Adding Coverage Formats

To add new coverage formats to the transformer:

1. Add the format flag value to `formatOptions` in `src/utils/constants.ts`.
2. Add new coverage types to `src/utils/types.ts` including a `{format}CoverageObject` type. Add the new `{format}CoverageObject` type to the `CoverageHandler` type under `finalize`.

```typescript
export type CoverageHandler = {
  processFile(filePath: string, fileName: string, lines: Record<string, number>): void;
  finalize(): SonarCoverageObject | CoberturaCoverageObject | CloverCoverageObject | LcovCoverageObject;
};
```

3. Create a new coverage handler file in `src/handlers` with a `constructor`, `processFile` and `finalize` class.
   1. The `finalize` class should sort items in the coverage object before returning.
4. Add new coverage handler class to `src/handlers/getHandler.ts`.
5. Add new `{format}CoverageObject` type to `src/transformers/reportGenerator.ts` and add anything needed to create the final report for that format, including updating the report extension in the `getExtensionForFormat` function.
6. The unit and non-unit tests will automatically run the new coverage format after it's added to the `formatOptions` constant. You will need to run the unit test suite once to generate the baseline report for the new format.
   1. Add the newly generated baseline to the `baselines` folder named `{format}_baseline.{ext}`
   2. Create a new test constant with the baseline path in `test/utils/testConstants.ts`
   3. If needed, update the `test/commands/acc-transformer/normalizeCoverageReport.ts` to remove timestamps if the new format report has timestamps, i.e. Cobertura and Clover.
   4. Re-run the unit test and confirm all tests pass, including the baseline compare test.
