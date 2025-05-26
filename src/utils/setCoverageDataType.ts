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

  const checks = [
    typeof path === 'string',
    isObject(fnMap),
    isObject(branchMap),
    isObject(f),
    isObject(b),
    isObject(s),
    isValidStatementMap(statementMap),
  ];

  return checks.every(Boolean);
}

function isDeployCoverageData(data: unknown): data is DeployCoverageData {
  if (!isObject(data)) return false;
  return Object.entries(data).every(([, item]) => isValidDeployItem(item));
}

function isSingleTestCoverageData(data: unknown): data is TestCoverageData {
  if (!isObject(data)) return false;

  const { id, name, totalLines, lines, totalCovered, coveredPercent } = data;

  const checks = [
    typeof id === 'string',
    typeof name === 'string',
    typeof totalLines === 'number',
    typeof totalCovered === 'number',
    typeof coveredPercent === 'number',
    isObject(lines),
    isObject(lines) && Object.values(lines).every((line) => typeof line === 'number'),
  ];

  return checks.every(Boolean);
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
