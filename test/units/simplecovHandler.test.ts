'use strict';

import { describe, expect, it } from 'vitest';

import { SimpleCovCoverageHandler } from '../../src/handlers/simplecov.js';

describe('SimpleCovCoverageHandler unit tests', () => {
  it('creates array with length equal to the max line number', () => {
    const handler = new SimpleCovCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '5': 0 });
    const result = handler.finalize();
    expect(result.coverage['src/A.cls']).toHaveLength(5);
  });

  it('stores coverage at 0-indexed positions (line N → index N-1)', () => {
    const handler = new SimpleCovCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '3': 0, '5': 1 });
    const result = handler.finalize();
    const arr = result.coverage['src/A.cls'];
    expect(arr[0]).toBe(1); // line 1 → index 0
    expect(arr[2]).toBe(0); // line 3 → index 2
    expect(arr[4]).toBe(1); // line 5 → index 4
  });

  it('fills gaps between line numbers with null', () => {
    const handler = new SimpleCovCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '5': 1 });
    const result = handler.finalize();
    const arr = result.coverage['src/A.cls'];
    expect(arr[1]).toBeNull(); // line 2 (not in coverage data)
    expect(arr[2]).toBeNull(); // line 3
    expect(arr[3]).toBeNull(); // line 4
  });

  it('sorts coverage object by file path in finalize', () => {
    const handler = new SimpleCovCoverageHandler();
    handler.processFile('z/Last.cls', 'Last', { '1': 1 });
    handler.processFile('a/First.cls', 'First', { '1': 1 });
    const result = handler.finalize();
    const keys = Object.keys(result.coverage);
    expect(keys[0]).toBe('a/First.cls');
    expect(keys[1]).toBe('z/Last.cls');
  });

  it('timestamp is a positive integer (seconds)', () => {
    const handler = new SimpleCovCoverageHandler();
    const result = handler.finalize();
    expect(result.timestamp).toBeGreaterThan(0);
    expect(Number.isInteger(result.timestamp)).toBe(true);
  });

  it('timestamp is in seconds not milliseconds (Math.floor(Date.now() / 1000))', () => {
    const handler = new SimpleCovCoverageHandler();
    const result = handler.finalize();
    // Date.now() / 1000 ≈ 1.7e9; Date.now() * 1000 ≈ 1.7e15
    expect(result.timestamp).toBeLessThan(2_000_000_000);
  });

  it('stores hit count (not just 0/1) at line index', () => {
    const handler = new SimpleCovCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '2': 1, '3': 0 });
    const result = handler.finalize();
    const arr = result.coverage['src/A.cls'];
    expect(arr[1]).toBe(1); // line 2 covered
    expect(arr[2]).toBe(0); // line 3 uncovered
  });

  it('handles a single-line file', () => {
    const handler = new SimpleCovCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    const result = handler.finalize();
    const arr = result.coverage['src/A.cls'];
    expect(arr).toHaveLength(1);
    expect(arr[0]).toBe(1);
  });
});
