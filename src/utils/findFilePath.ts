'use strict';

export function findFilePath(fileName: string, filePathCache: Map<string, string>): string | undefined {
  const exactMatch = filePathCache.get(fileName);
  if (exactMatch) return exactMatch;

  const clsMatch = filePathCache.get(`${fileName}.cls`);
  if (clsMatch) return clsMatch;

  const triggerMatch = filePathCache.get(`${fileName}.trigger`);
  if (triggerMatch) return triggerMatch;

  return undefined;
}
