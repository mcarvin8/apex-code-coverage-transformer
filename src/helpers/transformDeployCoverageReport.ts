'use strict';
/* eslint-disable no-await-in-loop */

import { create } from 'xmlbuilder2';
import {
  DeployCoverageData,
  SonarCoverageObject,
  CoberturaCoverageObject,
  SonarClass,
  CoberturaClass,
} from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { setCoveredLinesSonar } from './setCoveredLinesSonar.js';
import { setCoveredLinesCobertura } from './setCoveredLinesCobertura.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export async function transformDeployCoverageReport(
  data: DeployCoverageData,
  format: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const warnings: string[] = [];
  let filesProcessed: number = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();

  if (format === 'sonar') {
    const coverageObj: SonarCoverageObject = { coverage: { '@version': '1', file: [] } };

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

      const fileObj: SonarClass = {
        '@path': normalizePathToUnix(relativeFilePath),
        lineToCover: uncoveredLines.map((lineNumber: number) => ({
          '@lineNumber': lineNumber,
          '@covered': 'false',
        })),
      };

      await setCoveredLinesSonar(coveredLines, uncoveredLines, repoRoot, relativeFilePath, fileObj);
      filesProcessed++;
      coverageObj.coverage.file.push(fileObj);
    }
    const xml = create(coverageObj).end({ prettyPrint: true, indent: '  ' });
    return { xml, warnings, filesProcessed };
  } else if (format === 'cobertura') {
    const coberturaObj: CoberturaCoverageObject = {
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
    };

    // Single package for all classes
    const packageObj = {
      '@name': 'main',
      '@line-rate': 0,
      '@branch-rate': 1,
      classes: { class: [] as CoberturaClass[] },
    };
    coberturaObj.coverage.packages.package.push(packageObj);

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

      const classObj: CoberturaClass = {
        '@name': formattedFileName,
        '@filename': normalizePathToUnix(relativeFilePath),
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

      await setCoveredLinesCobertura(coveredLines, uncoveredLines, repoRoot, relativeFilePath, classObj);

      // Update package and overall coverage metrics
      coberturaObj.coverage['@lines-valid'] += uncoveredLines.length + coveredLines.length;
      coberturaObj.coverage['@lines-covered'] += coveredLines.length;

      packageObj.classes.class.push(classObj);
      filesProcessed++;
    }

    // Update overall line-rate for the package
    packageObj['@line-rate'] = Number(
      (coberturaObj.coverage['@lines-covered'] / coberturaObj.coverage['@lines-valid']).toFixed(4)
    );
    coberturaObj.coverage['@line-rate'] = packageObj['@line-rate'];

    let xml = create(coberturaObj).end({ prettyPrint: true, indent: '  ', headless: true });

    // Add DOCTYPE declaration at the beginning of the XML
    xml = `<?xml version="1.0" ?>\n<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">\n${xml}`;
    return { xml, warnings, filesProcessed };
  }

  throw new Error(`Unsupported format: ${format}`);
}
