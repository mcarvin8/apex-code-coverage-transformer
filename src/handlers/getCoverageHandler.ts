'use strict';
/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */

import { CoverageHandler } from '../helpers/types.js';
import { CloverCoverageHandler } from './cloverCoverageHandler.js';
import { CoberturaCoverageHandler } from './coberturaCoverageHandler.js';
import { SonarCoverageHandler } from './sonarCoverageHandler.js';

export function getCoverageHandler(format: string): CoverageHandler {
  const handlers: Record<string, CoverageHandler> = {
    sonar: new SonarCoverageHandler(),
    cobertura: new CoberturaCoverageHandler(),
    clover: new CloverCoverageHandler(),
  };

  const handler = handlers[format];
  if (!handler) {
    throw new Error(`Unsupported format: ${format}`);
  }
  return handler;
}
