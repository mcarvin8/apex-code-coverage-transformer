'use strict';
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

import { DeployCoverageData, SonarCoverageObject, CoberturaCoverageObject, CloverCoverageObject } from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { generateXml } from './generateXml.js';
import { formatOptions } from './constants.js';
import { initializeCoverageObject } from './initializeCoverageObject.js';
import { handleSonarFormat } from './handleSonarFormat.js';
import { handleCloverFormat } from './handleCloverFormat.js';
import { handleCoberturaFormat } from './handleCoberturaFormat.js';

export async function transformDeployCoverageReport(
  data: DeployCoverageData,
  format: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  if (!formatOptions.includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }

  const warnings: string[] = [];
  let filesProcessed: number = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();

  const { coverageObj, packageObj } = initializeCoverageObject(format);

  for (const fileName in data) {
    if (!Object.hasOwn(data, fileName)) continue;

    const fileInfo = data[fileName];
    const formattedFileName = fileName.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);

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

    if (format === 'sonar') {
      handleSonarFormat(relativeFilePath, fileInfo.s, coverageObj as SonarCoverageObject);
    } else if (format === 'cobertura') {
      handleCoberturaFormat(
        relativeFilePath,
        formattedFileName,
        fileInfo.s,
        uncoveredLines,
        coveredLines,
        coverageObj as CoberturaCoverageObject,
        packageObj!
      );
    } else {
      handleCloverFormat(
        relativeFilePath,
        formattedFileName,
        fileInfo.s,
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
