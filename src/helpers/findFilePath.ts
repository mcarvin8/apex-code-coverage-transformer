'use strict';
/* eslint-disable no-await-in-loop */

import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { getPackageDirectories } from './getPackageDirectories.js';

export async function findFilePath(
  fileName: string,
  dxConfigFile: string
): Promise<{ repoRoot: string; relativeFilePath: string | undefined }> {
  const { repoRoot, packageDirectories } = await getPackageDirectories(dxConfigFile);

  let relativeFilePath: string | undefined;
  for (const directory of packageDirectories) {
    relativeFilePath = await findFilePathinDirectory(fileName, directory, repoRoot);
    if (relativeFilePath !== undefined) {
      break;
    }
  }
  return { repoRoot, relativeFilePath };
}

async function searchRecursively(fileName: string, dxDirectory: string): Promise<string | undefined> {
  const files = await readdir(dxDirectory);
  for (const file of files) {
    const filePath = join(dxDirectory, file);
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      const result = await searchRecursively(fileName, filePath);
      if (result) {
        return result;
      }
    } else if (file === fileName) {
      return filePath;
    }
  }
  return undefined;
}

async function findFilePathinDirectory(
  fileName: string,
  dxDirectory: string,
  repoRoot: string
): Promise<string | undefined> {
  const fileExtension = fileName.split('.').slice(1).join('.');
  let relativeFilePath: string | undefined;

  if (fileExtension) {
    // If file extension is defined, search recursively with that extension
    const absoluteFilePath = await searchRecursively(fileName, dxDirectory);
    if (absoluteFilePath !== undefined) relativeFilePath = relative(repoRoot, absoluteFilePath);
  } else {
    // If file extension is not defined, test each extension option
    const fileExts: string[] = ['cls', 'trigger'];
    for (const ext of fileExts) {
      const absoluteFilePath = await searchRecursively(`${fileName}.${ext}`, dxDirectory);
      if (absoluteFilePath !== undefined) {
        relativeFilePath = relative(repoRoot, absoluteFilePath);
        break;
      }
    }
  }
  return relativeFilePath;
}
