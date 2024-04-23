'use strict';
/* eslint-disable no-await-in-loop */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

import { SfdxProject } from './types.js';

export async function getPackageDirectories(): Promise<{ repoRoot: string; packageDirectories: string[] }> {
  const options: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: true,
  };
  const git: SimpleGit = simpleGit(options);
  const repoRoot = (await git.revparse('--show-toplevel')).trim();
  const dxConfigPath = resolve(repoRoot, 'sfdx-project.json');
  if (!existsSync(dxConfigPath)) {
    throw Error(`Salesforce DX Config File does not exist in this path: ${dxConfigPath}`);
  }

  const sfdxProjectRaw: string = await readFile(dxConfigPath, 'utf-8');
  const sfdxProject: SfdxProject = JSON.parse(sfdxProjectRaw) as SfdxProject;
  const packageDirectories = sfdxProject.packageDirectories.map((directory) => resolve(repoRoot, directory.path));
  return { repoRoot, packageDirectories };
}
