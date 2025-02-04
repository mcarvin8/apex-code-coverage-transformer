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

1. Add the format flag value to `formatOptions` in `src/helpers/constants.ts`
2. Add new coverage types to `src/helpers/types.ts`
3. Add new coverage object type to `CoverageHandler` type in `src/helpers/types.ts`
4. Create a new coverage handler class in `src/handlers` with a `constructor`, `processFile` and `finalize` class
  1. The `finalize` class should sort items in the coverage object before returning
5. Add new coverage handler class to `src/handlers/getCoverageHandler.ts`
6. Add new coverage handler object type to `src/helpers/generateReport.ts` and add anything needed to create the final report for that format
7. Add tests for new format to `test/commands/acc-transformer`
