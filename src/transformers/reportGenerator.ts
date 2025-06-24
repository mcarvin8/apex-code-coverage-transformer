import { writeFile } from 'node:fs/promises';
import { extname, basename, dirname, join } from 'node:path';
import { create } from 'xmlbuilder2';

import {
  SonarCoverageObject,
  CoberturaCoverageObject,
  CloverCoverageObject,
  LcovCoverageObject,
  JaCoCoCoverageObject,
  IstanbulCoverageObject,
} from '../utils/types.js';

export async function generateAndWriteReport(
  outputPath: string,
  coverageObj:
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject
    | IstanbulCoverageObject,
  format: string,
  formatAmount: number
): Promise<string> {
  const content = generateReportContent(coverageObj, format);
  const extension = getExtensionForFormat(format);

  const base = basename(outputPath, extname(outputPath)); // e.g., 'coverage'
  const dir = dirname(outputPath);

  const suffix = formatAmount > 1 ? `-${format}` : '';
  const filePath = join(dir, `${base}${suffix}${extension}`);

  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

function generateReportContent(
  coverageObj:
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject
    | IstanbulCoverageObject,
  format: string
): string {
  if (format === 'lcovonly' && isLcovCoverageObject(coverageObj)) {
    return generateLcov(coverageObj);
  }

  if (format === 'json') {
    return JSON.stringify(coverageObj, null, 2);
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

export function getExtensionForFormat(format: string): string {
  if (format === 'lcovonly') return '.info';
  if (format === 'json') return '.json';
  return '.xml';
}

function isLcovCoverageObject(obj: unknown): obj is LcovCoverageObject {
  return typeof obj === 'object' && obj !== null && 'files' in obj;
}
