'use strict';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect } from '@jest/globals';

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
});
