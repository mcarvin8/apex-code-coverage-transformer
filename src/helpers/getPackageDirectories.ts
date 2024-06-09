'use strict';
/* eslint-disable no-await-in-loop */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { SfdxProject } from './types.js';
import { getRepoRoot } from './getRepoRoot.js';

export async function getPackageDirectories(): Promise<{ repoRoot: string; packageDirectories: string[] }> {
  const repoRoot = await getRepoRoot();
  const dxConfigPath = resolve(repoRoot, 'sfdx-project.json');
  if (!existsSync(dxConfigPath)) {
    throw Error(`Salesforce DX Config File does not exist in this path: ${dxConfigPath}`);
  }

  const sfdxProjectRaw: string = await readFile(dxConfigPath, 'utf-8');
  const sfdxProject: SfdxProject = JSON.parse(sfdxProjectRaw) as SfdxProject;
  const packageDirectories = sfdxProject.packageDirectories.map((directory) => resolve(repoRoot, directory.path));
  return { repoRoot, packageDirectories };
}
