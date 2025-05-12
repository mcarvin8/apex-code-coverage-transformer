'use strict';

import { create } from 'xmlbuilder2';
import {
  SonarCoverageObject,
  CoberturaCoverageObject,
  CloverCoverageObject,
  LcovCoverageObject,
  JaCoCoCoverageObject,
  IstanbulCoverageObject
} from './types.js';

export function generateReport(
  coverageObj:
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject 
    | IstanbulCoverageObject,
  format: string
): string {
  if (format === 'lcovonly') {
    // This must be LcovCoverageObject
    if ('files' in coverageObj) {
      const lcovFiles = (coverageObj as LcovCoverageObject).files;
      let lcovOutput = '';
      for (const file of lcovFiles) {
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

  if (format === 'json') {
    return JSON.stringify(coverageObj, null, 2); // Pretty-print JSON
  }

  const isHeadless = format === 'cobertura' || format === 'clover' || format === 'jacoco';
  let xml = create(coverageObj).end({ prettyPrint: true, indent: '  ', headless: isHeadless });

  if (format === 'cobertura') {
    xml = `<?xml version="1.0" ?>\n<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">\n${xml}`;
  } else if (format === 'clover') {
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
  } else if (format === 'jacoco') {
    xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!DOCTYPE report PUBLIC "-//JACOCO//DTD Report 1.0//EN" "report.dtd">\n${xml}`;
  }

  return xml;
}
