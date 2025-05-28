import { writeFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { create } from 'xmlbuilder2';

import {
  SonarCoverageObject,
  CoberturaCoverageObject,
  CloverCoverageObject,
  LcovCoverageObject,
  JaCoCoCoverageObject,
} from '../utils/types.js';

export async function generateAndWriteReport(
  outputPath: string,
  coverageObj:
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject,
  format: string
): Promise<void> {
  const content = generateReportContent(coverageObj, format);
  const extension = getExtensionForFormat(format);
  const filePath = extname(outputPath) === extension ? outputPath : `${outputPath}${extension}`;

  await writeFile(filePath, content, 'utf-8');
}

function generateReportContent(
  coverageObj:
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject,
  format: string
): string {
  if (format === 'lcovonly' && 'files' in coverageObj) {
    return generateLcov(coverageObj);
  }

  const isHeadless = ['cobertura', 'clover', 'jacoco'].includes(format);
  const xml = create(coverageObj).end({ prettyPrint: true, indent: '  ', headless: isHeadless });

  return prependXmlHeader(xml, format);
}

function generateLcov(coverageObj: LcovCoverageObject): string {
  return coverageObj.files
    .map((file) => {
      const lineData = file.lines.map((line) => `DA:${line.lineNumber},${line.hitCount}`).join('\n');
      return [
        'TN:',
        `SF:${file.sourceFile}`,
        'FNF:0',
        'FNH:0',
        lineData,
        `LF:${file.totalLines}`,
        `LH:${file.coveredLines}`,
        'BRF:0',
        'BRH:0',
        'end_of_record',
      ].join('\n');
    })
    .join('\n');
}

function prependXmlHeader(xml: string, format: string): string {
  switch (format) {
    case 'cobertura':
      return `<?xml version="1.0" ?>\n<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">\n${xml}`;
    case 'clover':
      return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
    case 'jacoco':
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!DOCTYPE report PUBLIC "-//JACOCO//DTD Report 1.0//EN" "report.dtd">\n${xml}`;
    default:
      return xml;
  }
}

function getExtensionForFormat(format: string): string {
  switch (format) {
    case 'lcovonly':
      return '.info';
    default:
      return '.xml';
  }
}
