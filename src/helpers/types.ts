'use strict';

export interface CoverageData {
  [className: string]: {
      fnMap: Record<string, unknown>;
      branchMap: Record<string, unknown>;
      path: string;
      f: Record<string, unknown>;
      b: Record<string, unknown>;
      s: Record<string, number>;
      statementMap: Record<string, {
          start: { line: number; column: number };
          end: { line: number; column: number };
      }>;
  };
}
