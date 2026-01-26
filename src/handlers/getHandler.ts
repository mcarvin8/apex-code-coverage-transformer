'use strict';

import { CoverageHandler } from '../utils/types.js';
import { HandlerRegistry } from './HandlerRegistry.js';

// Import all handlers to trigger self-registration
import './sonar.js';
import './cobertura.js';
import './clover.js';
import './lcov.js';
import './jacoco.js';
import './istanbulJson.js';
import './jsonSummary.js';
import './simplecov.js';
import './opencover.js';
import './html.js';

/**
 * Get a coverage handler for the specified format.
 *
 * This function uses the HandlerRegistry to retrieve the appropriate handler.
 * All handlers are automatically registered when this module is imported.
 *
 * @param format - The coverage format identifier
 * @returns A new instance of the coverage handler
 * @throws Error if the format is not supported
 *
 * @example
 * const handler = getCoverageHandler('sonar');
 * handler.processFile('path/to/file.cls', 'ClassName', { '1': 1, '2': 0 });
 * const report = handler.finalize();
 */
export function getCoverageHandler(format: string): CoverageHandler {
  return HandlerRegistry.get(format);
}
