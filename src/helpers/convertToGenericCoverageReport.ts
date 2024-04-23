'use strict';
/* eslint-disable no-await-in-loop */

import { create } from 'xmlbuilder2';

import { CoverageData, CoverageObject, FileObject } from './types.js';
import { findFilePath } from './findFilePath.js';
import { setCoveredLines } from './setCoveredLines.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export async function convertToGenericCoverageReport(
  data: CoverageData
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const coverageObj: CoverageObject = { coverage: { '@version': '1', file: [] } };
  const warnings: string[] = [];
  let filesProcessed: number = 0;

  for (const fileName in data) {
    if (!Object.hasOwn(data, fileName)) continue;
    const fileInfo = data[fileName];
    const formattedFileName = fileName.replace('no-map/', '');
    const { repoRoot, relativeFilePath } = await findFilePath(formattedFileName);
    if (relativeFilePath === undefined) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      continue;
    }
    const uncoveredLines = Object.keys(fileInfo.s)
      .filter((lineNumber) => fileInfo.s[lineNumber] === 0)
      .map(Number);
    const coveredLines = Object.keys(fileInfo.s)
      .filter((lineNumber) => fileInfo.s[lineNumber] === 1)
      .map(Number);

    const fileObj: FileObject = {
      '@path': normalizePathToUnix(relativeFilePath),
      lineToCover: uncoveredLines.map((lineNumber: number) => ({
        '@lineNumber': lineNumber,
        '@covered': 'false',
      })),
    };

    // this function is only needed until Salesforce fixes the API to correctly return covered lines
    await setCoveredLines(coveredLines, uncoveredLines, repoRoot, relativeFilePath, fileObj);
    filesProcessed++;
    coverageObj.coverage.file.push(fileObj);
  }
  const xml = create(coverageObj).end({ prettyPrint: true, indent: '  ' });
  return { xml, warnings, filesProcessed };
}
