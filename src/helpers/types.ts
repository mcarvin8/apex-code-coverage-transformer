'use strict';

export interface DeployCoverageData {
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
}

export interface TestCoverageData {
  id: string;
  name: string;
  totalLines: number;
  lines: Record<string, number>;
  totalCovered: number;
  coveredPercent: number;
}

export interface SfdxProject {
  packageDirectories: Array<{ path: string }>;
}

interface LineToCover {
  '@lineNumber': number;
  '@covered': string;
}

export interface FileObject {
  '@path': string;
  lineToCover: LineToCover[];
}

export interface CoverageObject {
  coverage: {
    file: FileObject[];
    '@version': string;
  };
}

export interface ConfigFile {
  deployCoverageJsonPath: string;
  testCoverageJsonPath: string;
  coverageXmlPath: string;
}
