'use strict';

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockStat = jest.fn();

jest.mock('node:fs/promises', () => {
  const actual = jest.requireActual<typeof import('node:fs/promises')>('node:fs/promises');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    stat: (path: string) => mockStat(path),
  };
});

import { buildFilePathCache } from '../../src/utils/buildFilePathCache.js';

describe('buildFilePathCache stat failure', () => {
  const testDir = join(process.cwd(), 'test-cache-stat-fail');
  const packageDir = join(testDir, 'force-app', 'main', 'default', 'classes');
  const repoRoot = testDir;

  beforeEach(async () => {
    await mkdir(packageDir, { recursive: true });
    await writeFile(join(packageDir, 'Good.cls'), 'public class Good {}');
    await writeFile(join(packageDir, 'Bad.cls'), 'public class Bad {}');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    mockStat.mockReset();
  });

  it('should skip entry when stat throws', async () => {
    const actualFs = jest.requireActual<typeof import('node:fs/promises')>('node:fs/promises');
    mockStat.mockImplementation((path: string) => {
      if (path.endsWith('Bad.cls')) {
        return Promise.reject(new Error('Permission denied'));
      }
      return actualFs.stat(path);
    });

    const cache = await buildFilePathCache([join(testDir, 'force-app')], repoRoot);

    expect(cache.has('Good.cls')).toBe(true);
    expect(cache.has('Bad.cls')).toBe(false);
  });
});
