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
  processFile(filePath: string, fileName: string, lines: Record<string, number>): void;
  finalize():
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject
    | IstanbulCoverageObject
    | JsonSummaryCoverageObject
    | SimpleCovCoverageObject
    | OpenCoverCoverageObject
    | HtmlCoverageObject;
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
  lines: Array<{
    lineNumber: number;
    hitCount: number;
    covered: boolean;
  }>;
};

export type HtmlCoverageObject = {
  summary: {
    totalLines: number;
    coveredLines: number;
    uncoveredLines: number;
    lineRate: number;
  };
  files: HtmlFileCoverage[];
};
