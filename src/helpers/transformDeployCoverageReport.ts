'use strict';
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

import {
  DeployCoverageData,
  SonarCoverageObject,
  CoberturaCoverageObject,
  CloverCoverageObject,
  SonarClass,
  CoberturaClass,
  CoberturaPackage,
  CloverFile,
} from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { setCoveredLinesSonar } from './setCoveredLinesSonar.js';
import { setCoveredLinesCobertura } from './setCoveredLinesCobertura.js';
import { setCoveredLinesClover } from './setCoveredLinesClover.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';
import { generateXml } from './generateXml.js';
import { formatOptions } from './constants.js';
import { initializeCoverageObject } from './initializeCoverageObject.js';

export async function transformDeployCoverageReport(
  data: DeployCoverageData,
  format: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  if (!formatOptions.includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }

  const warnings: string[] = [];
  let filesProcessed: number = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();

  const { coverageObj, packageObj } = initializeCoverageObject(format);

  for (const fileName in data) {
    if (!Object.hasOwn(data, fileName)) continue;

    const fileInfo = data[fileName];
    const formattedFileName = fileName.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);

    if (relativeFilePath === undefined) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      continue;
    }

    const uncoveredLines = Object.keys(fileInfo.s)
      .filter((lineNumber) => fileInfo.s[lineNumber] === 0)
      .map(Number);
    const coveredLines = Object.keys(fileInfo.s)
      .filter((lineNumber) => fileInfo.s[lineNumber] === 1)
      .map(Number);

    if (format === 'sonar') {
      await handleSonarFormat(
        relativeFilePath,
        uncoveredLines,
        coveredLines,
        repoRoot,
        coverageObj as SonarCoverageObject
      );
    } else if (format === 'cobertura') {
      await handleCoberturaFormat(
        relativeFilePath,
        formattedFileName,
        uncoveredLines,
        coveredLines,
        repoRoot,
        coverageObj as CoberturaCoverageObject,
        packageObj!
      );
    } else {
      await handleCloverFormat(
        relativeFilePath,
        formattedFileName,
        uncoveredLines,
        coveredLines,
        repoRoot,
        coverageObj as CloverCoverageObject
      );
    }

    filesProcessed++;
  }

  const xml = generateXml(coverageObj, format);
  return { xml, warnings, filesProcessed };
}

async function handleSonarFormat(
  filePath: string,
  uncoveredLines: number[],
  coveredLines: number[],
  repoRoot: string,
  coverageObj: SonarCoverageObject
): Promise<void> {
  const fileObj: SonarClass = {
    '@path': normalizePathToUnix(filePath),
    lineToCover: uncoveredLines.map((lineNumber) => ({
      '@lineNumber': lineNumber,
      '@covered': 'false',
    })),
  };

  await setCoveredLinesSonar(coveredLines, uncoveredLines, repoRoot, filePath, fileObj);
  coverageObj.coverage.file.push(fileObj);
}

async function handleCoberturaFormat(
  filePath: string,
  fileName: string,
  uncoveredLines: number[],
  coveredLines: number[],
  repoRoot: string,
  coverageObj: CoberturaCoverageObject,
  packageObj: CoberturaPackage
): Promise<void> {
  const classObj: CoberturaClass = {
    '@name': fileName,
    '@filename': normalizePathToUnix(filePath),
    '@line-rate': (coveredLines.length / (coveredLines.length + uncoveredLines.length)).toFixed(4),
    '@branch-rate': '1',
    methods: {},
    lines: {
      line: [
        ...uncoveredLines.map((lineNumber) => ({
          '@number': lineNumber,
          '@hits': 0,
          '@branch': 'false',
        })),
      ],
    },
  };

  await setCoveredLinesCobertura(coveredLines, uncoveredLines, repoRoot, filePath, classObj);

  coverageObj.coverage['@lines-valid'] += uncoveredLines.length + coveredLines.length;
  coverageObj.coverage['@lines-covered'] += coveredLines.length;
  packageObj.classes.class.push(classObj);

  packageObj['@line-rate'] = Number(
    (coverageObj.coverage['@lines-covered'] / coverageObj.coverage['@lines-valid']).toFixed(4)
  );
  coverageObj.coverage['@line-rate'] = packageObj['@line-rate'];
}

async function handleCloverFormat(
  filePath: string,
  fileName: string,
  uncoveredLines: number[],
  coveredLines: number[],
  repoRoot: string,
  coverageObj: CloverCoverageObject
): Promise<void> {
  const cloverFile: CloverFile = {
    '@name': fileName,
    '@path': normalizePathToUnix(filePath),
    metrics: {
      '@statements': uncoveredLines.length + coveredLines.length,
      '@coveredstatements': coveredLines.length,
      '@conditionals': 0,
      '@coveredconditionals': 0,
      '@methods': 0,
      '@coveredmethods': 0,
    },
    line: [
      ...uncoveredLines.map((lineNumber) => ({
        '@num': lineNumber,
        '@count': 0,
        '@type': 'stmt',
      })),
    ],
  };

  await setCoveredLinesClover(coveredLines, uncoveredLines, repoRoot, filePath, cloverFile);

  coverageObj.coverage.project.file.push(cloverFile);
  const projectMetrics = coverageObj.coverage.project.metrics;

  projectMetrics['@statements'] += uncoveredLines.length + coveredLines.length;
  projectMetrics['@coveredstatements'] += coveredLines.length;
  projectMetrics['@elements'] += uncoveredLines.length + coveredLines.length;
  projectMetrics['@coveredelements'] += coveredLines.length;
  projectMetrics['@files'] += 1;
  projectMetrics['@classes'] += 1;
  projectMetrics['@loc'] += uncoveredLines.length + coveredLines.length;
  projectMetrics['@ncloc'] += uncoveredLines.length + coveredLines.length;
}
