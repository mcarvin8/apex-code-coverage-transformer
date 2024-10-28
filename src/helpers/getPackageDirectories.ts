'use strict';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { SfdxProject } from './types.js';
import { getRepoRoot } from './getRepoRoot.js';

export async function getPackageDirectories(): Promise<{ repoRoot: string; packageDirectories: string[] }> {
  const { repoRoot, dxConfigFilePath } = await getRepoRoot();

  if (!repoRoot || !dxConfigFilePath) {
    throw new Error('Failed to retrieve repository root or sfdx-project.json path.');
  }

  const sfdxProjectRaw: string = await readFile(dxConfigFilePath, 'utf-8');
  const sfdxProject: SfdxProject = JSON.parse(sfdxProjectRaw) as SfdxProject;
  const packageDirectories = sfdxProject.packageDirectories.map((directory) => resolve(repoRoot, directory.path));
  return { repoRoot, packageDirectories };
}
