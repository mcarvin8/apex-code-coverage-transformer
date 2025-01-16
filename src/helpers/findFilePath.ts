'use strict';

import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export async function findFilePath(
  fileName: string,
  packageDirectories: string[],
  repoRoot: string
): Promise<string | undefined> {
  const relativePaths = await Promise.all(
    packageDirectories.map((directory) => findFilePathInDirectory(fileName, directory, repoRoot))
  );

  // Return the first non-undefined result
  const foundPath = relativePaths.find((path) => path !== undefined);
  return foundPath ? normalizePathToUnix(foundPath) : undefined;
}

async function searchRecursively(fileName: string, dxDirectory: string): Promise<string | undefined> {
  const files = await readdir(dxDirectory);

  const searchPromises = files.map(async (file) => {
    const filePath = join(dxDirectory, file);
    const fileStats = await stat(filePath);

    if (fileStats.isDirectory()) {
      return searchRecursively(fileName, filePath);
    } else if (file === fileName) {
      return filePath;
    }
    return undefined;
  });

  const results = await Promise.all(searchPromises);
  return results.find((result) => result !== undefined);
}

async function findFilePathInDirectory(
  fileName: string,
  dxDirectory: string,
  repoRoot: string
): Promise<string | undefined> {
  const fileExtension = fileName.split('.').slice(1).join('.');

  if (fileExtension) {
    // If file extension is defined, search recursively with that extension
    const absoluteFilePath = await searchRecursively(fileName, dxDirectory);
    return absoluteFilePath ? relative(repoRoot, absoluteFilePath) : undefined;
  } else {
    // If file extension is not defined, test each extension option in parallel
    const fileExts = ['cls', 'trigger'];
    const results = await Promise.all(
      fileExts.map((ext) => searchRecursively(`${fileName}.${ext}`, dxDirectory))
    );
    const absoluteFilePath = results.find((result) => result !== undefined);
    return absoluteFilePath ? relative(repoRoot, absoluteFilePath) : undefined;
  }
}
