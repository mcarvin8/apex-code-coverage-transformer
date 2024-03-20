'use strict';
/* eslint-disable no-await-in-loop */

import { CoverageData } from './types.js';
import { findFilePath } from './findFilePath.js';

export async function convertToGenericCoverageReport(data: CoverageData, dxConfigFile: string): Promise<string> {
  let xml = '<?xml version="1.0"?>\n<coverage version="1">\n';

  for (const fileName in data) {
    if (!Object.hasOwn(data, fileName)) continue;
    const fileInfo = data[fileName];
    const formattedFileName = fileName.replace('no-map/', '');
    const filePath = await findFilePath(formattedFileName, dxConfigFile);
    if (filePath === undefined) {
      throw Error(`The file name ${formattedFileName} was not found in any package directory.`);
    }
    xml += `\t<file path="${filePath}">\n`;

    for (const lineNumber in fileInfo.s) {
      if (!Object.hasOwn(fileInfo.s, lineNumber)) continue;
      const count = fileInfo.s[lineNumber];
      const covered = count > 0 ? 'true' : 'false';
      // only add uncovered lines
      if (covered === 'false') xml += `\t\t<lineToCover lineNumber="${lineNumber}" covered="${covered}"/>\n`;
    }
    xml += '\t</file>\n';
  }
  xml += '</coverage>';
  return xml;
}
