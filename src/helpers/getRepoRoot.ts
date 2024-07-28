'use strict';
import * as fs from 'node:fs';
import git from 'isomorphic-git';

export async function getRepoRoot(): Promise<string> {
  const repoRoot = await git.findRoot({
    fs: { ...fs, promises: fs.promises },
    filepath: process.cwd(),
  });
  return repoRoot;
}
