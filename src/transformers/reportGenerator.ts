import { writeFile } from 'node:fs/promises';
import { extname, basename, dirname, join } from 'node:path';
import XMLBuilder from 'fast-xml-builder';

import { AnyCoverageObject, LcovCoverageObject } from '../utils/types.js';
import { HandlerRegistry } from '../handlers/HandlerRegistry.js';
import { builderOptions, XML_HEADER_CONFIG } from '../utils/constants.js';
import { XmlReportFormat } from '../utils/types.js';
import { generateHtml, isHtmlCoverageObject } from './generators/generateHtml.js';

function isXmlReportFormat(format: string): format is XmlReportFormat {
  return format in XML_HEADER_CONFIG;
}

export async function generateAndWriteReport(
  outputPath: string,
  coverageObj: AnyCoverageObject,
  format: string,
  formatAmount: number
): Promise<string> {
  const content = generateReportContent(coverageObj, format);
  const extension = HandlerRegistry.getExtension(format);

  const base = basename(outputPath, extname(outputPath)); // e.g., 'coverage'
  const dir = dirname(outputPath);

  const suffix = formatAmount > 1 ? `-${format}` : '';
  const filePath = join(dir, `${base}${suffix}${extension}`);

  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

function generateReportContent(coverageObj: AnyCoverageObject, format: string): string {
  if (format === 'lcovonly' && isLcovCoverageObject(coverageObj)) {
    return generateLcov(coverageObj);
  }

  if (format === 'html' && isHtmlCoverageObject(coverageObj)) {
    return generateHtml(coverageObj);
  }

  if (format === 'json' || format === 'json-summary' || format === 'simplecov') {
    return JSON.stringify(coverageObj, null, 2);
  }

  const isHeadless = isXmlReportFormat(format);
  const builder = new XMLBuilder(builderOptions);
  let xml = builder.build(coverageObj);

  if (isHeadless) {
    xml = xml.replace(/^<\?xml[^>]*>\s*/i, '');
  }

  const finalXml = prependXmlHeader(xml, format).trimEnd();
  return finalXml;
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
  // Remove any existing XML declaration to avoid duplicates
  const stripped = xml.replace(/^<\?xml[^>]*>\s*/i, '');
  const config = isXmlReportFormat(format) ? XML_HEADER_CONFIG[format] : undefined;

  return [config?.xmlDecl ?? '<?xml version="1.0"?>', config?.doctype, stripped].filter(Boolean).join('\n');
}

export function getExtensionForFormat(format: string): string {
  return HandlerRegistry.getExtension(format);
}

function isLcovCoverageObject(obj: unknown): obj is LcovCoverageObject {
  return typeof obj === 'object' && obj !== null && 'files' in obj;
}
