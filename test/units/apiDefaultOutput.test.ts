'use strict';

import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Capture report writes without touching the working directory: the default output path is
// relative ('coverage.xml'), so a real write would land in the repo root.
const writeFileMock = vi.hoisted(() => vi.fn());
vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  return { ...actual, writeFile: writeFileMock };
});

import { transformCoverage } from '../../src/index.js';
import { baselineClassPath, testCoverage } from '../utils/testConstants.js';

const realFs = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
let projectDir: string;

describe('transformCoverage default output path', () => {
  beforeAll(async () => {
    projectDir = await mkdtemp(join(tmpdir(), 'acc-api-default-'));
    await mkdir(join(projectDir, 'force-app/main/default/classes'), { recursive: true });
    await copyFile(baselineClassPath, join(projectDir, 'force-app/main/default/classes/AccountProfile.cls'));
    await realFs.writeFile(
      join(projectDir, 'sfdx-project.json'),
      JSON.stringify({ packageDirectories: [{ path: 'force-app', default: true }] }),
    );
  });

  afterAll(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  it('writes to coverage.xml when outputReport is omitted', async () => {
    const { reports } = await transformCoverage({ inputs: [testCoverage], cwd: projectDir });

    expect(reports[0].path).toBe('coverage.xml');
    expect(writeFileMock).toHaveBeenCalledWith('coverage.xml', reports[0].content);
    expect(writeFile).toBe(writeFileMock);
  });
});
