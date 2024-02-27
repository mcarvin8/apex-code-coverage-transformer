'use strict';
import { CoverageData } from './types.js';
import { findFilePath } from './findFilePath.js';

export function convertToGenericCoverageReport(data: CoverageData, dxDirectory: string): string {
  let xml = '<?xml version="1.0"?>\n<coverage version="1">\n';

  for (const className in data) {
    if (Object.hasOwn(data, className)) {
      const classInfo = data[className];
      const formattedClassName = className.replace('no-map/', '');
      const filePath = findFilePath(formattedClassName, dxDirectory);
      xml += `\t<file path="${filePath}">\n`;

      for (const lineNumber in classInfo.s) {
        if (Object.hasOwn(classInfo.s, lineNumber)) {
          const count = classInfo.s[lineNumber];
          const covered = count > 0 ? 'true' : 'false';
          // only add uncovered lines
          if (covered === 'false') {
            xml += `\t\t<lineToCover lineNumber="${lineNumber}" covered="${covered}"/>\n`;
          }
        }
      }
      xml += '\t</file>\n';
    }
  }
  xml += '</coverage>';
  return xml;
}
