'use strict';

export type TransformerTransformResult = {
  path: string;
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

type LineToCover = {
  '@lineNumber': number;
  '@covered': string;
};

export type FileObject = {
  '@path': string;
  lineToCover: LineToCover[];
};

export type CoverageObject = {
  coverage: {
    file: FileObject[];
    '@version': string;
  };
};

export type ConfigFile = {
  deployCoverageJsonPath: string;
  testCoverageJsonPath: string;
  coverageXmlPath: string;
};
