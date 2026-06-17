'use strict';

import { DeployCoverageData, TestCoverageData } from '../utils/types.js';

export function mergeDeployCoverageData(inputs: DeployCoverageData[]): DeployCoverageData {
  const merged: DeployCoverageData = {};
  for (const input of inputs) {
    for (const [className, fileInfo] of Object.entries(input)) {
      if (!merged[className]) {
        merged[className] = { ...fileInfo, s: { ...fileInfo.s } };
      } else {
        for (const [line, hit] of Object.entries(fileInfo.s)) {
          merged[className].s[line] = Math.max(merged[className].s[line] ?? 0, hit);
        }
      }
    }
  }
  return merged;
}

export function mergeTestCoverageData(inputs: TestCoverageData[][]): TestCoverageData[] {
  const byName = new Map<string, TestCoverageData>();
  for (const input of inputs) {
    for (const entry of input) {
      if (!byName.has(entry.name)) {
        byName.set(entry.name, { ...entry, lines: { ...entry.lines } });
      } else {
        const existing = byName.get(entry.name)!;
        for (const [line, hit] of Object.entries(entry.lines)) {
          existing.lines[line] = Math.max(existing.lines[line] ?? 0, hit);
        }
        existing.totalLines = Object.keys(existing.lines).length;
        existing.totalCovered = Object.values(existing.lines).filter((v) => v === 1).length;
        existing.coveredPercent = existing.totalLines > 0 ? (existing.totalCovered / existing.totalLines) * 100 : 0;
      }
    }
  }
  return [...byName.values()];
}
