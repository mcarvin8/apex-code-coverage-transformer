'use strict';
/* eslint-disable no-await-in-loop */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { SfdxProject } from './types.js';

export async function getPackageDirectories(
  dxConfigFile: string
): Promise<{ repoRoot: string; packageDirectories: string[] }> {
  if (!existsSync(dxConfigFile)) {
    throw Error(`Salesforce DX Config File does not exist in this path: ${dxConfigFile}`);
  }

  const sfdxProjectRaw: string = await readFile(dxConfigFile, 'utf-8');
  const sfdxProject: SfdxProject = JSON.parse(sfdxProjectRaw) as SfdxProject;
  const repoRoot = dirname(dxConfigFile);
  const packageDirectories = sfdxProject.packageDirectories.map((directory) => resolve(repoRoot, directory.path));
  return { repoRoot, packageDirectories };
}
