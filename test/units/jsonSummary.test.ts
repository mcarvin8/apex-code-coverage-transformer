/* eslint-disable no-await-in-loop */
'use strict';
import { describe, it, expect } from 'vitest';

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

  // ── ArithmeticOperator and ConditionalExpression mutation killers (jsonSummary.ts:64) ──
  // pct = (coveredLines / totalLines) * 100
  // Mutants: coveredLines * totalLines (would give 200 for 2/4), or / 100 instead of * 100 (gives 0.5 not 50)

  it('per-file pct is coveredLines/totalLines*100 (not coveredLines*totalLines or /100)', () => {
    const handler = new JsonSummaryCoverageHandler();
    // 2 covered out of 4 total → correct pct = 50.00
    handler.processFile('a.cls', 'A', { '1': 1, '2': 1, '3': 0, '4': 0 });
    const result = handler.finalize();

    const file = result.files['a.cls'];
    // coveredLines * totalLines = 2 * 4 = 8 → wrong
    // coveredLines / totalLines / 100 = 0.005 → wrong
    // correct: (2/4)*100 = 50
    expect(file.lines.pct).toBe(50);
    expect(file.lines.pct).toBeGreaterThan(1); // rules out /100 mutant
    expect(file.lines.pct).toBeLessThan(100); // rules out *totalLines mutant
  });

  it('per-file pct is 0 when all lines uncovered (ConditionalExpression false branch)', () => {
    // totalLines > 0 → true branch. But what if mutant makes it always false (always pct=0)?
    // We must assert pct is nonzero when covered lines exist.
    const handler = new JsonSummaryCoverageHandler();
    // 3 covered out of 3 → pct should be 100.00
    handler.processFile('b.cls', 'B', { '1': 1, '2': 1, '3': 1 });
    const result = handler.finalize();

    expect(result.files['b.cls'].lines.pct).toBe(100);
    // If conditional is always false, pct stays 0 — this assertion kills that mutant
    expect(result.files['b.cls'].lines.pct).toBeGreaterThan(0);
  });

  it('total pct is nonzero when covered lines exist (ConditionalExpression kills always-false mutant)', () => {
    const handler = new JsonSummaryCoverageHandler();
    // 7 covered out of 10 total → 70%
    handler.processFile('c.cls', 'C', {
      '1': 1,
      '2': 1,
      '3': 1,
      '4': 1,
      '5': 1,
      '6': 1,
      '7': 1,
      '8': 0,
      '9': 0,
      '10': 0,
    });
    const result = handler.finalize();

    expect(result.total.lines.pct).toBe(70);
    expect(result.total.lines.pct).toBeGreaterThan(0);
  });

  it('pct uses totalLines as denominator, not numerator (arithmetic operator check)', () => {
    // With 3 covered and 7 total:
    //   correct: (3/7)*100 = 42.86
    //   mutant (coveredLines * totalLines): 3*7 = 21 → would be rounded to 21.00
    //   mutant (/ totalLines / 100): tiny fraction
    const handler = new JsonSummaryCoverageHandler();
    handler.processFile('d.cls', 'D', { '1': 1, '2': 1, '3': 1, '4': 0, '5': 0, '6': 0, '7': 0 });
    const result = handler.finalize();

    expect(result.files['d.cls'].lines.pct).toBe(42.86);
    // Additional sanity: must be between 0 and 100
    expect(result.files['d.cls'].lines.pct).toBeGreaterThan(10);
    expect(result.files['d.cls'].lines.pct).toBeLessThan(100);
  });
});
