'use strict';
/* eslint-disable no-await-in-loop */

import * as path from 'node:path';
import * as promises from 'node:fs/promises';

export async function findSubFolder(parentDirectory: string, subFolderName: string): Promise<string> {
  const files = await promises.readdir(parentDirectory);

  // Check if current directory contains the sub-folder
  if (files.includes(subFolderName)) {
    return path.join(parentDirectory, subFolderName);
  }

  // Recursively search sub-directories
  for (const file of files) {
    const filePath = path.join(parentDirectory, file);
    const stats = await promises.stat(filePath);
    if (stats.isDirectory()) {
      const subFolderPath = await findSubFolder(filePath, subFolderName);
      if (subFolderPath) {
        return subFolderPath;
      }
    }
  }

  // must be a string for the file-path check
  return 'undefined';
}
