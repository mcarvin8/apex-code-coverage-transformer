'use strict';
/* eslint-disable no-await-in-loop */

import { CoverageData } from './types.js';
import { getTotalLines } from './getTotalLines.js';
import { findFilePath } from './findFilePath.js';

export async function convertToGenericCoverageReport(
  data: CoverageData,
  dxConfigFile: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  let xml = '<?xml version="1.0"?>\n<coverage version="1">\n';
  const warnings: string[] = [];
  let filesProcessed: number = 0;

  for (const fileName in data) {
    if (!Object.hasOwn(data, fileName)) continue;
    const fileInfo = data[fileName];
    const formattedFileName = fileName.replace('no-map/', '');
    const filePath = await findFilePath(formattedFileName, dxConfigFile);
    if (filePath === undefined) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      continue;
    }
    // Extract the "uncovered lines" from the JSON data
    const uncoveredLines = Object.keys(fileInfo.s)
      .filter((lineNumber) => fileInfo.s[lineNumber] === 0)
      .map(Number);
    const coveredLines = Object.keys(fileInfo.s)
      .filter((lineNumber) => fileInfo.s[lineNumber] === 1)
      .map(Number);
    const randomLines: number[] = [];
    const totalLines = getTotalLines(filePath);

    xml += `\t<file path="${filePath}">\n`;

    for (const uncoveredLine of uncoveredLines) {
      xml += `\t\t<lineToCover lineNumber="${uncoveredLine}" covered="false"/>\n`;
    }

    for (const coveredLine of coveredLines) {
      if (coveredLine > totalLines) {
        for (let randomLineNumber = 1; randomLineNumber <= totalLines; randomLineNumber++) {
          if (
            !uncoveredLines.includes(randomLineNumber) &&
            !coveredLines.includes(randomLineNumber) &&
            !randomLines.includes(randomLineNumber)
          ) {
            xml += `\t\t<lineToCover lineNumber="${randomLineNumber}" covered="true"/>\n`;
            randomLines.push(randomLineNumber);
            break;
          }
        }
      } else {
        xml += `\t\t<lineToCover lineNumber="${coveredLine}" covered="true"/>\n`;
      }
    }
    filesProcessed++;
    xml += '\t</file>\n';
  }
  xml += '</coverage>';
  return { xml, warnings, filesProcessed };
}
