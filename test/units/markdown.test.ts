'use strict';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import { MarkdownCoverageHandler } from '../../src/handlers/markdown.js';
import { generateAndWriteReport } from '../../src/transformers/reportGenerator.js';

describe('MarkdownCoverageHandler unit tests', () => {
  it('produces an overall summary, package table, and file table', () => {
    const handler = new MarkdownCoverageHandler();
    handler.processFile('force-app/main/default/classes/A.cls', 'A', { '1': 1, '2': 1, '3': 0 });
    handler.processFile('force-app/main/default/classes/B.cls', 'B', { '1': 1, '2': 0 });
    const result = handler.finalize();

    expect(result.summary.totalLines).toBe(5);
    expect(result.summary.coveredLines).toBe(3);
    expect(result.summary.uncoveredLines).toBe(2);
    expect(result.summary.fileCount).toBe(2);
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0].directory).toBe('force-app');
    expect(result.packages[0].fileCount).toBe(2);
  });

  it('sorts files with the lowest coverage first, ties broken by path', () => {
    const handler = new MarkdownCoverageHandler();
    handler.processFile('force-app/main/default/classes/Hi.cls', 'Hi', { '1': 1, '2': 1 });
    handler.processFile('force-app/main/default/classes/Lo.cls', 'Lo', { '1': 0, '2': 0 });
    handler.processFile('force-app/main/default/classes/Mid.cls', 'Mid', { '1': 1, '2': 0 });
    const result = handler.finalize();

    expect(result.files.map((f) => f.filePath)).toEqual([
      'force-app/main/default/classes/Lo.cls',
      'force-app/main/default/classes/Mid.cls',
      'force-app/main/default/classes/Hi.cls',
    ]);
  });

  it('handles empty input gracefully', () => {
    const handler = new MarkdownCoverageHandler();
    const result = handler.finalize();

    expect(result.summary.totalLines).toBe(0);
    expect(result.summary.lineRate).toBe(0);
    expect(result.summary.fileCount).toBe(0);
    expect(result.packages).toHaveLength(0);
    expect(result.files).toHaveLength(0);
  });

  it('returns a zero line rate for a package whose files have no lines', () => {
    const handler = new MarkdownCoverageHandler();
    handler.processFile('force-app/main/default/classes/Empty.cls', 'Empty', {});
    const result = handler.finalize();

    expect(result.packages).toHaveLength(1);
    expect(result.packages[0].directory).toBe('force-app');
    expect(result.packages[0].totalLines).toBe(0);
    expect(result.packages[0].coveredLines).toBe(0);
    expect(result.packages[0].lineRate).toBe(0);
  });

  it('omits the package and file table sections when there is no data', async () => {
    const handler = new MarkdownCoverageHandler();
    const result = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'md-empty-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.md'), result, 'markdown', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('# Apex Code Coverage Report');
      expect(content).toContain('0.00%');
      expect(content).not.toContain('## Package directory coverage');
      expect(content).not.toContain('## File coverage');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('renders a markdown report with the expected sections', async () => {
    const handler = new MarkdownCoverageHandler();
    handler.processFile('force-app/main/default/classes/A.cls', 'A', { '1': 1, '2': 1, '3': 0 });
    const result = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'md-report-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.md'), result, 'markdown', 1);
      expect(outPath.endsWith('.md')).toBe(true);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('# Apex Code Coverage Report');
      expect(content).toContain('## Package directory coverage');
      expect(content).toContain('## File coverage');
      expect(content).toContain('66.67%');
      expect(content).toContain('force-app/main/default/classes/A.cls');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('escapes pipe characters in file paths so the table renders correctly', async () => {
    const handler = new MarkdownCoverageHandler();
    handler.processFile('force-app/main/default/classes/Weird|Name.cls', 'Weird|Name', { '1': 1 });
    const result = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'md-pipe-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.md'), result, 'markdown', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('Weird\\|Name.cls');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  // ── AssignmentOperator mutation killers (lines 66–67) ──
  // The mutants replace += with -=. If two files share a package directory,
  // the accumulated totals for that package must EXCEED the individual file counts.

  it('accumulates totalLines and coveredLines across multiple files in the same directory (+=, not -=)', () => {
    const handler = new MarkdownCoverageHandler();
    // File A: 4 total, 3 covered
    handler.processFile('force-app/A.cls', 'A', { '1': 1, '2': 1, '3': 1, '4': 0 });
    // File B: 6 total, 4 covered
    handler.processFile('force-app/B.cls', 'B', { '1': 1, '2': 1, '3': 1, '4': 1, '5': 0, '6': 0 });
    const result = handler.finalize();

    expect(result.packages).toHaveLength(1);
    const pkg = result.packages[0];
    // With -=: 4 - 6 = -2 for totalLines, 3 - 4 = -1 for coveredLines → would be wrong
    expect(pkg.totalLines).toBe(10);
    expect(pkg.coveredLines).toBe(7);
    // Both must be positive and match the sum
    expect(pkg.totalLines).toBeGreaterThan(4); // greater than either individual file
    expect(pkg.totalLines).toBeGreaterThan(6);
    expect(pkg.coveredLines).toBeGreaterThan(3);
    expect(pkg.coveredLines).toBeGreaterThan(4);
  });

  it('summary totalLines and coveredLines accumulate correctly across files', () => {
    const handler = new MarkdownCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 1, '3': 1 }); // 3 total, 3 covered
    handler.processFile('pkg/B.cls', 'B', { '1': 1, '2': 0 }); // 2 total, 1 covered
    handler.processFile('pkg/C.cls', 'C', { '1': 0, '2': 0, '3': 0 }); // 3 total, 0 covered
    const result = handler.finalize();

    expect(result.summary.totalLines).toBe(8);
    expect(result.summary.coveredLines).toBe(4);
    expect(result.summary.uncoveredLines).toBe(4);
  });

  // ── ArithmeticOperator mutation killers (markdown.ts lines 78, 90, 91) ──
  // lineRate = coveredLines / totalLines (not * or other operations)
  // pkgUncovered = totalLines - coveredLines (not +)

  it('lineRate in finalize is coveredLines divided by totalLines (not multiplied)', () => {
    const handler = new MarkdownCoverageHandler();
    // 4 covered out of 10 total = 0.4
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 1, '3': 0, '4': 0, '5': 0 }); // 5 total, 2 covered
    handler.processFile('pkg/B.cls', 'B', { '1': 1, '2': 1, '3': 0, '4': 0, '5': 0 }); // 5 total, 2 covered
    const result = handler.finalize();

    // lineRate = 4/10 = 0.4
    // Mutant (coveredLines * totalLines) would give 4 * 10 = 40 → completely different
    expect(result.summary.totalLines).toBe(10);
    expect(result.summary.coveredLines).toBe(4);
    expect(result.summary.lineRate).toBeCloseTo(0.4, 10);
    // Must be ≤ 1 (multiplication would blow past 1)
    expect(result.summary.lineRate).toBeLessThanOrEqual(1);
    expect(result.summary.lineRate).toBeGreaterThan(0);
  });

  it('package lineRate is coveredLines/totalLines and pkgUncovered is totalLines - coveredLines', () => {
    const handler = new MarkdownCoverageHandler();
    // 3 covered, 7 total → lineRate=3/7≈0.4286, uncovered=4
    handler.processFile('force-app/A.cls', 'A', { '1': 1, '2': 1, '3': 1, '4': 0, '5': 0, '6': 0, '7': 0 });
    const result = handler.finalize();

    const pkg = result.packages[0];
    // pkgUncovered mutant: totalLines + coveredLines = 7+3=10 (wrong), correct is 7-3=4
    expect(pkg.uncoveredLines).toBe(4);
    // pkgLineRate mutant: coveredLines * totalLines = 3*7=21 (wrong), correct is 3/7≈0.4286
    expect(pkg.lineRate).toBeCloseTo(3 / 7, 10);
    expect(pkg.lineRate).toBeLessThan(1);
  });

  // ── ArrowFunction mutation killer (markdown.ts:101 — sort callback returns undefined) ──

  it('packages are sorted alphabetically by directory (sort is not a no-op)', () => {
    const handler = new MarkdownCoverageHandler();
    handler.processFile('zebra-pkg/A.cls', 'A', { '1': 1 });
    handler.processFile('alpha-pkg/B.cls', 'B', { '1': 1 });
    handler.processFile('middle-pkg/C.cls', 'C', { '1': 1 });
    const result = handler.finalize();

    const dirs = result.packages.map((p) => p.directory);
    expect(dirs).toEqual(['alpha-pkg', 'middle-pkg', 'zebra-pkg']);
  });

  // ── ConditionalExpression mutation killer (markdown.ts:105 — always true) ──

  // ── ConditionalExpression mutant killer (markdown.ts:105 — if true) ──
  // Mutant: always executes lineRate comparison, skipping path tiebreak entirely.
  // Files with EQUAL lineRates must be tiebroken by filePath.
  // Inserted in wrong alphabetical order so the tiebreak changes the result.
  // Mutant: lineRate equal → 0 → stable sort → insertion order preserved (wrong).

  it('breaks ties by filePath when two files have the same lineRate', () => {
    const handler = new MarkdownCoverageHandler();
    // Both files have 1/2 = 50% coverage; insertion order is path-descending (Z before A)
    handler.processFile('z-pkg/Z.cls', 'Z', { '1': 1, '2': 0 });
    handler.processFile('a-pkg/A.cls', 'A', { '1': 1, '2': 0 });
    const result = handler.finalize();
    // Correct: tiebreak by path → 'a-pkg/A.cls' before 'z-pkg/Z.cls'
    // Mutant (if true): lineRate equal → return 0 → stable → [Z, A] (wrong)
    expect(result.files[0].filePath).toBe('a-pkg/A.cls');
    expect(result.files[1].filePath).toBe('z-pkg/Z.cls');
  });

  it('files with different lineRates are sorted by lineRate ascending (not always same order)', () => {
    const handler = new MarkdownCoverageHandler();
    // 100% covered
    handler.processFile('pkg/Full.cls', 'Full', { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 });
    // 40% covered
    handler.processFile('pkg/Low.cls', 'Low', { '1': 1, '2': 1, '3': 0, '4': 0, '5': 0 });
    // 60% covered
    handler.processFile('pkg/Mid.cls', 'Mid', { '1': 1, '2': 1, '3': 1, '4': 0, '5': 0 });
    const result = handler.finalize();

    const rates = result.files.map((f) => f.lineRate);
    // Mutant "always true" in the sort comparator would break ordering
    expect(rates[0]).toBeLessThan(rates[1]);
    expect(rates[1]).toBeLessThan(rates[2]);
    expect(result.files[0].filePath).toContain('Low');
    expect(result.files[2].filePath).toContain('Full');
  });
});
