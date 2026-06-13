'use strict';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import { GitHubActionsCoverageHandler } from '../../src/handlers/githubActions.js';
import { generateAndWriteReport } from '../../src/transformers/reportGenerator.js';

describe('GitHubActionsCoverageHandler unit tests', () => {
  it('captures uncovered lines and computes the overall summary', () => {
    const handler = new GitHubActionsCoverageHandler();
    handler.processFile('force-app/main/default/classes/A.cls', 'A', { '1': 1, '2': 0, '3': 0 });
    handler.processFile('force-app/main/default/classes/B.cls', 'B', { '1': 1, '2': 1 });
    const result = handler.finalize();

    expect(result.summary.totalLines).toBe(5);
    expect(result.summary.coveredLines).toBe(3);
    expect(result.summary.uncoveredLines).toBe(2);
    expect(result.summary.fileCount).toBe(2);
    expect(result.uncoveredLines).toEqual([
      { filePath: 'force-app/main/default/classes/A.cls', lineNumber: 2 },
      { filePath: 'force-app/main/default/classes/A.cls', lineNumber: 3 },
    ]);
  });

  it('sorts annotations by file path then line number', () => {
    const handler = new GitHubActionsCoverageHandler();
    handler.processFile('z/Last.cls', 'Last', { '5': 0, '1': 0 });
    handler.processFile('a/First.cls', 'First', { '10': 0, '2': 0 });
    const result = handler.finalize();

    expect(result.uncoveredLines).toEqual([
      { filePath: 'a/First.cls', lineNumber: 2 },
      { filePath: 'a/First.cls', lineNumber: 10 },
      { filePath: 'z/Last.cls', lineNumber: 1 },
      { filePath: 'z/Last.cls', lineNumber: 5 },
    ]);
  });

  it('handles a file with no uncovered lines without emitting annotations', () => {
    const handler = new GitHubActionsCoverageHandler();
    handler.processFile('force-app/main/default/classes/Full.cls', 'Full', { '1': 1, '2': 1 });
    const result = handler.finalize();

    expect(result.summary.uncoveredLines).toBe(0);
    expect(result.uncoveredLines).toHaveLength(0);
  });

  it('returns a zero line rate when finalize runs without any processed files', () => {
    const handler = new GitHubActionsCoverageHandler();
    const result = handler.finalize();

    expect(result.summary.totalLines).toBe(0);
    expect(result.summary.coveredLines).toBe(0);
    expect(result.summary.uncoveredLines).toBe(0);
    expect(result.summary.lineRate).toBe(0);
    expect(result.summary.fileCount).toBe(0);
    expect(result.uncoveredLines).toHaveLength(0);
  });

  it('renders workflow commands with escaped property values', async () => {
    const handler = new GitHubActionsCoverageHandler();
    handler.processFile('force-app/main/default/classes/A.cls', 'A', { '1': 0, '2': 1 });
    const result = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'gha-report-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.txt'), result, 'github-actions', 1);
      expect(outPath.endsWith('.txt')).toBe(true);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('::notice title=Apex Code Coverage::');
      expect(content).toContain(
        '::warning file=force-app/main/default/classes/A.cls,line=1,title=Uncovered Apex line::Line 1 is not covered by any Apex test',
      );
      // % must be escaped to %25 in workflow command data
      expect(content).toContain('50.00%25');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('respects a custom maxAnnotations override passed via generateAndWriteReport options', async () => {
    const handler = new GitHubActionsCoverageHandler();
    handler.processFile('force-app/main/default/classes/A.cls', 'A', { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 });
    const result = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'gha-override-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.txt'), result, 'github-actions', 1, {
        maxAnnotations: 2,
      });
      const content = await readFile(outPath, 'utf-8');
      const warningLines = content.split('\n').filter((l) => l.startsWith('::warning'));
      const noticeLines = content.split('\n').filter((l) => l.startsWith('::notice'));
      expect(warningLines).toHaveLength(2);
      expect(noticeLines).toHaveLength(2); // summary + truncation
      expect(noticeLines[1]).toContain('3 additional uncovered line');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('caps annotations at 50 and emits a truncation notice for the remainder', async () => {
    const handler = new GitHubActionsCoverageHandler();
    // 60 uncovered lines across one file
    const lines: Record<string, number> = {};
    for (let i = 1; i <= 60; i++) lines[String(i)] = 0;
    handler.processFile('force-app/main/default/classes/Big.cls', 'Big', lines);
    const result = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'gha-cap-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.txt'), result, 'github-actions', 1);
      const content = await readFile(outPath, 'utf-8');
      const warningLines = content.split('\n').filter((l) => l.startsWith('::warning'));
      const noticeLines = content.split('\n').filter((l) => l.startsWith('::notice'));
      expect(warningLines).toHaveLength(50);
      expect(noticeLines).toHaveLength(2); // summary + truncation
      expect(noticeLines[1]).toContain('10 additional uncovered line');
      expect(noticeLines[1]).toContain('not shown');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('uses singular "line" in truncation notice when exactly 1 line is truncated', async () => {
    const handler = new GitHubActionsCoverageHandler();
    // 51 uncovered lines → 1 truncated
    const lines: Record<string, number> = {};
    for (let i = 1; i <= 51; i++) lines[String(i)] = 0;
    handler.processFile('force-app/main/default/classes/Big.cls', 'Big', lines);
    const result = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'gha-singular-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.txt'), result, 'github-actions', 1);
      const content = await readFile(outPath, 'utf-8');
      const noticeLines = content.split('\n').filter((l) => l.startsWith('::notice'));
      expect(noticeLines[1]).toContain('1 additional uncovered line ');
      expect(noticeLines[1]).not.toContain('lines');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('emits no truncation notice when uncovered lines are within the cap', async () => {
    const handler = new GitHubActionsCoverageHandler();
    handler.processFile('force-app/main/default/classes/A.cls', 'A', { '1': 0, '2': 1 });
    const result = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'gha-nocap-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.txt'), result, 'github-actions', 1);
      const content = await readFile(outPath, 'utf-8');
      const noticeLines = content.split('\n').filter((l) => l.startsWith('::notice'));
      expect(noticeLines).toHaveLength(1); // summary only, no truncation
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('escapes commas and colons in file paths for workflow command properties', async () => {
    const handler = new GitHubActionsCoverageHandler();
    // Salesforce paths shouldn't contain these, but protect against odd inputs
    handler.processFile('force-app/main/default/classes/A,B:C.cls', 'A,B:C', { '1': 0 });
    const result = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'gha-escape-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.txt'), result, 'github-actions', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('A%2CB%3AC.cls');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  // ── ArithmeticOperator mutation killer (githubActions.ts:79) ──
  // Sort: a.lineNumber - b.lineNumber (ascending). Mutant: a.lineNumber + b.lineNumber (not a subtraction).
  // If the comparator always returns a positive sum, lines would not be reordered.

  it('sorts uncovered lines by path then by line number ascending (not addition)', () => {
    const handler = new GitHubActionsCoverageHandler();
    // Single file, multiple lines to test line-number sort
    handler.processFile('a/File.cls', 'File', { '10': 0, '3': 0, '7': 0, '1': 0 });
    const result = handler.finalize();

    const lineNumbers = result.uncoveredLines.filter((u) => u.filePath === 'a/File.cls').map((u) => u.lineNumber);

    // Correct ascending sort: 1, 3, 7, 10
    // Mutant (addition): a+b is always positive, so sort is unstable/wrong
    expect(lineNumbers).toEqual([1, 3, 7, 10]);
  });

  it('sorts uncovered lines from multiple files: path sort takes precedence over line sort', () => {
    const handler = new GitHubActionsCoverageHandler();
    handler.processFile('z/Last.cls', 'Last', { '1': 0, '2': 0 });
    handler.processFile('a/First.cls', 'First', { '5': 0, '3': 0 });
    const result = handler.finalize();

    // Path comparison uses localeCompare — 'a/First.cls' < 'z/Last.cls'
    expect(result.uncoveredLines[0].filePath).toBe('a/First.cls');
    expect(result.uncoveredLines[1].filePath).toBe('a/First.cls');
    expect(result.uncoveredLines[2].filePath).toBe('z/Last.cls');
    expect(result.uncoveredLines[3].filePath).toBe('z/Last.cls');
    // Line numbers within each file must also be ascending
    expect(result.uncoveredLines[0].lineNumber).toBe(3);
    expect(result.uncoveredLines[1].lineNumber).toBe(5);
  });

  // ── ConditionalExpression mutation killer (githubActions.ts:78) ──
  // Condition: if (pathCompare !== 0) return pathCompare
  // Mutant: always true → always returns pathCompare even when files are the same → line sort never runs

  it('applies line-number sort when two uncovered entries share the same file path', () => {
    const handler = new GitHubActionsCoverageHandler();
    handler.processFile('same/File.cls', 'File', { '20': 0, '5': 0, '15': 0 });
    const result = handler.finalize();

    const lineNumbers = result.uncoveredLines.map((u) => u.lineNumber);
    expect(lineNumbers).toEqual([5, 15, 20]);
  });

  // ── ObjectLiteral mutation killer (githubActions.ts:38) ──
  // Mutant replaces the initial coverageObj literal with {}. The finalize() call would fail
  // or produce undefined summaries.

  it('finalize returns a properly structured object with summary and uncoveredLines', () => {
    const handler = new GitHubActionsCoverageHandler();
    handler.processFile('a/File.cls', 'File', { '1': 1, '2': 0 });
    const result = handler.finalize();
    // If constructor uses {} instead of full object, these would be undefined
    expect(result.summary).toBeDefined();
    expect(result.uncoveredLines).toBeDefined();
    expect(Array.isArray(result.uncoveredLines)).toBe(true);
    expect(result.summary.totalLines).toBe(2);
    expect(result.summary.coveredLines).toBe(1);
    expect(result.summary.uncoveredLines).toBe(1);
    expect(result.summary.lineRate).toBeCloseTo(0.5);
    expect(result.summary.fileCount).toBe(1);
  });
});
