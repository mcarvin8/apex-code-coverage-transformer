'use strict';
/* eslint-disable no-await-in-loop */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path/posix';

import { getPackageDirectories } from './getPackageDirectories.js';

export async function findFilePath(fileName: string, dxConfigFile: string): Promise<string | undefined> {
  const packageDirectories = await getPackageDirectories(dxConfigFile);

  let filePath: string | undefined;
  for (const directory of packageDirectories) {
    filePath = await findFilePathinDirectory(fileName, directory);
    if (filePath !== undefined) {
      break;
    }
  }
  return filePath;
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

async function findFilePathinDirectory(fileName: string, dxDirectory: string): Promise<string | undefined> {
  const fileExtension = fileName.split('.').slice(1).join('.');
  let relativeFilePath: string | undefined;

  if (fileExtension) {
    // If file extension is defined, search recursively with that extension
    relativeFilePath = await searchRecursively(fileName, dxDirectory);
  } else {
    // If file extension is not defined, test each extension option
    const fileExts: string[] = ['cls', 'trigger'];
    for (const ext of fileExts) {
      relativeFilePath = await searchRecursively(`${fileName}.${ext}`, dxDirectory);
      if (relativeFilePath !== undefined) {
        break;
      }
    }
  }
  return relativeFilePath;
}
