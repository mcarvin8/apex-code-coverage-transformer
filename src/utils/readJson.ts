'use strict';

import { readFile } from 'node:fs/promises';

export async function tryReadJson(path: string, warnings: string[]): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    warnings.push(`Failed to read ${path}. Confirm file exists.`);
    return null;
  }
}
