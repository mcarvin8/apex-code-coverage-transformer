'use strict';

import { describe, it, expect } from 'vitest';
import { mergeDeployCoverageData, mergeTestCoverageData } from '../../src/transformers/coverageDataMerger.js';
import { DeployCoverageData, TestCoverageData } from '../../src/utils/types.js';

const makeDeployEntry = (s: Record<string, number>): DeployCoverageData[string] => ({
  fnMap: {},
  branchMap: {},
  path: 'no-map/Foo',
  f: {},
  b: {},
  s,
  statementMap: {},
});

describe('mergeDeployCoverageData', () => {
  it('returns single input unchanged', () => {
    const input: DeployCoverageData = { Foo: makeDeployEntry({ '1': 1, '2': 0 }) };
    const result = mergeDeployCoverageData([input]);
    expect(result['Foo'].s).toEqual({ '1': 1, '2': 0 });
  });

  it('merges non-overlapping class names from two inputs', () => {
    const a: DeployCoverageData = { Foo: makeDeployEntry({ '1': 1 }) };
    const b: DeployCoverageData = { Bar: makeDeployEntry({ '2': 0 }) };
    const result = mergeDeployCoverageData([a, b]);
    expect(result['Foo'].s).toEqual({ '1': 1 });
    expect(result['Bar'].s).toEqual({ '2': 0 });
  });

  it('unions covered lines when same class appears in both inputs', () => {
    const a: DeployCoverageData = { Foo: makeDeployEntry({ '1': 0, '2': 1 }) };
    const b: DeployCoverageData = { Foo: makeDeployEntry({ '1': 1, '2': 0 }) };
    const result = mergeDeployCoverageData([a, b]);
    expect(result['Foo'].s['1']).toBe(1);
    expect(result['Foo'].s['2']).toBe(1);
  });

  it('adds lines from second input not present in first (covers ?? 0 fallback)', () => {
    const a: DeployCoverageData = { Foo: makeDeployEntry({ '1': 0 }) };
    const b: DeployCoverageData = { Foo: makeDeployEntry({ '2': 1 }) };
    const result = mergeDeployCoverageData([a, b]);
    expect(result['Foo'].s['1']).toBe(0);
    expect(result['Foo'].s['2']).toBe(1);
  });

  it('does not mutate original inputs', () => {
    const a: DeployCoverageData = { Foo: makeDeployEntry({ '1': 0 }) };
    const b: DeployCoverageData = { Foo: makeDeployEntry({ '1': 1 }) };
    mergeDeployCoverageData([a, b]);
    expect(a['Foo'].s['1']).toBe(0);
  });
});

describe('mergeTestCoverageData', () => {
  const makeEntry = (name: string, lines: Record<string, number>): TestCoverageData => ({
    id: 'abc',
    name,
    lines,
    totalLines: Object.keys(lines).length,
    totalCovered: Object.values(lines).filter((v) => v === 1).length,
    coveredPercent: 0,
  });

  it('returns single input unchanged', () => {
    const input = [makeEntry('Foo', { '1': 1, '2': 0 })];
    const result = mergeTestCoverageData([input]);
    expect(result).toHaveLength(1);
    expect(result[0].lines).toEqual({ '1': 1, '2': 0 });
  });

  it('merges non-overlapping names from two inputs', () => {
    const a = [makeEntry('Foo', { '1': 1 })];
    const b = [makeEntry('Bar', { '2': 0 })];
    const result = mergeTestCoverageData([a, b]);
    expect(result).toHaveLength(2);
  });

  it('unions covered lines when same name appears in both inputs', () => {
    const a = [makeEntry('Foo', { '1': 0, '2': 1 })];
    const b = [makeEntry('Foo', { '1': 1, '2': 0 })];
    const result = mergeTestCoverageData([a, b]);
    expect(result).toHaveLength(1);
    expect(result[0].lines['1']).toBe(1);
    expect(result[0].lines['2']).toBe(1);
  });

  it('adds lines from second input not present in first (covers ?? 0 fallback)', () => {
    const a = [makeEntry('Foo', { '1': 0 })];
    const b = [makeEntry('Foo', { '2': 1 })];
    const result = mergeTestCoverageData([a, b]);
    expect(result[0].lines['1']).toBe(0);
    expect(result[0].lines['2']).toBe(1);
  });

  it('recomputes totalLines, totalCovered, coveredPercent after collision merge', () => {
    const a = [makeEntry('Foo', { '1': 0, '2': 0 })];
    const b = [makeEntry('Foo', { '1': 1, '3': 1 })];
    const result = mergeTestCoverageData([a, b]);
    expect(result[0].totalLines).toBe(3);
    expect(result[0].totalCovered).toBe(2);
    expect(result[0].coveredPercent).toBeCloseTo((2 / 3) * 100);
  });

  it('sets coveredPercent to 0 when merged entry has no lines', () => {
    const a = [makeEntry('Foo', {})];
    const b = [makeEntry('Foo', {})];
    const result = mergeTestCoverageData([a, b]);
    expect(result[0].coveredPercent).toBe(0);
  });

  it('does not mutate original inputs', () => {
    const a = [makeEntry('Foo', { '1': 0 })];
    const b = [makeEntry('Foo', { '1': 1 })];
    mergeTestCoverageData([a, b]);
    expect(a[0].lines['1']).toBe(0);
  });
});
