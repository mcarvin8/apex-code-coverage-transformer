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
