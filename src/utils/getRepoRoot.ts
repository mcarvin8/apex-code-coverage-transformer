'use strict';
import { access } from 'node:fs/promises';
import { join, dirname } from 'node:path';

async function findRepoRoot(dir: string): Promise<{ repoRoot: string; dxConfigFilePath: string }> {
  const filePath = join(dir, 'sfdx-project.json');
  try {
    // Check if sfdx-project.json exists in the current directory
    await access(filePath);
    return { repoRoot: dir, dxConfigFilePath: filePath };
  } catch {
    const parentDir = dirname(dir);
    if (dir === parentDir) {
      // Reached the root without finding the file, throw an error
      throw new Error('sfdx-project.json not found in any parent directory.');
    }
    // Recursively search in the parent directory
    return findRepoRoot(parentDir);
  }
}

export async function getRepoRoot(): Promise<{ repoRoot: string | undefined; dxConfigFilePath: string | undefined }> {
  const currentDir = process.cwd();
  return findRepoRoot(currentDir);
}
