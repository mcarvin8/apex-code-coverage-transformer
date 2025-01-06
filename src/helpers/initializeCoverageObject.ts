'use strict';

import {
  SonarCoverageObject,
  CoberturaCoverageObject,
  CloverCoverageObject,
  CoberturaClass,
  CoberturaPackage,
} from './types.js';

type CoverageFactory = () => {
  coverageObj: SonarCoverageObject | CoberturaCoverageObject | CloverCoverageObject;
  packageObj: CoberturaPackage | null;
};

const coverageFactories: Record<string, CoverageFactory> = {
  sonar: () => ({
    coverageObj: {
      coverage: { '@version': '1', file: [] },
    } as SonarCoverageObject,
    packageObj: null,
  }),

  cobertura: () => {
    const coverageObj = {
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

    const packageObj: CoberturaPackage = {
      '@name': 'main',
      '@line-rate': 0,
      '@branch-rate': 1,
      classes: { class: [] as CoberturaClass[] },
    };

    coverageObj.coverage.packages.package.push(packageObj);

    return { coverageObj, packageObj };
  },

  clover: () => ({
    coverageObj: {
      coverage: {
        '@generated': Date.now(),
        '@clover': '3.2.0',
        project: {
          '@timestamp': Date.now(),
          '@name': 'All files',
          metrics: {
            '@statements': 0,
            '@coveredstatements': 0,
            '@conditionals': 0,
            '@coveredconditionals': 0,
            '@methods': 0,
            '@coveredmethods': 0,
            '@elements': 0,
            '@coveredelements': 0,
            '@complexity': 0,
            '@loc': 0,
            '@ncloc': 0,
            '@packages': 1,
            '@files': 0,
            '@classes': 0,
          },
          file: [],
        },
      },
    } as CloverCoverageObject,
    packageObj: null,
  }),
};

export function initializeCoverageObject(format: string): {
  coverageObj: SonarCoverageObject | CoberturaCoverageObject | CloverCoverageObject;
  packageObj: CoberturaPackage | null;
} {
  const factory = coverageFactories[format];
  if (!factory) {
    throw new Error(`Unsupported format: ${format}`);
  }
  return factory();
}
