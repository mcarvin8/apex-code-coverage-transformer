'use strict';

export function normalizePathToUnix(path: string): string {
  return path.replace(/\\/g, '/');
}
