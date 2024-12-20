'use strict';
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

import {
  TestCoverageData,
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
import { normalizePathToUnix } from './normalizePathToUnix.js';
import { generateXml } from './generateXml.js';
import { formatOptions } from './constants.js';
import { initializeCoverageObject } from './initializeCoverageObject.js';

export async function transformTestCoverageReport(
  testCoverageData: TestCoverageData[],
  format: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  if (!formatOptions.includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }

  const warnings: string[] = [];
  let filesProcessed: number = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();

  const { coverageObj, packageObj } = initializeCoverageObject(format);

  let coverageData = testCoverageData;
  if (!Array.isArray(coverageData)) {
    coverageData = [coverageData];
  }

  for (const data of coverageData) {
    const name = data?.name;
    const lines = data?.lines;

    if (!name || !lines) continue;

    const formattedFileName = name.replace(/no-map[\\/]+/, '');
    const relativeFilePath = await findFilePath(formattedFileName, packageDirectories, repoRoot);
    if (relativeFilePath === undefined) {
      warnings.push(`The file name ${formattedFileName} was not found in any package directory.`);
      continue;
    }

    const uncoveredLines = Object.entries(lines)
      .filter(([, isCovered]) => isCovered === 0)
      .map(([lineNumber]) => Number(lineNumber));
    const coveredLines = Object.entries(lines)
      .filter(([, isCovered]) => isCovered === 1)
      .map(([lineNumber]) => Number(lineNumber));

    if (format === 'sonar') {
      handleSonarFormat(relativeFilePath, lines, coverageObj as SonarCoverageObject);
    } else if (format === 'cobertura') {
      handleCoberturaFormat(
        relativeFilePath,
        formattedFileName,
        lines,
        uncoveredLines,
        coveredLines,
        coverageObj as CoberturaCoverageObject,
        packageObj!
      );
    } else {
      handleCloverFormat(
        relativeFilePath,
        formattedFileName,
        lines,
        uncoveredLines,
        coveredLines,
        coverageObj as CloverCoverageObject
      );
    }

    filesProcessed++;
  }
  const xml = generateXml(coverageObj, format);
  return { xml, warnings, filesProcessed };
}

function handleSonarFormat(filePath: string, lines: Record<string, number>, coverageObj: SonarCoverageObject): void {
  const fileObj: SonarClass = {
    '@path': normalizePathToUnix(filePath),
    lineToCover: [],
  };

  for (const [lineNumber, isCovered] of Object.entries(lines)) {
    fileObj.lineToCover.push({
      '@lineNumber': Number(lineNumber),
      '@covered': `${isCovered === 1}`,
    });
  }

  coverageObj.coverage.file.push(fileObj);
}

function handleCoberturaFormat(
  filePath: string,
  fileName: string,
  lines: Record<string, number>,
  uncoveredLines: number[],
  coveredLines: number[],
  coverageObj: CoberturaCoverageObject,
  packageObj: CoberturaPackage
): void {
  const classObj: CoberturaClass = {
    '@name': fileName,
    '@filename': normalizePathToUnix(filePath),
    '@line-rate': (coveredLines.length / (coveredLines.length + uncoveredLines.length)).toFixed(4),
    '@branch-rate': '1',
    methods: {},
    lines: {
      line: [],
    },
  };

  for (const [lineNumber, isCovered] of Object.entries(lines)) {
    classObj.lines.line.push({
      '@number': Number(lineNumber),
      '@hits': isCovered === 1 ? 1 : 0,
      '@branch': 'false',
    });
  }

  coverageObj.coverage['@lines-valid'] += uncoveredLines.length + coveredLines.length;
  coverageObj.coverage['@lines-covered'] += coveredLines.length;
  packageObj.classes.class.push(classObj);

  packageObj['@line-rate'] = Number(
    (coverageObj.coverage['@lines-covered'] / coverageObj.coverage['@lines-valid']).toFixed(4)
  );
  coverageObj.coverage['@line-rate'] = packageObj['@line-rate'];
}

function handleCloverFormat(
  filePath: string,
  fileName: string,
  lines: Record<string, number>,
  uncoveredLines: number[],
  coveredLines: number[],
  coverageObj: CloverCoverageObject
): void {
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
    line: [],
  };

  for (const [lineNumber, isCovered] of Object.entries(lines)) {
    cloverFile.line.push({
      '@num': Number(lineNumber),
      '@count': isCovered === 1 ? 1 : 0,
      '@type': 'stmt',
    });
  }

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
