'use strict';
import { getCoverageHandler } from '../handlers/getHandler.js';

export type TransformerTransformResult = {
  path: string[];
};

export type DeployCoverageData = {
  [className: string]: {
    fnMap: Record<string, unknown>;
    branchMap: Record<string, unknown>;
    path: string;
    f: Record<string, unknown>;
    b: Record<string, unknown>;
    s: Record<string, number>;
    statementMap: Record<
      string,
      {
        start: { line: number; column: number };
        end: { line: number; column: number };
      }
    >;
  };
};

export type TestCoverageData = {
  id: string;
  name: string;
  totalLines: number;
  lines: Record<string, number>;
  totalCovered: number;
  coveredPercent: number;
};

export type SfdxProject = {
  packageDirectories: Array<{ path: string }>;
};

export type CoverageProcessingContext = {
  handlers: Map<string, ReturnType<typeof getCoverageHandler>>;
  packageDirs: string[];
  repoRoot: string;
  concurrencyLimit: number;
  warnings: string[];
  filePathCache: Map<string, string>;
  excludePatterns: string[];
};

export type CoverageInput = DeployCoverageData | TestCoverageData[];

export type LineTotals = { totalLines: number; coveredLines: number };
/** Per-file coverage totals returned by the programmatic API. */
export type FileCoverageSummary = {
  /** Path relative to the repo root, using forward slashes. */
  path: string;
  /** Apex class or trigger name as reported by Salesforce. */
  name: string;
  totalLines: number;
  coveredLines: number;
  /** Covered lines divided by total lines (0-1). 0 when the file has no coverable lines. */
  lineRate: number;
  /** Line numbers with no coverage, ascending. */
  uncoveredLines: number[];
};

export type ProcessResult = { processed: number; files: FileCoverageSummary[] } & LineTotals;

export type TransformOptions = {
  minCoverage?: number;
  maxAnnotations?: number;
  excludePatterns?: string[];
};

/** Output formats supported by the transformer. */
export type CoverageFormat =
  | 'clover'
  | 'cobertura'
  | 'github-actions'
  | 'html'
  | 'jacoco'
  | 'json'
  | 'json-summary'
  | 'lcovonly'
  | 'markdown'
  | 'opencover'
  | 'simplecov'
  | 'sonar';

/** Options for {@link transformCoverage}. */
export type TransformCoverageOptions = {
  /**
   * Coverage inputs: paths to Salesforce CLI coverage JSON files and/or already-parsed JSON.
   * All inputs must be the same type (deploy or test). Covered lines are unioned across inputs.
   */
  inputs: Array<string | CoverageInput>;
  /** Output formats. Defaults to `['sonar']`. */
  formats?: CoverageFormat[];
  /**
   * Base path for written reports. Defaults to `coverage.xml`. With multiple formats, the format
   * name is appended (e.g. `coverage-sonar.xml`). Ignored when `write` is false.
   */
  outputReport?: string;
  /** Write reports to disk. Defaults to true. When false, report contents are only returned. */
  write?: boolean;
  /** Directory to search upward from for `sfdx-project.json`. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Package directory paths (as written in `sfdx-project.json`) to skip. */
  ignorePackageDirectories?: string[];
  /** Glob patterns matched against repo-relative file paths to exclude. */
  excludePatterns?: string[];
  /** Minimum overall line coverage percentage (0-100). Sets `passed` to false when not met. */
  minCoverage?: number;
  /** Maximum annotations for the `github-actions` format. */
  maxAnnotations?: number;
};

export type GeneratedReport = {
  format: CoverageFormat;
  /** Path the report was written to. Undefined when `write` is false. */
  path?: string;
  content: string;
};

export type CoverageSummary = {
  /** Overall covered lines divided by total lines (0-1). */
  lineRate: number;
  coveredLines: number;
  totalLines: number;
  fileCount: number;
  /** Per-file totals, sorted by path. */
  files: FileCoverageSummary[];
};

/** Result of {@link transformCoverage}. */
export type TransformCoverageResult = {
  reports: GeneratedReport[];
  summary: CoverageSummary;
  warnings: string[];
  /** False only when `minCoverage` is set and overall coverage is below it. */
  passed: boolean;
};

type SonarLine = {
  '@lineNumber': number;
  '@covered': boolean;
};

export type SonarClass = {
  '@path': string;
  lineToCover: SonarLine[];
};

export type SonarCoverageObject = {
  coverage: {
    file: SonarClass[];
    '@version': string;
  };
};

export type HookFile = {
  deployCoverageJsonPath: string;
  testCoverageJsonPath: string;
  outputReportPath: string;
  format: string;
  ignorePackageDirectories: string;
  minCoverage?: number;
  maxAnnotations?: number;
  excludePatterns?: string;
};

