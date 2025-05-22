'use strict';
/* eslint-disable no-await-in-loop */

import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export async function findFilePath(
  fileName: string,
  packageDirectories: string[],
  repoRoot: string
): Promise<string | undefined> {
  for (const directory of packageDirectories) {
    const result = await resolveFilePath(fileName, directory, repoRoot);
    if (result) {
      return normalizePathToUnix(result);
    }
  }
  return undefined;
}

async function resolveFilePath(fileName: string, dxDirectory: string, repoRoot: string): Promise<string | undefined> {
  const extensionsToTry = getExtensionsToTry(fileName);

  for (const name of extensionsToTry) {
    const absolutePath = await searchRecursively(name, dxDirectory);
    if (absolutePath) {
      return relative(repoRoot, absolutePath);
    }
  }

  return undefined;
}

function getExtensionsToTry(fileName: string): string[] {
  const parts = fileName.split('.');
  if (parts.length > 1) {
    return [fileName];
  }
  return ['cls', 'trigger'].map((ext) => `${fileName}.${ext}`);
}

async function searchRecursively(fileName: string, directory: string): Promise<string | undefined> {
  const entries = await readdir(directory);

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      const nestedResult = await searchRecursively(fileName, fullPath);
      if (nestedResult) return nestedResult;
    } else if (entry === fileName) {
      return fullPath;
    }
  }

  return undefined;
}
