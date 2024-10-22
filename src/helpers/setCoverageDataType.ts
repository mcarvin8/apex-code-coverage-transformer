'use strict';

import { DeployCoverageData, TestCoverageData } from './types.js';

// Type guard for DeployCoverageData
function isDeployCoverageData(data: unknown): data is DeployCoverageData {
  if (typeof data !== 'object' || data === null) return false;

  return Object.entries(data).every(([, item]) => {
    if (typeof item !== 'object' || item === null) return false;

    const { path, fnMap, branchMap, f, b, s, statementMap } = item as {
      path: unknown;
      fnMap: unknown;
      branchMap: unknown;
      f: unknown;
      b: unknown;
      s: unknown;
      statementMap: unknown;
    };

    if (
      typeof path !== 'string' ||
      typeof fnMap !== 'object' ||
      typeof branchMap !== 'object' ||
      typeof f !== 'object' ||
      typeof b !== 'object' ||
      typeof s !== 'object' ||
      typeof statementMap !== 'object' ||
      statementMap === null
    ) {
      return false;
    }

    return Object.values(statementMap).every((statement) => {
      if (typeof statement !== 'object' || statement === null) return false;
      const { start, end } = statement as { start: unknown; end: unknown };

      return (
        typeof start === 'object' &&
        start !== null &&
        typeof (start as { line: unknown }).line === 'number' &&
        typeof (start as { column: unknown }).column === 'number' &&
        typeof end === 'object' &&
        end !== null &&
        typeof (end as { line: unknown }).line === 'number' &&
        typeof (end as { column: unknown }).column === 'number'
      );
    });
  });
}

// Type guard for a single TestCoverageData
function isSingleTestCoverageData(data: unknown): data is TestCoverageData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as TestCoverageData).id === 'string' &&
    typeof (data as TestCoverageData).name === 'string' &&
    typeof (data as TestCoverageData).totalLines === 'number' &&
    typeof (data as TestCoverageData).lines === 'object' &&
    typeof (data as TestCoverageData).totalCovered === 'number' &&
    typeof (data as TestCoverageData).coveredPercent === 'number' &&
    Object.values((data as TestCoverageData).lines).every((line: unknown) => typeof line === 'number')
  );
}

// Type guard for TestCoverageData array
function isTestCoverageDataArray(data: unknown): data is TestCoverageData[] {
  return Array.isArray(data) && data.every(isSingleTestCoverageData);
}

export function checkCoverageDataType(
  data: DeployCoverageData | TestCoverageData[]
): 'DeployCoverageData' | 'TestCoverageData' | 'Unknown' {
  if (isDeployCoverageData(data)) {
    return 'DeployCoverageData';
  } else if (isTestCoverageDataArray(data)) {
    return 'TestCoverageData';
  }
  return 'Unknown';
}
