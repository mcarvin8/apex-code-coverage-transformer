'use strict';

import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { normalizePathToUnix } from './normalizePathToUnix.js';

/**
 * Build a cache mapping filenames to their full paths.
 * This prevents recursive directory searches for every file in the coverage report.
 *
 * @param packageDirectories - Array of package directory paths to scan
 * @param repoRoot - Repository root path
 * @returns Map of filename (without path) to full relative path
 */
export async function buildFilePathCache(packageDirectories: string[], repoRoot: string): Promise<Map<string, string>> {
  const cache = new Map<string, string>();
  const extensions = ['cls', 'trigger'];

  await Promise.all(
    packageDirectories.map(async (directory) => {
      await scanDirectory(directory, repoRoot, extensions, cache);
    })
  );

  return cache;
}

async function scanDirectory(
  directory: string,
  repoRoot: string,
  extensions: string[],
  cache: Map<string, string>
): Promise<void> {
  let entries: string[];

  try {
    entries = await readdir(directory);
  } catch {
    // Directory doesn't exist or not accessible, skip it
    return;
  }

  const subdirPromises: Array<Promise<void>> = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    let stats;

    try {
      // eslint-disable-next-line no-await-in-loop
      stats = await stat(fullPath);
    } catch {
      // File not accessible, skip it
      continue;
    }

    if (stats.isDirectory()) {
      // Queue subdirectory scanning
      subdirPromises.push(scanDirectory(fullPath, repoRoot, extensions, cache));
    } else {
      // Check if this is an Apex file
      const ext = entry.split('.').pop();
      if (ext && extensions.includes(ext)) {
        const relativePath = normalizePathToUnix(relative(repoRoot, fullPath));
        // Store with the full filename as key (e.g., "AccountHandler.cls")
        cache.set(entry, relativePath);
        // Also store without extension for lookups (e.g., "AccountHandler")
        const nameWithoutExt = entry.substring(0, entry.lastIndexOf('.'));
        if (!cache.has(nameWithoutExt)) {
          cache.set(nameWithoutExt, relativePath);
        }
      }
    }
  }

  // Process all subdirectories in parallel
  await Promise.all(subdirPromises);
}
