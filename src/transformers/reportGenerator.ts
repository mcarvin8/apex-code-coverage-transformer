import { writeFile } from 'node:fs/promises';
import { extname, basename, dirname, join } from 'node:path';
import XMLBuilder from 'fast-xml-builder';

import {
  AnyCoverageObject,
  LcovCoverageObject,
  HtmlCoverageObject,
  MarkdownCoverageObject,
  GitHubActionsCoverageObject,
} from '../utils/types.js';
import { HandlerRegistry } from '../handlers/HandlerRegistry.js';
import { builderOptions, XML_HEADER_CONFIG } from '../utils/constants.js';
import { XmlReportFormat } from '../utils/types.js';
import { generateHtml } from './generators/generateHtml.js';
import { generateMarkdown } from './generators/generateMarkdown.js';
import { generateGitHubActions } from './generators/generateGitHubActions.js';

function isXmlReportFormat(format: string): format is XmlReportFormat {
  return format in XML_HEADER_CONFIG;
}

/**
 * Dispatch table for formats whose final content is plain text or JSON.
 *
 * The format string is validated at the CLI flag level via the
 * `HandlerRegistry`, and each handler emits the matching coverage object
 * shape, so a runtime cast is safe here. Centralising the dispatch keeps
 * `generateReportContent` to a single decision point and avoids a long
 * chain of `format === ... && isXObject(...)` guards.
 */
const STRING_FORMAT_RENDERERS: Record<string, (obj: AnyCoverageObject) => string> = {
  lcovonly: (obj) => generateLcov(obj as LcovCoverageObject),
  html: (obj) => generateHtml(obj as HtmlCoverageObject),
  markdown: (obj) => generateMarkdown(obj as MarkdownCoverageObject),
  'github-actions': (obj) => generateGitHubActions(obj as GitHubActionsCoverageObject),
  json: (obj) => JSON.stringify(obj, null, 2),
  'json-summary': (obj) => JSON.stringify(obj, null, 2),
  simplecov: (obj) => JSON.stringify(obj, null, 2),
};

export async function generateAndWriteReport(
  outputPath: string,
  coverageObj: AnyCoverageObject,
  format: string,
  formatAmount: number,
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
  const renderer = STRING_FORMAT_RENDERERS[format];
  return renderer ? renderer(coverageObj) : generateXmlContent(coverageObj, format);
}

function generateXmlContent(coverageObj: AnyCoverageObject, format: string): string {
  const isHeadless = isXmlReportFormat(format);
  const builder = new XMLBuilder(builderOptions);
  let xml = builder.build(coverageObj);

  if (isHeadless) {
    xml = xml.replace(/^<\?xml[^>]*>\s*/i, '');
  }

  return prependXmlHeader(xml, format).trimEnd();
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
