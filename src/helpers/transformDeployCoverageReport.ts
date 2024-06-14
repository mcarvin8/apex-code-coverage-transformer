'use strict';
/* eslint-disable no-await-in-loop */

import { create } from 'xmlbuilder2';

import { DeployCoverageData, CoverageObject, FileObject } from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export async function transformDeployCoverageReport(
  data: DeployCoverageData
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const coverageObj: CoverageObject = { coverage: { '@version': '1', file: [] } };
  const warnings: string[] = [];
  let filesProcessed: number = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();

  for (const fileName in data) {
    if (!Object.hasOwn(data, fileName)) continue;
    const fileInfo = data[fileName];
    const formattedFileName = fileName.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);
    if (relativeFilePath === undefined) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      continue;
    }
    const fileObj: FileObject = {
      '@path': normalizePathToUnix(relativeFilePath),
      lineToCover: [],
    };

    for (const lineNumberString in fileInfo.s) {
      if (!Object.hasOwn(fileInfo.s, lineNumberString)) continue;

      const covered = fileInfo.s[lineNumberString] === 1 ? 'true' : 'false';
      fileObj.lineToCover.push({
        '@lineNumber': Number(lineNumberString),
        '@covered': covered,
      });
    }

    filesProcessed++;
    coverageObj.coverage.file.push(fileObj);
  }
  const xml = create(coverageObj).end({ prettyPrint: true, indent: '  ' });
  return { xml, warnings, filesProcessed };
}
