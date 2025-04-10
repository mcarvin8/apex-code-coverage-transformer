'use strict';

import { readdir, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';

import { normalizePathToUnix } from './normalizePathToUnix.js';

export async function findFilePath(
  fileName: string,
  packageDirectories: string[],
  repoRoot: string
): Promise<string | undefined> {
  const ext = extname(fileName);
  const candidateNames = ext ? [fileName] : [`${fileName}.cls`, `${fileName}.trigger`];

  for (const name of candidateNames) {
    const found = await Promise.all(
      packageDirectories.map((dir) => searchRecursively(name, dir))
    );

    const match = found.find((f) => f !== undefined);
    if (match) {
      return normalizePathToUnix(relative(repoRoot, match));
    }
  }

  return undefined;
}

async function searchRecursively(fileName: string, dxDirectory: string): Promise<string | undefined> {
  const files = await readdir(dxDirectory);

  const results = await Promise.all(
    files.map(async (file) => {
      const filePath = join(dxDirectory, file);
      const stats = await stat(filePath);
      if (stats.isDirectory()) {
        return searchRecursively(fileName, filePath);
      } else if (file === fileName) {
        return filePath;
      }
      return undefined;
    })
  );

  return results.find((result) => result !== undefined);
}
