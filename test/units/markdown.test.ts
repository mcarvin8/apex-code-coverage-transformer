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
});
