'use strict';
/* eslint-disable no-await-in-loop */

import { create } from 'xmlbuilder2';
import { TestCoverageData, SonarCoverageObject, SonarClass, CoberturaCoverageObject, CoberturaClass } from './types.js';
import { getPackageDirectories } from './getPackageDirectories.js';
import { findFilePath } from './findFilePath.js';
import { normalizePathToUnix } from './normalizePathToUnix.js';

export async function transformTestCoverageReport(
  testCoverageData: TestCoverageData[],
  format: string
): Promise<{ xml: string; warnings: string[]; filesProcessed: number }> {
  const warnings: string[] = [];
  let filesProcessed: number = 0;
  const { repoRoot, packageDirectories } = await getPackageDirectories();
  let coverageData = testCoverageData;
  if (!Array.isArray(coverageData)) {
    coverageData = [coverageData];
  }

  if (format === 'sonar') {
    const coverageObj: SonarCoverageObject = { coverage: { '@version': '1', file: [] } };

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

      const fileObj: SonarClass = {
        '@path': normalizePathToUnix(relativeFilePath),
        lineToCover: [],
      };

      for (const [lineNumber, isCovered] of Object.entries(lines)) {
        fileObj.lineToCover.push({
          '@lineNumber': Number(lineNumber),
          '@covered': `${isCovered === 1}`,
        });
      }
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
            ...coveredLines.map((lineNumber) => ({
              '@number': lineNumber,
              '@hits': 1,
              '@branch': 'false',
            })),
          ],
        },
      };

      // Update package and overall coverage metrics
      coberturaObj.coverage['@lines-valid'] += uncoveredLines.length + coveredLines.length;
      coberturaObj.coverage['@lines-covered'] += coveredLines.length;

      packageObj.classes.class.push(classObj);
      filesProcessed++;
    }

    // Update overall line-rate for the package
    packageObj['@line-rate'] = parseFloat(
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
