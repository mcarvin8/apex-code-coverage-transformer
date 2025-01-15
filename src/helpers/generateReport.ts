'use strict';

import { create } from 'xmlbuilder2';
import { SonarCoverageObject, CoberturaCoverageObject, CloverCoverageObject, LcovCoverageObject } from './types.js';

export function generateReport(
  coverageObj: SonarCoverageObject | CoberturaCoverageObject | CloverCoverageObject | LcovCoverageObject,
  format: string
): string {
  if (format === 'lcovonly') {
    if ('files' in coverageObj) {
      let lcovOutput = '';
      coverageObj.files.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
      for (const file of coverageObj.files) {
        lcovOutput += `TN:\nSF:${file.sourceFile}\n`;
        lcovOutput += 'FNF:0\nFNH:0\n';

        for (const line of file.lines) {
          lcovOutput += `DA:${line.lineNumber},${line.hitCount}\n`;
        }

        lcovOutput += `LF:${file.totalLines}\n`;
        lcovOutput += `LH:${file.coveredLines}\n`;
        lcovOutput += 'BRF:0\nBRH:0\n';
        lcovOutput += 'end_of_record\n';
      }
      return lcovOutput;
    }
  }

  const isHeadless = format === 'cobertura' || format === 'clover';
  if ('files' in coverageObj) {
    coverageObj.files.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
  }
  let xml = create(coverageObj).end({ prettyPrint: true, indent: '  ', headless: isHeadless });

  if (format === 'cobertura') {
    xml = `<?xml version="1.0" ?>\n<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">\n${xml}`;
  } else if (format === 'clover') {
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
  }

  return xml;
}
