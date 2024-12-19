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

type SonarLine = {
  '@lineNumber': number;
  '@covered': string;
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
  coverageXmlPath: string;
  format: string;
};

export type CoberturaLine = {
  '@number': number;
  '@hits': number;
  '@branch': string;
};

export type CoberturaClass = {
  '@name': string;
  '@filename': string;
  '@line-rate': string;
  '@branch-rate': string;
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
