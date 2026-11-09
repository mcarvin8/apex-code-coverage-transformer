// Compile-only check of the published type declarations, run as an external consumer
// with `tsc --noEmit` (see tsconfig.json next to this file). Never executed.
//
// Fails if the package stops shipping types, a public type is renamed or removed, or
// a field's type changes in a way that breaks existing callers.
import {
  COVERAGE_FORMATS,
  CoverageError,
  type CoverageErrorCode,
  type CoverageFormat,
  type CoverageInput,
  type CoverageSummary,
  type DeployCoverageData,
  type FileCoverageSummary,
  type GeneratedReport,
  type TestCoverageData,
  type TransformCoverageOptions,
  type TransformCoverageResult,
  transformCoverage,
} from 'apex-code-coverage-transformer';

const formats: readonly CoverageFormat[] = COVERAGE_FORMATS;

const deploy: DeployCoverageData = {};
const test: TestCoverageData[] = [];
const inputs: CoverageInput[] = [deploy, test];

const options: TransformCoverageOptions = {
  inputs: ['coverage.json', ...inputs],
  formats: ['sonar', 'cobertura'],
  outputReport: 'coverage.xml',
  write: false,
  cwd: '.',
  ignorePackageDirectories: ['force-app'],
  excludePatterns: ['**/*Test*'],
  minCoverage: 75,
  maxAnnotations: 50,
};

// @ts-expect-error -- unknown formats must be rejected at compile time
const badOptions: TransformCoverageOptions = { inputs: [], formats: ['bogus'] };

// @ts-expect-error -- inputs is required
const missingInputs: TransformCoverageOptions = {};

async function consume(): Promise<void> {
  const result: TransformCoverageResult = await transformCoverage(options);
  const passed: boolean = result.passed;
  const warnings: string[] = result.warnings;
  const summary: CoverageSummary = result.summary;
  const rate: number = summary.lineRate;
  const files: FileCoverageSummary[] = summary.files;
  const uncovered: number[] = files[0].uncoveredLines;
  const report: GeneratedReport = result.reports[0];
  const path: string | undefined = report.path;
  const content: string = report.content;
  const format: CoverageFormat = report.format;
  void [passed, warnings, rate, uncovered, path, content, format];

  try {
    await transformCoverage({ inputs: [] });
  } catch (error) {
    if (error instanceof CoverageError) {
      const code: CoverageErrorCode = error.code;
      const message: string = error.message;
      void [code, message];
    }
  }
}

void [formats, badOptions, missingInputs, consume];
