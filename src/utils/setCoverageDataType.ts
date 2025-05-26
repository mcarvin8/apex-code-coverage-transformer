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

  if (typeof path !== 'string') return false;
  if (!isObject(fnMap)) return false;
  if (!isObject(branchMap)) return false;
  if (!isObject(f)) return false;
  if (!isObject(b)) return false;
  if (!isObject(s)) return false;
  if (!isValidStatementMap(statementMap)) return false;

  return true;
}

function isDeployCoverageData(data: unknown): data is DeployCoverageData {
  if (!isObject(data)) return false;
  return Object.entries(data).every(([, item]) => isValidDeployItem(item));
}

function isSingleTestCoverageData(data: unknown): data is TestCoverageData {
  if (!isObject(data)) return false;

  const { id, name, totalLines, lines, totalCovered, coveredPercent } = data;

  if (typeof id !== 'string') return false;
  if (typeof name !== 'string') return false;
  if (typeof totalLines !== 'number') return false;
  if (typeof totalCovered !== 'number') return false;
  if (typeof coveredPercent !== 'number') return false;
  if (!isObject(lines)) return false;
  if (!Object.values(lines).every((line) => typeof line === 'number')) return false;

  return true;
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
