'use strict';

export interface CoverageData {
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
  coverageJsonPath: string;
  coverageXmlPath: string;
}
