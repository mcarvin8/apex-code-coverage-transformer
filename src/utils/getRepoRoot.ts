'use strict';
import { access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { CoverageError } from './errors.js';

async function findRepoRoot(dir: string): Promise<{ repoRoot: string; dxConfigFilePath: string }> {
  const filePath = join(dir, 'sfdx-project.json');
  try {
    // Check if sfdx-project.json exists in the current directory
    await access(filePath);
    return { repoRoot: dir, dxConfigFilePath: filePath };
  } catch (error) {
    const parentDir = dirname(dir);
    if (dir === parentDir) {
      // Reached the root without finding the file, throw an error
      throw new CoverageError('sfdx-project.json not found in any parent directory.', {
        code: 'NO_SFDX_PROJECT',
        cause: error,
      });
    }
    // Recursively search in the parent directory
    return findRepoRoot(parentDir);
  }
}

export async function getRepoRoot(
  cwd?: string,
): Promise<{ repoRoot: string | undefined; dxConfigFilePath: string | undefined }> {
  return findRepoRoot(cwd === undefined ? process.cwd() : resolve(cwd));
}
