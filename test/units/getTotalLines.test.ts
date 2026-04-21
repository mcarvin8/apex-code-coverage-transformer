'use strict';

import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import { getTotalLines } from '../../src/utils/getTotalLines.js';

describe('getTotalLines', () => {
  it('returns line count when returnContent is false (default)', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'getTotalLines-'));
    try {
      const filePath = join(tmpDir, 'test.cls');
      await writeFile(filePath, 'line1\nline2\nline3');
      const result = await getTotalLines(filePath);
      expect(result).toBe(3);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('returns { totalLines, content } when returnContent is true', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'getTotalLines-'));
    try {
      const filePath = join(tmpDir, 'test.cls');
      const fileContent = 'line1\nline2\nline3';
      await writeFile(filePath, fileContent);
      const result = await getTotalLines(filePath, true);
      expect(result).toEqual({ totalLines: 3, content: fileContent });
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
