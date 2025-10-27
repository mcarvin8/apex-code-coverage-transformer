/* eslint-disable no-await-in-loop */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { strictEqual } from 'node:assert';

import { formatOptions } from '../../src/utils/constants.js';
import { getExtensionForFormat } from '../../src/transformers/reportGenerator.js';
import {
  jacocoBaselinePath,
  lcovBaselinePath,
  sonarBaselinePath,
  cloverBaselinePath,
  coberturaBaselinePath,
  inputJsons,
  jsonBaselinePath,
  jsonSummaryBaselinePath,
  simplecovBaselinePath,
  opencoverBaselinePath,
} from './testConstants.js';
import { normalizeCoverageReport } from './normalizeCoverageReport.js';

export async function compareToBaselines(): Promise<void> {
  const baselineMap = {
    sonar: sonarBaselinePath,
    lcovonly: lcovBaselinePath,
    jacoco: jacocoBaselinePath,
    cobertura: coberturaBaselinePath,
    clover: cloverBaselinePath,
    json: jsonBaselinePath,
    'json-summary': jsonSummaryBaselinePath,
    simplecov: simplecovBaselinePath,
    opencover: opencoverBaselinePath,
  } as const;

  const normalizationRequired = new Set(['cobertura', 'clover', 'json', 'json-summary', 'simplecov', 'opencover']);
  const jsonFormats = new Set(['json', 'json-summary', 'simplecov']);

  for (const format of formatOptions as Array<keyof typeof baselineMap>) {
    for (const { label } of inputJsons) {
      const reportExtension = getExtensionForFormat(format);
      const outputPath = resolve(`${label}-${format}${reportExtension}`);
      const outputContent = await readFile(outputPath, 'utf-8');
      const baselineContent = await readFile(baselineMap[format], 'utf-8');

      if (normalizationRequired.has(format)) {
        const isJson = jsonFormats.has(format);
        strictEqual(
          normalizeCoverageReport(outputContent, isJson),
          normalizeCoverageReport(baselineContent, isJson),
          `Mismatch between ${outputPath} and ${baselineMap[format]}`
        );
      } else {
        strictEqual(outputContent, baselineContent, `Mismatch between ${outputPath} and ${baselineMap[format]}`);
      }
    }
  }
}
