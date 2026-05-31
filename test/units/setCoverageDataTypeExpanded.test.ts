'use strict';

import { describe, it, expect } from 'vitest';
import { checkCoverageDataType } from '../../src/utils/setCoverageDataType.js';
import { DeployCoverageData, TestCoverageData } from '../../src/utils/types.js';

const validDeployItem = {
  path: 'some/file.cls',
  fnMap: {},
  branchMap: {},
  f: {},
  b: {},
  s: { '1': 1, '2': 0 },
  statementMap: {
    '1': { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
    '2': { start: { line: 2, column: 0 }, end: { line: 2, column: 10 } },
  },
};

const validTestItem: TestCoverageData = {
  id: 'abc123',
  name: 'MyClass',
  totalLines: 5,
  coveredPercent: 80,
  totalCovered: 4,
  lines: { '1': 1, '2': 0 },
};

describe('checkCoverageDataType expanded tests', () => {
  it('returns DeployCoverageData for valid deploy JSON', () => {
    const data = { MyClass: validDeployItem };
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('DeployCoverageData');
  });

  it('returns TestCoverageData for valid test JSON array', () => {
    const data = [validTestItem];
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('TestCoverageData');
  });

  it('returns Unknown when deploy item missing path field', () => {
    const data = { MyClass: { ...validDeployItem, path: undefined } };
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when deploy item missing fnMap field', () => {
    const data = { MyClass: { ...validDeployItem, fnMap: undefined } };
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when deploy item missing s field', () => {
    const data = { MyClass: { ...validDeployItem, s: undefined } };
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when statementMap has invalid start position (missing line)', () => {
    const badItem = {
      ...validDeployItem,
      statementMap: {
        '1': { start: { column: 0 }, end: { line: 1, column: 0 } },
      },
    };
    const data = { MyClass: badItem };
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when statementMap has invalid end position (missing column)', () => {
    const badItem = {
      ...validDeployItem,
      statementMap: {
        '1': { start: { line: 1, column: 0 }, end: { line: 1 } },
      },
    };
    const data = { MyClass: badItem };
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when test item missing id field', () => {
    const data = [{ ...validTestItem, id: undefined }];
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when test item missing name field', () => {
    const data = [{ ...validTestItem, name: undefined }];
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when test item totalLines is not a number', () => {
    const data = [{ ...validTestItem, totalLines: 'five' }];
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when test item lines has non-number value', () => {
    const data = [{ ...validTestItem, lines: { '1': 'yes' } }];
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when test item lines is not an object', () => {
    const data = [{ ...validTestItem, lines: 'not-an-object' }];
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns DeployCoverageData for empty object (isDeployCoverageData checks first)', () => {
    // Empty object: Object.entries({}) is [], every() vacuously true -> DeployCoverageData
    expect(checkCoverageDataType({} as DeployCoverageData)).toBe('DeployCoverageData');
  });

  it('returns Unknown when statementMap entry is null', () => {
    const badItem = {
      ...validDeployItem,
      statementMap: { '1': null },
    };
    const data = { MyClass: badItem };
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when test item coveredPercent is not a number', () => {
    const data = [{ ...validTestItem, coveredPercent: '80%' }];
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });

  it('returns Unknown when test item totalCovered is not a number', () => {
    const data = [{ ...validTestItem, totalCovered: null }];
    expect(checkCoverageDataType(data as unknown as DeployCoverageData)).toBe('Unknown');
  });
});