export type CoberturaLine = {
  '@number': number;
  '@hits': number;
  '@branch': string;
};

export type CoberturaClass = {
  '@name': string;
  '@filename': string;
  '@line-rate': number;
  '@branch-rate': number;
  methods: Record<string, never>;
  lines: {
    line: CoberturaLine[];
  };
};

export type CoberturaPackage = {
  '@name': string;
  '@line-rate': number;
  '@branch-rate': number;
  classes: {
    class: CoberturaClass[];
  };
};

export type CoberturaCoverageObject = {
  coverage: {
    '@lines-valid': number;
    '@lines-covered': number;
    '@line-rate': number;
    '@branches-valid': number;
    '@branches-covered': number;
    '@branch-rate': number | string;
    '@timestamp': number;
    '@complexity': number;
    '@version': string;
    sources: {
      source: string[];
    };
    packages: {
      package: CoberturaPackage[];
    };
  };
};

export type CloverLine = {
  '@num': number;
  '@count': number;
  '@type': string;
};

export type CloverFile = {
  '@name': string;
  '@path': string;
  metrics: {
    '@statements': number;
    '@coveredstatements': number;
    '@conditionals': number;
    '@coveredconditionals': number;
    '@methods': number;
    '@coveredmethods': number;
  };
  line: CloverLine[];
};

type CloverProjectMetrics = {
  '@statements': number;
  '@coveredstatements': number;
  '@conditionals': number;
  '@coveredconditionals': number;
  '@methods': number;
  '@coveredmethods': number;
  '@elements': number;
  '@coveredelements': number;
  '@complexity': number;
  '@loc': number;
  '@ncloc': number;
  '@packages': number;
  '@files': number;
  '@classes': number;
};

type CloverProject = {
  '@timestamp': number;
  '@name': string;
  metrics: CloverProjectMetrics;
  file: CloverFile[];
};

export type CloverCoverageObject = {
  coverage: {
    '@generated': number;
    '@clover': string;
    project: CloverProject;
  };
};

export type CoverageHandler = {
  processFile(filePath: string, fileName: string, lines: Record<string, number>, sourceContent?: string): void;
  finalize(): AnyCoverageObject;
};

type LcovLine = {
  lineNumber: number;
  hitCount: number;
};

export type LcovFile = {
  sourceFile: string;
  lines: LcovLine[];
  totalLines: number;
  coveredLines: number;
};

export type LcovCoverageObject = {
  files: LcovFile[];
};

export type JaCoCoCoverageObject = {
  report: {
    '@name': string;
    package: JaCoCoPackage[];
    counter: JaCoCoCounter[];
  };
};

export type JaCoCoPackage = {
  '@name': string;
  sourcefile: JaCoCoSourceFile[];
  counter: JaCoCoCounter[];
};

export type JaCoCoSourceFile = {
  '@name': string;
  line: JaCoCoLine[];
  counter: JaCoCoCounter[];
};

export type JaCoCoLine = {
  '@nr': number; // Line number
  '@mi': number; // Missed (0 = not covered, 1 = covered)
  '@ci': number; // Covered (1 = covered, 0 = missed)
  '@mb'?: number; // Missed Branch (optional, can be adjusted if needed)
  '@cb'?: number; // Covered Branch (optional, can be adjusted if needed)
};

export type JaCoCoCounter = {
  '@type': 'INSTRUCTION' | 'BRANCH' | 'LINE' | 'METHOD' | 'CLASS' | 'PACKAGE';
  '@missed': number;
  '@covered': number;
};

export type IstanbulCoverageMap = {
  [filePath: string]: IstanbulCoverageFile;
};

export type IstanbulCoverageFile = {
  path: string;
  statementMap: Record<string, SourceRange>;
  fnMap: Record<string, FunctionMapping>;
  branchMap: Record<string, BranchMapping>;
  s: Record<string, number>; // statement hits
  f: Record<string, number>; // function hits
  b: Record<string, number[]>; // branch hits
  l: Record<string, number>; // line hits
};

export type SourcePosition = {
  line: number;
  column: number;
};

export type SourceRange = {
  start: SourcePosition;
  end: SourcePosition;
};

export type FunctionMapping = {
  name: string;
  decl: SourceRange;
  loc: SourceRange;
  line: number;
};

export type BranchMapping = {
  loc: SourceRange;
  type: string;
  locations: SourceRange[];
  line: number;
};

export type IstanbulCoverageObject = IstanbulCoverageMap; // alias for clarity

// JSON Summary format types
export type JsonSummaryFileCoverage = {
  lines: {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
  };
  statements: {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
  };
};

