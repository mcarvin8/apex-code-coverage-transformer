'use strict';
import * as fs from 'node:fs';

import { CoverageData } from './types.js';
import { findFilePath } from './findFilePath.js';

export function convertToGenericCoverageReport(data: CoverageData, dxDirectory: string): string {
  let xml = '<?xml version="1.0"?>\n<coverage version="1">\n';

  for (const className in data) {
    if (Object.hasOwn(data, className)) {
      const classInfo = data[className];
      const formattedClassName = className.replace('no-map/', '');
      const filePath = findFilePath(formattedClassName, dxDirectory);
      if (filePath === undefined) {
        throw Error(`The file name ${formattedClassName} was not found in the classes, triggers, or flows directory.`);
      }
      // Extract the "uncovered lines" from the JSON data
      const uncoveredLines = Object.keys(classInfo.s)
      .filter(lineNumber => classInfo.s[lineNumber] === 0)
      .map(Number);
      const totalLines = getTotalLines(filePath);

      xml += `\t<file path="${filePath}">\n`;

      for (let lineNumber = 1; lineNumber <= totalLines; lineNumber++) {
        // Mark the line as covered if it is not listed as "uncovered" in the JSON
        const covered = uncoveredLines.includes(lineNumber) ? 'false' : 'true';
        xml += `\t\t<lineToCover lineNumber="${lineNumber}" covered="${covered}"/>\n`;
      }
      xml += '\t</file>\n';
    }
  }
  xml += '</coverage>';
  return xml;
}

function getTotalLines(filePath: string): number {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return fileContent.split(/\r\n|\r|\n/).length;
}
