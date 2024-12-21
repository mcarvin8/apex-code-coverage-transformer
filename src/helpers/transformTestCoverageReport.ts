'use strict';
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

import { TestCoverageData, SonarCoverageObject, CoberturaCoverageObject, CloverCoverageObject } from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { generateXml } from './generateXml.js';
import { formatOptions } from './constants.js';
import { initializeCoverageObject } from './initializeCoverageObject.js';
import { handleSonarFormat } from './handleSonarFormat.js';
import { handleCloverFormat } from './handleCloverFormat.js';
import { handleCoberturaFormat } from './handleCoberturaFormat.js';

export async function transformTestCoverageReport(
  testCoverageData: TestCoverageData[],
  format: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  if (!formatOptions.includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }

  const warnings: string[] = [];
  let filesProcessed: number = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();

  const { coverageObj, packageObj } = initializeCoverageObject(format);

  let coverageData = testCoverageData;
  if (!Array.isArray(coverageData)) {
    coverageData = [coverageData];
  }

  for (const data of coverageData) {
    const name = data?.name;
    const lines = data?.lines;

    if (!name || !lines) continue;

    const formattedFileName = name.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);
    if (relativeFilePath === undefined) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      continue;
    }

    const uncoveredLines = Object.entries(lines)
      .filter(([, isCovered]) => isCovered === 0)
      .map(([lineNumber]) => Number(lineNumber));
    const coveredLines = Object.entries(lines)
      .filter(([, isCovered]) => isCovered === 1)
      .map(([lineNumber]) => Number(lineNumber));

    if (format === 'sonar') {
      handleSonarFormat(relativeFilePath, lines, coverageObj as SonarCoverageObject);
    } else if (format === 'cobertura') {
      handleCoberturaFormat(
        relativeFilePath,
        formattedFileName,
        lines,
        uncoveredLines,
        coveredLines,
        coverageObj as CoberturaCoverageObject,
        packageObj!
      );
    } else {
      handleCloverFormat(
        relativeFilePath,
        formattedFileName,
        lines,
        uncoveredLines,
        coveredLines,
        coverageObj as CloverCoverageObject
      );
    }

    filesProcessed++;
  }
  const xml = generateXml(coverageObj, format);
  return { xml, warnings, filesProcessed };
}
