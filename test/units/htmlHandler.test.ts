'use strict';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import { getCoverageHandler } from '../../src/handlers/getHandler.js';
import { generateAndWriteReport } from '../../src/transformers/reportGenerator.js';
import type { HtmlCoverageObject } from '../../src/utils/types.js';

describe('HTML coverage handler unit tests', () => {
  it('accumulates multiple files in same directory (hits existing branch)', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/main/default/classes/A.cls', 'A', { '1': 1, '2': 1 });
    handler.processFile('force-app/main/default/classes/B.cls', 'B', { '1': 0, '2': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.packageSummaries).toHaveLength(1);
    expect(result.packageSummaries[0].directory).toBe('force-app');
    expect(result.packageSummaries[0].fileCount).toBe(2);
    expect(result.files).toHaveLength(2);
    // Files sorted by path within same directory
    expect(result.files[0].filePath).toBe('force-app/main/default/classes/A.cls');
    expect(result.files[1].filePath).toBe('force-app/main/default/classes/B.cls');
  });

  it('handles package with zero total lines (empty coverage)', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/main/default/classes/Empty.cls', 'Empty', {});
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.packageSummaries).toHaveLength(1);
    expect(result.packageSummaries[0].totalLines).toBe(0);
    expect(result.packageSummaries[0].lineRate).toBe(0);
  });

  it('generates HTML with low and medium coverage (color branches for reportGenerator)', async () => {
    const handler = getCoverageHandler('html');
    // Low coverage: 1/3 = 33% (red #f44336)
    handler.processFile('force-app/main/default/classes/Low.cls', 'Low', { '1': 1, '2': 0, '3': 0 });
    // Medium coverage: 2/3 = 67% (orange #ff9800)
    handler.processFile('other-app/main/default/classes/Med.cls', 'Med', { '1': 1, '2': 1, '3': 0 });
    const result = handler.finalize() as HtmlCoverageObject;
    const tmpDir = await mkdtemp(join(tmpdir(), 'html-colors-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.html'), result, 'html', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('Code Coverage Report');
      expect(content).toContain('Package directory coverage');
      expect(content).toContain('#f44336');
      expect(content).toContain('#ff9800');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('generates HTML with medium summary coverage (orange)', async () => {
    const handler = getCoverageHandler('html');
    // 4 covered, 2 uncovered = 67% summary (orange)
    handler.processFile('force-app/main/default/classes/A.cls', 'A', { '1': 1, '2': 1, '3': 0 });
    handler.processFile('force-app/main/default/classes/B.cls', 'B', { '1': 1, '2': 1, '3': 0 });
    const result = handler.finalize() as HtmlCoverageObject;
    const tmpDir = await mkdtemp(join(tmpdir(), 'html-orange-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.html'), result, 'html', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('Code Coverage Report');
      expect(content).toContain('#ff9800');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('generates HTML with paths requiring escapeHtml (covers escapeHtml function)', async () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/main/default/classes/A&B.cls', 'A&B', { '1': 1 });
    handler.processFile('other-app/main/default/classes/C<D>.cls', 'C<D>', { '1': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    const tmpDir = await mkdtemp(join(tmpdir(), 'html-escape-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.html'), result, 'html', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('&amp;');
      expect(content).toContain('&lt;');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('generates HTML with line lacking content property (buildLineRow content undefined branch)', async () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/main/default/classes/NoContent.cls', 'NoContent', { '1': 1 }, undefined);
    const result = handler.finalize() as HtmlCoverageObject;
    // Manually remove content from lines to hit the content === undefined branch in buildLineRow
    result.files[0].lines = result.files[0].lines.map(({ lineNumber, hitCount, covered }) => ({
      lineNumber,
      hitCount,
      covered,
    }));
    const tmpDir = await mkdtemp(join(tmpdir(), 'html-nocontent-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.html'), result, 'html', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('Code Coverage Report');
      expect(content).toContain('<td class="line-content"></td>');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('generates HTML with empty coverage (no package summary section)', async () => {
    const handler = getCoverageHandler('html');
    const result = handler.finalize();
    const tmpDir = await mkdtemp(join(tmpdir(), 'html-empty-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.html'), result, 'html', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('Code Coverage Report');
      expect(content).not.toContain('Package directory coverage');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('sets covered=false for lines with hitCount of 0', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/A.cls', 'A', { '1': 1, '2': 0, '3': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    const line2 = result.files[0].lines.find((l) => l.lineNumber === 2);
    expect(line2).toBeDefined();
    expect(line2!.covered).toBe(false);
    expect(line2!.hitCount).toBe(0);
  });

  it('sets covered=true for lines with hitCount greater than 1', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/A.cls', 'A', { '1': 5 });
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.files[0].lines[0].covered).toBe(true);
    expect(result.files[0].lines[0].hitCount).toBe(5);
    expect(result.files[0].lines[0].lineNumber).toBe(1);
  });

  it('sorts lines by lineNumber ascending within a file', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/A.cls', 'A', { '5': 1, '2': 0, '8': 1, '1': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    const lineNumbers = result.files[0].lines.map((l) => l.lineNumber);
    expect(lineNumbers).toEqual([1, 2, 5, 8]);
  });

  it('calculates exact uncoveredLines and lineRate in summary', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/A.cls', 'A', { '1': 1, '2': 0, '3': 0, '4': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.summary.totalLines).toBe(4);
    expect(result.summary.coveredLines).toBe(2);
    expect(result.summary.uncoveredLines).toBe(2);
    expect(result.summary.lineRate).toBe(0.5);
  });

  it('calculates exact packageSummary uncoveredLines and lineRate for single file', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('pkg-a/A.cls', 'A', { '1': 1, '2': 0, '3': 0 });
    const result = handler.finalize() as HtmlCoverageObject;
    const pkg = result.packageSummaries[0];
    expect(pkg.totalLines).toBe(3);
    expect(pkg.coveredLines).toBe(1);
    expect(pkg.uncoveredLines).toBe(2);
    expect(pkg.lineRate).toBeCloseTo(1 / 3, 10);
  });

  it('accumulates totalLines, coveredLines, and uncoveredLines across multiple files in same package', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/A.cls', 'A', { '1': 1, '2': 1 }); // 2 total, 2 covered
    handler.processFile('force-app/B.cls', 'B', { '1': 0, '2': 1 }); // 2 total, 1 covered
    const result = handler.finalize() as HtmlCoverageObject;
    const pkg = result.packageSummaries[0];
    expect(pkg.totalLines).toBe(4);
    expect(pkg.coveredLines).toBe(3);
    expect(pkg.uncoveredLines).toBe(1);
    expect(pkg.fileCount).toBe(2);
  });

  it('extracts directory from first path segment only', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('my-app/main/default/classes/A.cls', 'A', { '1': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.packageSummaries[0].directory).toBe('my-app');
  });

  it('sorts packageSummaries alphabetically by directory name', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('z-pkg/A.cls', 'A', { '1': 1 });
    handler.processFile('a-pkg/B.cls', 'B', { '1': 1 });
    handler.processFile('m-pkg/C.cls', 'C', { '1': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.packageSummaries.map((p) => p.directory)).toEqual(['a-pkg', 'm-pkg', 'z-pkg']);
  });

  it('sorts files by package directory first then by file path', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('b-app/z.cls', 'z', { '1': 1 });
    handler.processFile('a-app/a.cls', 'a', { '1': 1 });
    handler.processFile('b-app/a.cls', 'a', { '1': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.files.map((f) => f.filePath)).toEqual(['a-app/a.cls', 'b-app/a.cls', 'b-app/z.cls']);
  });

  it('assigns source line content from sourceContent split by newline', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/A.cls', 'A', { '1': 1, '2': 0, '3': 1 }, 'line1\nline2\nline3');
    const result = handler.finalize() as HtmlCoverageObject;
    const lines = result.files[0].lines;
    expect(lines.find((l) => l.lineNumber === 1)?.content).toBe('line1');
    expect(lines.find((l) => l.lineNumber === 2)?.content).toBe('line2');
    expect(lines.find((l) => l.lineNumber === 3)?.content).toBe('line3');
  });

  it('splits sourceContent on CRLF line endings correctly', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/A.cls', 'A', { '1': 1, '2': 1, '3': 1 }, 'first\r\nsecond\r\nthird');
    const result = handler.finalize() as HtmlCoverageObject;
    const lines = result.files[0].lines;
    expect(lines.find((l) => l.lineNumber === 1)?.content).toBe('first');
    expect(lines.find((l) => l.lineNumber === 2)?.content).toBe('second');
    expect(lines.find((l) => l.lineNumber === 3)?.content).toBe('third');
  });

  it('accumulates fileCount per package directory', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/A.cls', 'A', { '1': 1 });
    handler.processFile('force-app/B.cls', 'B', { '1': 1 });
    handler.processFile('force-app/C.cls', 'C', { '1': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.packageSummaries[0].fileCount).toBe(3);
  });

  it('summary lineRate is 0 when no files processed', () => {
    const handler = getCoverageHandler('html');
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.summary.totalLines).toBe(0);
    expect(result.summary.coveredLines).toBe(0);
    expect(result.summary.uncoveredLines).toBe(0);
    expect(result.summary.lineRate).toBe(0);
  });

  // ── ArrayDeclaration mutant killer (html.ts:51 — else [] vs else ["Stryker was here"]) ──
  // Mutant: when sourceContent is falsy, sourceLines = ["Stryker was here"] instead of [].
  // For line 1, sourceLines[0] ?? '' gives "Stryker was here" instead of ''.

  it('line content is empty string when no sourceContent is provided', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('force-app/A.cls', 'A', { '1': 1 });
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.files[0].lines[0].content).toBe('');
  });

  // ── StringLiteral mutant killer (html.ts:56 — ?? '' vs ?? "Stryker was here!") ──
  // Mutant: when sourceLines[num-1] is undefined (line number beyond content), fallback is
  // "Stryker was here!" instead of ''.

  it('line content is empty string when line number exceeds sourceContent line count', () => {
    const handler = getCoverageHandler('html');
    // sourceContent has only 2 lines but coverage reports line 3
    handler.processFile('force-app/A.cls', 'A', { '3': 1 }, 'line1\nline2');
    const result = handler.finalize() as HtmlCoverageObject;
    const line3 = result.files[0].lines.find((l) => l.lineNumber === 3);
    expect(line3).toBeDefined();
    expect(line3!.content).toBe('');
  });

  it('calculates summary lineRate correctly across multiple files', () => {
    const handler = getCoverageHandler('html');
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 1 }); // 2/2
    handler.processFile('pkg/B.cls', 'B', { '1': 0, '2': 0 }); // 0/2
    const result = handler.finalize() as HtmlCoverageObject;
    expect(result.summary.totalLines).toBe(4);
    expect(result.summary.coveredLines).toBe(2);
    expect(result.summary.uncoveredLines).toBe(2);
    expect(result.summary.lineRate).toBe(0.5);
  });
});
