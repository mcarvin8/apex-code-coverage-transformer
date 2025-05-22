'use strict';

import { CoverageHandler } from '../utils/types.js';
import { CloverCoverageHandler } from './clover.js';
import { CoberturaCoverageHandler } from './cobertura.js';
import { SonarCoverageHandler } from './sonar.js';
import { LcovCoverageHandler } from './lcov.js';
import { JaCoCoCoverageHandler } from './jacoco.js';

export function getCoverageHandler(format: string): CoverageHandler {
  const handlers: Record<string, CoverageHandler> = {
    sonar: new SonarCoverageHandler(),
    cobertura: new CoberturaCoverageHandler(),
    clover: new CloverCoverageHandler(),
    lcovonly: new LcovCoverageHandler(),
    jacoco: new JaCoCoCoverageHandler(),
  };

  const handler = handlers[format];
  if (!handler) {
    throw new Error(`Unsupported format: ${format}`);
  }
  return handler;
}
