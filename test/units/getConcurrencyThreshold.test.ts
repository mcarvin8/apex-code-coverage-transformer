'use strict';

import { describe, it, expect } from 'vitest';

import { getConcurrencyThreshold } from '../../src/utils/getConcurrencyThreshold.js';

describe('getConcurrencyThreshold', () => {
  it('returns a positive integer', () => {
    const result = getConcurrencyThreshold();
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('returns at most 6', () => {
    const result = getConcurrencyThreshold();
    expect(result).toBeLessThanOrEqual(6);
  });

  it('returns at least 1', () => {
    const result = getConcurrencyThreshold();
    expect(result).toBeGreaterThanOrEqual(1);
  });
});
