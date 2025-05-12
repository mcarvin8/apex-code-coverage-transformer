'use strict';

import { CoverageHandler } from '../helpers/types.js';
import { CloverCoverageHandler } from './cloverCoverageHandler.js';
import { CoberturaCoverageHandler } from './coberturaCoverageHandler.js';
import { SonarCoverageHandler } from './sonarCoverageHandler.js';
import { LcovCoverageHandler } from './lcovCoverageHandler.js';
import { IstanbulJsonCoverageHandler } from './jsonCoverageHandler.js';
import { JaCoCoCoverageHandler } from './jacocoCoverageHandler.js';

export function getCoverageHandler(format: string): CoverageHandler {
  const handlers: Record<string, CoverageHandler> = {
    sonar: new SonarCoverageHandler(),
    cobertura: new CoberturaCoverageHandler(),
    clover: new CloverCoverageHandler(),
    lcovonly: new LcovCoverageHandler(),
    jacoco: new JaCoCoCoverageHandler(),
    json: new IstanbulJsonCoverageHandler(),
  };

  const handler = handlers[format];
  if (!handler) {
    throw new Error(`Unsupported format: ${format}`);
  }
  return handler;
}
