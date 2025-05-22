'use strict';

import { DeployCoverageData, TestCoverageData } from './types.js';

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function isValidPosition(pos: unknown): boolean {
  return isObject(pos) && typeof pos.line === 'number' && typeof pos.column === 'number';
}

function isValidStatementMap(statementMap: unknown): boolean {
  if (!isObject(statementMap)) return false;

  return Object.values(statementMap).every((statement) => {
    if (!isObject(statement)) return false;
    const { start, end } = statement as { start: unknown; end: unknown };
    return isValidPosition(start) && isValidPosition(end);
  });
}

function isValidDeployItem(item: unknown): boolean {
  if (!isObject(item)) return false;

  const { path, fnMap, branchMap, f, b, s, statementMap } = item;

  const hasValidPath = typeof path === 'string';
  const hasValidFnMap = isObject(fnMap);
  const hasValidBranchMap = isObject(branchMap);
  const hasValidF = isObject(f);
  const hasValidB = isObject(b);
  const hasValidS = isObject(s);
  const hasValidStatementMap = isValidStatementMap(statementMap);

  return (
    hasValidPath && hasValidFnMap && hasValidBranchMap && hasValidF && hasValidB && hasValidS && hasValidStatementMap
  );
}

function isDeployCoverageData(data: unknown): data is DeployCoverageData {
  if (!isObject(data)) return false;
  return Object.entries(data).every(([, item]) => isValidDeployItem(item));
}

function isSingleTestCoverageData(data: unknown): data is TestCoverageData {
  if (!isObject(data)) return false;

  const { id, name, totalLines, lines, totalCovered, coveredPercent } = data;

  const hasValidId = typeof id === 'string';
  const hasValidName = typeof name === 'string';
  const hasValidTotalLines = typeof totalLines === 'number';
  const hasValidLines = isObject(lines);
  const hasValidTotalCovered = typeof totalCovered === 'number';
  const hasValidCoveredPercent = typeof coveredPercent === 'number';
  const allLinesAreNumbers = hasValidLines && Object.values(lines).every((line) => typeof line === 'number');

  return (
    hasValidId &&
    hasValidName &&
    hasValidTotalLines &&
    hasValidLines &&
    hasValidTotalCovered &&
    hasValidCoveredPercent &&
    allLinesAreNumbers
  );
}

function isTestCoverageDataArray(data: unknown): data is TestCoverageData[] {
  return Array.isArray(data) && data.every(isSingleTestCoverageData);
}

export function checkCoverageDataType(
  data: DeployCoverageData | TestCoverageData[]
): 'DeployCoverageData' | 'TestCoverageData' | 'Unknown' {
  if (isDeployCoverageData(data)) return 'DeployCoverageData';
  if (isTestCoverageDataArray(data)) return 'TestCoverageData';
  return 'Unknown';
}
