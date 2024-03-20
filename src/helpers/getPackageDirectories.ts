'use strict';
/* eslint-disable no-await-in-loop */

import * as fs from 'node:fs';
import * as promises from 'node:fs/promises';

interface SfdxProject {
  packageDirectories: Array<{ path: string }>;
}

export async function getPackageDirectories(dxConfigFile: string): Promise<string[]> {
  if (!fs.existsSync(dxConfigFile)) {
    throw Error(`Salesforce DX Config File does not exist in this path: ${dxConfigFile}`);
  }

  const sfdxProjectRaw: string = await promises.readFile(dxConfigFile, 'utf-8');
  const sfdxProject: SfdxProject = JSON.parse(sfdxProjectRaw) as SfdxProject;
  const packageDirectories = sfdxProject.packageDirectories.map((directory) => directory.path);
  return packageDirectories;
}