export type JsonSummaryCoverageObject = {
  total: JsonSummaryFileCoverage;
  files: {
    [filePath: string]: JsonSummaryFileCoverage;
  };
};

// SimpleCov JSON format types
export type SimpleCovCoverageObject = {
  coverage: {
    [filePath: string]: Array<number | null>;
  };
  timestamp: number;
};

// OpenCover XML format types
export type OpenCoverSequencePoint = {
  '@vc': number; // visit count
  '@sl': number; // start line
  '@sc'?: number; // start column
  '@el'?: number; // end line
  '@ec'?: number; // end column
};

export type OpenCoverMethod = {
  '@name': string;
  '@isConstructor'?: boolean;
  '@isStatic'?: boolean;
  '@isGetter'?: boolean;
  '@isSetter'?: boolean;
  SequencePoints: {
    SequencePoint: OpenCoverSequencePoint[];
  };
};

export type OpenCoverClass = {
  '@fullName': string;
  Methods: {
    Method: OpenCoverMethod[];
  };
};

export type OpenCoverFile = {
  '@uid': number;
  '@fullPath': string;
};

export type OpenCoverModule = {
  '@hash': string;
  Files: {
    File: OpenCoverFile[];
  };
  Classes: {
    Class: OpenCoverClass[];
  };
};

export type OpenCoverCoverageObject = {
  CoverageSession: {
    Summary: {
      '@numSequencePoints': number;
      '@visitedSequencePoints': number;
      '@numBranchPoints': number;
      '@visitedBranchPoints': number;
      '@sequenceCoverage': number;
      '@branchCoverage': number;
    };
    Modules: {
      Module: OpenCoverModule[];
    };
  };
};

// HTML coverage format types
export type HtmlFileCoverage = {
  filePath: string;
  fileName: string;
  totalLines: number;
  coveredLines: number;
  uncoveredLines: number;
  lineRate: number;
  lines: HtmlLineCoverage[];
};

/**
 * One row in the HTML line view. When source content is available, every
 * line of the file is listed; lines absent from the coverage data are marked
 * `executable: false` (comments, signatures, braces, blank lines).
 */
export type HtmlLineCoverage = {
  lineNumber: number;
  hitCount: number;
  covered: boolean;
  content?: string;
  /** False for non-executable lines. Omitted or true for lines in the coverage data. */
  executable?: boolean;
};

/** Summary for a package directory (e.g. force-app) in the HTML report */
export type HtmlPackageSummary = {
  directory: string;
  totalLines: number;
  coveredLines: number;
  uncoveredLines: number;
  lineRate: number;
  fileCount: number;
};

export type HtmlCoverageObject = {
  summary: {
    totalLines: number;
    coveredLines: number;
    uncoveredLines: number;
    lineRate: number;
  };
  /** Per-package-directory coverage (e.g. force-app) */
  packageSummaries: HtmlPackageSummary[];
  files: HtmlFileCoverage[];
};

// Markdown coverage format types
export type MarkdownPackageRow = {
  directory: string;
  fileCount: number;
  totalLines: number;
  coveredLines: number;
  uncoveredLines: number;
  lineRate: number;
};

export type MarkdownFileRow = {
  filePath: string;
  totalLines: number;
  coveredLines: number;
  uncoveredLines: number;
  lineRate: number;
};

export type MarkdownCoverageObject = {
  summary: {
    totalLines: number;
    coveredLines: number;
    uncoveredLines: number;
    lineRate: number;
    fileCount: number;
  };
  packages: MarkdownPackageRow[];
  files: MarkdownFileRow[];
};

// GitHub Actions workflow command output types
export type GitHubActionsUncoveredLine = {
  filePath: string;
  lineNumber: number;
};

export type GitHubActionsCoverageObject = {
  summary: {
    totalLines: number;
    coveredLines: number;
    uncoveredLines: number;
    lineRate: number;
    fileCount: number;
  };
  uncoveredLines: GitHubActionsUncoveredLine[];
};

/** Union of every format-specific coverage object the report generator can emit. */
export type AnyCoverageObject =
  | SonarCoverageObject
  | CoberturaCoverageObject
  | CloverCoverageObject
  | LcovCoverageObject
  | JaCoCoCoverageObject
  | IstanbulCoverageObject
  | JsonSummaryCoverageObject
  | SimpleCovCoverageObject
  | OpenCoverCoverageObject
  | HtmlCoverageObject
  | MarkdownCoverageObject
  | GitHubActionsCoverageObject;

export type XmlReportFormat = 'cobertura' | 'clover' | 'jacoco' | 'opencover';
export type XmlHeaderConfig = {
  xmlDecl: string;
  doctype?: string;
};
