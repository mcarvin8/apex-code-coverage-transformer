'use strict';

import { availableParallelism } from 'node:os';

export function getConcurrencyThreshold(): number {
  const AVAILABLE_PARALLELISM: number = availableParallelism();

  return Math.min(AVAILABLE_PARALLELISM, 6);
}
