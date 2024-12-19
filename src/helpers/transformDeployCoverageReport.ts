'use strict';
/* eslint-disable no-await-in-loop */

import {
  DeployCoverageData,
  SonarCoverageObject,
  CoberturaCoverageObject,
  SonarClass,
  CoberturaClass,
  CoberturaPackage,
} from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { setCoveredLinesSonar } from './setCoveredLinesSonar.js';
import { setCoveredLinesCobertura } from './setCoveredLinesCobertura.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';
import { generateXml } from './generateXml.js';

export async function transformDeployCoverageReport(
  data: DeployCoverageData,
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
    } else {
      await handleCoberturaFormat(
        relativeFilePath,
        formattedFileName,
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
