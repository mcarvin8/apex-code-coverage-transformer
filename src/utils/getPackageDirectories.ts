'use strict';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { SfdxProject } from './types.js';
import { getRepoRoot } from './getRepoRoot.js';

export async function getPackageDirectories(
  ignoreDirectories: string[]
): Promise<{ repoRoot: string; packageDirectories: string[] }> {
  const { repoRoot, dxConfigFilePath } = (await getRepoRoot()) as {
    repoRoot: string;
    dxConfigFilePath: string;
  };

  const sfdxProjectRaw: string = await readFile(dxConfigFilePath, 'utf-8');
  const sfdxProject: SfdxProject = JSON.parse(sfdxProjectRaw) as SfdxProject;

  const packageDirectories = sfdxProject.packageDirectories
    .filter((directory) => !ignoreDirectories.includes(directory.path)) // Ignore exact folder names
    .map((directory) => resolve(repoRoot, directory.path));

  return { repoRoot, packageDirectories };
}
