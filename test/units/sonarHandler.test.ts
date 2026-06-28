'use strict';

import { describe, expect, it } from 'vitest';

import { SonarCoverageHandler } from '../../src/handlers/sonar.js';

describe('SonarCoverageHandler unit tests', () => {
  it('sets @covered=true for lines with hit count 1', () => {
    const handler = new SonarCoverageHandler();
    handler.processFile('src/Foo.cls', 'Foo', { '5': 1 });
    const result = handler.finalize();
    const lineToCover = result.coverage.file[0].lineToCover;
    expect(lineToCover[0]['@covered']).toBe(true);
  });

  it('sets @covered=false for lines with hit count 0', () => {
    const handler = new SonarCoverageHandler();
    handler.processFile('src/Foo.cls', 'Foo', { '5': 0 });
    const result = handler.finalize();
    const lineToCover = result.coverage.file[0].lineToCover;
    expect(lineToCover[0]['@covered']).toBe(false);
  });

  it('records correct @lineNumber for each line', () => {
    const handler = new SonarCoverageHandler();
    handler.processFile('src/Foo.cls', 'Foo', { '10': 1, '20': 0, '30': 1 });
    const result = handler.finalize();
    const lineNumbers = result.coverage.file[0].lineToCover.map((l) => l['@lineNumber']);
    expect(lineNumbers).toContain(10);
    expect(lineNumbers).toContain(20);
    expect(lineNumbers).toContain(30);
  });

  it('accumulates multiple files', () => {
    const handler = new SonarCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    handler.processFile('src/B.cls', 'B', { '2': 0 });
    const result = handler.finalize();
    expect(result.coverage.file).toHaveLength(2);
  });

  it('sorts files by @path in finalize', () => {
    const handler = new SonarCoverageHandler();
    handler.processFile('z/Last.cls', 'Last', { '1': 1 });
    handler.processFile('a/First.cls', 'First', { '1': 1 });
    handler.processFile('m/Middle.cls', 'Middle', { '1': 1 });
    const result = handler.finalize();
    expect(result.coverage.file[0]['@path']).toBe('a/First.cls');
    expect(result.coverage.file[1]['@path']).toBe('m/Middle.cls');
    expect(result.coverage.file[2]['@path']).toBe('z/Last.cls');
  });

  it('version is set to "1"', () => {
    const handler = new SonarCoverageHandler();
    const result = handler.finalize();
    expect(result.coverage['@version']).toBe('1');
  });

  it('produces no lineToCover entries for an empty lines object', () => {
    const handler = new SonarCoverageHandler();
    handler.processFile('src/Empty.cls', 'Empty', {});
    const result = handler.finalize();
    expect(result.coverage.file[0].lineToCover).toEqual([]);
  });
});
