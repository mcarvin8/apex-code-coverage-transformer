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
});
