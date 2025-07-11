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
  } as const;

  const normalizationRequired = new Set(['cobertura', 'clover']);

  for (const format of formatOptions as Array<keyof typeof baselineMap>) {
    for (const { label } of inputJsons) {
      const reportExtension = getExtensionForFormat(format);
      const outputPath = resolve(`${label}-${format}${reportExtension}`);
      const outputContent = await readFile(outputPath, 'utf-8');
      const baselineContent = await readFile(baselineMap[format], 'utf-8');

      if (normalizationRequired.has(format)) {
        strictEqual(
          normalizeCoverageReport(outputContent),
          normalizeCoverageReport(baselineContent),
          `Mismatch between ${outputPath} and ${baselineMap[format]}`
        );
      } else {
        strictEqual(outputContent, baselineContent, `Mismatch between ${outputPath} and ${baselineMap[format]}`);
      }
    }
  }
}
