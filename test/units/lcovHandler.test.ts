'use strict';

import { describe, it, expect } from 'vitest';

import { LcovCoverageHandler } from '../../src/handlers/lcov.js';

describe('LcovCoverageHandler unit tests', () => {
  it('sets hitCount=1 for covered lines, hitCount=0 for uncovered', () => {
    const handler = new LcovCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '2': 0 });
    const result = handler.finalize();
    const { lines } = result.files[0];
    const line1 = lines.find((l) => l.lineNumber === 1);
    const line2 = lines.find((l) => l.lineNumber === 2);
    expect(line1?.hitCount).toBe(1);
    expect(line2?.hitCount).toBe(0);
  });

  it('records correct line numbers in lines array', () => {
    const handler = new LcovCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '5': 1, '10': 0, '15': 1 });
    const result = handler.finalize();
    const nums = result.files[0].lines.map((l) => l.lineNumber);
    expect(nums).toContain(5);
    expect(nums).toContain(10);
    expect(nums).toContain(15);
  });

  it('calculates totalLines and coveredLines correctly', () => {
    const handler = new LcovCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '2': 0, '3': 1, '4': 1 });
    const result = handler.finalize();
    expect(result.files[0].totalLines).toBe(4);
    expect(result.files[0].coveredLines).toBe(3);
  });

  it('sets sourceFile to the filePath argument', () => {
    const handler = new LcovCoverageHandler();
    handler.processFile('force-app/classes/Foo.cls', 'Foo', { '1': 1 });
    const result = handler.finalize();
    expect(result.files[0].sourceFile).toBe('force-app/classes/Foo.cls');
  });

  it('sorts files by sourceFile in finalize', () => {
    const handler = new LcovCoverageHandler();
    handler.processFile('z/Last.cls', 'Last', { '1': 1 });
    handler.processFile('a/First.cls', 'First', { '1': 1 });
    handler.processFile('m/Middle.cls', 'Middle', { '1': 1 });
    const result = handler.finalize();
    expect(result.files[0].sourceFile).toBe('a/First.cls');
    expect(result.files[1].sourceFile).toBe('m/Middle.cls');
    expect(result.files[2].sourceFile).toBe('z/Last.cls');
  });

  it('handles empty lines object with zero totals', () => {
    const handler = new LcovCoverageHandler();
    handler.processFile('src/Empty.cls', 'Empty', {});
    const result = handler.finalize();
    expect(result.files[0].totalLines).toBe(0);
    expect(result.files[0].coveredLines).toBe(0);
    expect(result.files[0].lines).toEqual([]);
  });

  it('accumulates multiple files', () => {
    const handler = new LcovCoverageHandler();
    handler.processFile('a/A.cls', 'A', { '1': 1 });
    handler.processFile('b/B.cls', 'B', { '1': 0 });
    const result = handler.finalize();
    expect(result.files).toHaveLength(2);
  });
});
