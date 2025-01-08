'use strict';

import { CoverageHandler } from '../helpers/types.js';
import { CloverCoverageHandler } from './cloverCoverageHandler.js';
import { CoberturaCoverageHandler } from './coberturaCoverageHandler.js';
import { SonarCoverageHandler } from './sonarCoverageHandler.js';
import { LcovCoverageHandler } from './lcovCoverageHandler.js';

export function getCoverageHandler(format: string): CoverageHandler {
  const handlers: Record<string, CoverageHandler> = {
    sonar: new SonarCoverageHandler(),
    cobertura: new CoberturaCoverageHandler(),
    clover: new CloverCoverageHandler(),
    lcovonly: new LcovCoverageHandler(),
  };

  const handler = handlers[format];
  if (!handler) {
    throw new Error(`Unsupported format: ${format}`);
  }
  return handler;
}
