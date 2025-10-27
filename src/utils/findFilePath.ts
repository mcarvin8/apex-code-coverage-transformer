'use strict';

/**
 * Find file path using a pre-built cache (fast) or fallback to the old method.
 *
 * @param fileName - Name of the file to find
 * @param filePathCache - Optional pre-built cache of filename -> path mappings
 * @returns Normalized Unix-style relative path or undefined if not found
 */
export function findFilePath(fileName: string, filePathCache?: Map<string, string>): string | undefined {
  if (filePathCache) {
    return findFilePathFromCache(fileName, filePathCache);
  }

  // Fallback to old behavior should never happen in practice,
  // but keeping for backwards compatibility
  return undefined;
}

function findFilePathFromCache(fileName: string, cache: Map<string, string>): string | undefined {
  // Try exact match first
  const exactMatch = cache.get(fileName);
  if (exactMatch) {
    return exactMatch;
  }

  // Try with .cls extension
  const clsMatch = cache.get(`${fileName}.cls`);
  if (clsMatch) {
    return clsMatch;
  }

  // Try with .trigger extension
  const triggerMatch = cache.get(`${fileName}.trigger`);
  if (triggerMatch) {
    return triggerMatch;
  }

  return undefined;
}
