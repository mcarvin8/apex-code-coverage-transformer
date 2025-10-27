/* eslint-disable no-await-in-loop */
'use strict';
import { describe, it, expect } from '@jest/globals';

import { BaseHandler } from '../../src/handlers/BaseHandler.js';
import type {
  SonarCoverageObject,
  CoberturaCoverageObject,
  CloverCoverageObject,
  LcovCoverageObject,
  JaCoCoCoverageObject,
  IstanbulCoverageObject,
  JsonSummaryCoverageObject,
  SimpleCovCoverageObject,
  OpenCoverCoverageObject,
} from '../../src/utils/types.js';

// Create a concrete implementation for testing
class TestHandler extends BaseHandler {
  private data: string[] = [];

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    this.data.push(`${filePath}:${fileName}`);
    // Use protected methods for testing
    const coverage = this.calculateCoverage(lines);
    const byStatus = this.getCoveredAndUncovered(lines);
    this.data.push(`total:${coverage.totalLines},covered:${coverage.coveredLines}`);
    this.data.push(`covered-lines:${byStatus.covered.join(',')}`);
  }

  public finalize():
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject
    | IstanbulCoverageObject
    | JsonSummaryCoverageObject
    | SimpleCovCoverageObject
    | OpenCoverCoverageObject {
    return { data: this.data } as unknown as
      | SonarCoverageObject
      | CoberturaCoverageObject
      | CloverCoverageObject
      | LcovCoverageObject
      | JaCoCoCoverageObject
      | IstanbulCoverageObject
      | JsonSummaryCoverageObject
      | SimpleCovCoverageObject
      | OpenCoverCoverageObject;
  }

  // Expose protected methods for testing
  public testCalculateCoverage(lines: Record<string, number>) {
    return this.calculateCoverage(lines);
  }

  public testExtractLinesByStatus(lines: Record<string, number>, covered: boolean) {
    return this.extractLinesByStatus(lines, covered);
  }

  public testGetCoveredAndUncovered(lines: Record<string, number>) {
    return this.getCoveredAndUncovered(lines);
  }

  public testSortByPath<T extends { '@path'?: string; '@filename'?: string; '@name'?: string }>(items: T[]): T[] {
    return this.sortByPath(items);
  }
}

describe('BaseHandler unit tests', () => {
  it('should calculate coverage correctly', () => {
    const handler = new TestHandler();
    const lines = {
      '1': 1,
      '2': 1,
      '3': 0,
      '4': 1,
      '5': 0,
    };

    const result = handler.testCalculateCoverage(lines);
    expect(result.totalLines).toBe(5);
    expect(result.coveredLines).toBe(3);
    expect(result.uncoveredLines).toBe(2);
    expect(result.lineRate).toBe(0.6); // 3/5
  });

  it('should calculate coverage for all covered lines', () => {
    const handler = new TestHandler();
    const lines = {
      '1': 1,
      '2': 1,
      '3': 1,
    };

    const result = handler.testCalculateCoverage(lines);
    expect(result.totalLines).toBe(3);
    expect(result.coveredLines).toBe(3);
    expect(result.uncoveredLines).toBe(0);
    expect(result.lineRate).toBe(1.0);
  });

  it('should calculate coverage for no covered lines', () => {
    const handler = new TestHandler();
    const lines = {
      '1': 0,
      '2': 0,
    };

    const result = handler.testCalculateCoverage(lines);
    expect(result.totalLines).toBe(2);
    expect(result.coveredLines).toBe(0);
    expect(result.uncoveredLines).toBe(2);
    expect(result.lineRate).toBe(0);
  });

  it('should extract covered lines correctly', () => {
    const handler = new TestHandler();
    const lines = {
      '5': 1,
      '2': 0,
      '8': 1,
      '1': 1,
      '3': 0,
    };

    const covered = handler.testExtractLinesByStatus(lines, true);
    expect(covered).toEqual([1, 5, 8]); // Sorted
  });

  it('should extract uncovered lines correctly', () => {
    const handler = new TestHandler();
    const lines = {
      '5': 1,
      '2': 0,
      '8': 1,
      '1': 1,
      '3': 0,
    };

    const uncovered = handler.testExtractLinesByStatus(lines, false);
    expect(uncovered).toEqual([2, 3]); // Sorted
  });

  it('should get both covered and uncovered lines', () => {
    const handler = new TestHandler();
    const lines = {
      '1': 1,
      '2': 0,
      '3': 1,
      '4': 0,
    };

    const result = handler.testGetCoveredAndUncovered(lines);
    expect(result.covered).toEqual([1, 3]);
    expect(result.uncovered).toEqual([2, 4]);
  });

  it('should sort items by @path', () => {
    const handler = new TestHandler();
    const items = [{ '@path': 'zzz/file.cls' }, { '@path': 'aaa/file.cls' }, { '@path': 'mmm/file.cls' }];

    const sorted = handler.testSortByPath(items);
    expect(sorted[0]['@path']).toBe('aaa/file.cls');
    expect(sorted[1]['@path']).toBe('mmm/file.cls');
    expect(sorted[2]['@path']).toBe('zzz/file.cls');
  });

  it('should sort items by @filename when @path is missing', () => {
    const handler = new TestHandler();
    const items = [{ '@filename': 'zzz.cls' }, { '@filename': 'aaa.cls' }, { '@filename': 'mmm.cls' }];

    const sorted = handler.testSortByPath(items);
    expect(sorted[0]['@filename']).toBe('aaa.cls');
    expect(sorted[1]['@filename']).toBe('mmm.cls');
    expect(sorted[2]['@filename']).toBe('zzz.cls');
  });

  it('should sort items by @name when @path and @filename are missing', () => {
    const handler = new TestHandler();
    const items = [{ '@name': 'zzz' }, { '@name': 'aaa' }, { '@name': 'mmm' }];

    const sorted = handler.testSortByPath(items);
    expect(sorted[0]['@name']).toBe('aaa');
    expect(sorted[1]['@name']).toBe('mmm');
    expect(sorted[2]['@name']).toBe('zzz');
  });

  it('should sort items with missing path properties using empty string', () => {
    const handler = new TestHandler();
    type ItemType = { [key: string]: unknown; '@path'?: string; '@filename'?: string; '@name'?: string };
    const items: ItemType[] = [{ other: 'value' }, { '@name': 'aaa' }, { other2: 'value2' }];

    const sorted = handler.testSortByPath(items);
    // Items without any path property get empty string, so they sort first
    // Then the one with '@name': 'aaa' comes after
    expect(sorted.length).toBe(3);
  });

  it('should handle empty lines in calculateCoverage', () => {
    const handler = new TestHandler();
    const lines = {};

    const result = handler.testCalculateCoverage(lines);
    expect(result.totalLines).toBe(0);
    expect(result.coveredLines).toBe(0);
    expect(result.uncoveredLines).toBe(0);
    expect(result.lineRate).toBe(0);
  });

  it('should process file using base handler methods', () => {
    const handler = new TestHandler();
    const lines = {
      '1': 1,
      '2': 0,
      '3': 1,
    };

    handler.processFile('path/to/file.cls', 'FileName', lines);
    const result = handler.finalize();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((result as any).data).toContain('path/to/file.cls:FileName');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((result as any).data).toContain('total:3,covered:2');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((result as any).data).toContain('covered-lines:1,3');
  });
});
