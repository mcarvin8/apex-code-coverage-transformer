'use strict';
/* eslint-disable no-await-in-loop */

import {
  TestCoverageData,
  SonarCoverageObject,
  SonarClass,
  CoberturaPackage,
  CoberturaCoverageObject,
  CoberturaClass,
} from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';
import { generateXml } from './generateXml.js';

export async function transformTestCoverageReport(
  testCoverageData: TestCoverageData[],
  format: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  if (!['sonar', 'cobertura'].includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }

  const warnings: string[] = [];
  let filesProcessed: number = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();

  // Initialize format-specific coverage objects
  let coverageObj: SonarCoverageObject | CoberturaCoverageObject;

  if (format === 'sonar') {
    coverageObj = {
      coverage: { '@version': '1', file: [] },
    } as SonarCoverageObject;
  } else {
    coverageObj = {
      coverage: {
        '@lines-valid': 0,
        '@lines-covered': 0,
        '@line-rate': 0,
        '@branches-valid': 0,
        '@branches-covered': 0,
        '@branch-rate': 1,
        '@timestamp': Date.now(),
        '@complexity': 0,
        '@version': '0.1',
        sources: { source: ['.'] },
        packages: { package: [] },
      },
    } as CoberturaCoverageObject;
  }

  const packageObj =
    format === 'cobertura'
      ? {
          '@name': 'main',
          '@line-rate': 0,
          '@branch-rate': 1,
          classes: { class: [] as CoberturaClass[] },
        }
      : null;

  if (packageObj) {
    (coverageObj as CoberturaCoverageObject).coverage.packages.package.push(packageObj);
  }

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
      handleSonarFormat(relativeFilePath, lines, repoRoot, coverageObj as SonarCoverageObject);
    } else {
      handleCoberturaFormat(
        relativeFilePath,
        formattedFileName,
        lines,
        uncoveredLines,
        coveredLines,
        repoRoot,
        coverageObj as CoberturaCoverageObject,
        packageObj!
      );
    }

    filesProcessed++;
  }
  const xml = generateXml(coverageObj, format);
  return { xml, warnings, filesProcessed };
}

function handleSonarFormat(
  filePath: string,
  lines: Record<string, number>,
  repoRoot: string,
  coverageObj: SonarCoverageObject
): void {
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
  repoRoot: string,
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
