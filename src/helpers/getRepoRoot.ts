'use strict';
import { access } from 'node:fs/promises';
import { join, dirname } from 'node:path';

export async function getRepoRoot(): Promise<{ repoRoot: string | undefined; dxConfigFilePath: string | undefined }> {
  const findRepoRoot = async (dir: string): Promise<{ repoRoot: string | undefined; dxConfigFilePath: string | undefined }> => {
    const filePath = join(dir, 'sfdx-project.json');

    try {
      await access(filePath);
      return { repoRoot: dir, dxConfigFilePath: filePath };
    } catch {
      const parentDir = dirname(dir);
      if (dir === parentDir) {
        throw new Error('sfdx-project.json not found in any parent directory.');
      }
      return findRepoRoot(parentDir); // Recursive call to check parent directory
    }
  };

  return findRepoRoot(process.cwd());
}