/* eslint-disable no-await-in-loop */
'use strict';
import { describe, it, expect } from '@jest/globals';

import { JsonSummaryCoverageHandler } from '../../src/handlers/jsonSummary.js';

describe('JsonSummaryCoverageHandler unit tests', () => {
  it('should process file with coverage data', () => {
    const handler = new JsonSummaryCoverageHandler();
    const lines = {
      '1': 1,
      '2': 0,
      '3': 1,
    };

    handler.processFile('path/to/file.cls', 'FileName', lines);
    const result = handler.finalize();

    expect(result.total.lines.total).toBe(3);
    expect(result.total.lines.covered).toBe(2);
    expect(result.total.lines.pct).toBe(66.67);
    expect(result.files['path/to/file.cls']).toBeDefined();
    expect(result.files['path/to/file.cls'].lines.total).toBe(3);
    expect(result.files['path/to/file.cls'].lines.covered).toBe(2);
  });

  it('should handle file with zero total lines', () => {
    const handler = new JsonSummaryCoverageHandler();
    const lines = {}; // Empty lines object

    handler.processFile('path/to/empty.cls', 'EmptyFile', lines);
    const result = handler.finalize();

    // When totalLines is 0, pct should be 0 (covers the else branch on line 48)
    expect(result.files['path/to/empty.cls'].lines.total).toBe(0);
    expect(result.files['path/to/empty.cls'].lines.covered).toBe(0);
    expect(result.files['path/to/empty.cls'].lines.pct).toBe(0);
  });

  it('should calculate correct percentages', () => {
    const handler = new JsonSummaryCoverageHandler();

    // File 1: 75% coverage
    handler.processFile('file1.cls', 'File1', {
      '1': 1,
      '2': 1,
      '3': 1,
      '4': 0,
    });

    // File 2: 100% coverage
    handler.processFile('file2.cls', 'File2', {
      '1': 1,
      '2': 1,
    });

    const result = handler.finalize();

    // Total: 6 lines, 5 covered = 83.33%
    expect(result.total.lines.total).toBe(6);
    expect(result.total.lines.covered).toBe(5);
    expect(result.total.lines.pct).toBe(83.33);
  });
});
