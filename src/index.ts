'use strict';

/**
 * Public programmatic API.
 *
 * Everything exported from this module follows semver. Anything imported from deeper paths
 * is internal and may change in any release.
 */
import { formatOptions } from './utils/constants.js';
import { CoverageFormat } from './utils/types.js';

export { transformCoverage } from './transformers/coverageTransformer.js';
export type { CoverageErrorCode } from './utils/errors.js';
export { CoverageError } from './utils/errors.js';
export type {
  CoverageFormat,
  CoverageInput,
  CoverageSummary,
  DeployCoverageData,
  FileCoverageSummary,
  GeneratedReport,
  TestCoverageData,
  TransformCoverageOptions,
  TransformCoverageResult,
} from './utils/types.js';

/** All supported output formats, sorted alphabetically. */
export const COVERAGE_FORMATS: readonly CoverageFormat[] = Object.freeze([...formatOptions] as CoverageFormat[]);
